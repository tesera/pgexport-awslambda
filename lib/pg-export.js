'use strict';
var aws = require('aws-sdk');
var pgp = require('pg-promise')();
var admZip = require('adm-zip');
var Q = require('q');
var _ = require('underscore');
var _str = require('underscore.string');
var uuid = require('uuid');
var RDSIngress = require('./rds-ingress');

var PGExport = function (options) {
    this.bucket = options.bucket;
    this.rds = options.rds;
    this.folder = options.folder;
    this.pgurl = options.pgurl;
}

PGExport.prototype.exportData = function (queries) {
    var self = this;
    self.key = self.folder + '/' + uuid.v4() + '.zip';
    var db = pgp(self.pgurl);
    var rdsIngress = new RDSIngress(self.rds);
    var fileUrl = '';

   function csvExport(filename, query){
        console.log('querying database with: ', query);
        return db.query(query, undefined, queryResult.many)
            .then(function (rows) {
                console.log('query returned for %s with %s rows', query, rows.length);
                var csv = rows.reduce(function (memo, row) { return [memo, row.result].join('\n') }, '');
                return {
                    filename: filename,
                    data: csv
                };
            }, function (err) { console.log(err) });
    }

    return rdsIngress.authorizeMe()
        .then(function () {
            var csvExports = queries.map(function (query) {
                return csvExport(query.filename, query.sql);
            });
            return Q.allSettled(csvExports);
        })
        .then(function (results) {
            console.log('zipping %s files', results.length);
            results = _.groupBy(results, 'state');
            var zip = results.fulfilled.reduce(function (zip, row) {
                if (row.value != null)
                    zip.addFile(row.value.filename, row.value.data);
                return zip;
            }, new admZip());

            var params = {
                Bucket: self.bucket,
                Key: self.key,
                ContentType: 'application/zip',
                Body: zip.toBuffer()
            };
            var s3 = new aws.S3();

            console.log('uploading zip file to s3');
            return Q.nbind(s3.upload, s3)(params);
        })
        .then(rdsIngress.revoke.bind(rdsIngress))
        .then(function () {
            console.log(fileUrl);
            return fileUrl;
            context.done(fileUrl, 'Successfully exported data.');
        })
        .fail(function (e) {
            console.log('error in chain: ', e);
            rdsIngress.revoke()
                .then(function () {
                    console.log('rdsIngress revoked ');
                });
        });
};

PGExport.prototype.getExports = function () {

    var self = this;
    var s3 = new aws.S3();
    var params = {
        Bucket: self.bucket
    };
    var urlList = {
        urls: []
    };

    return Q.nbind(s3.listObjects, s3)(params)
        .then(function (results) {
            results.Contents.forEach(function(item) {
                if (_str.startsWith(item.Key, self.folder+'/') && (item.Key.length > self.folder.length+1)) {
                    console.log(_str.splice(item.Key,0,self.folder.length+1,''));
                    urlList.urls.push(_str.splice(item.Key,0,self.folder.length+1,''));
                }
            });
        })
        .then(function () {
            return urlList;
        })
        .fail(function (e) {
            console.log('error in chain: ', e);
        });
};

PGExport.prototype.getExportSignedUrl = function (url) {

    var self = this;
    var s3 = new aws.S3();
    var params = {
        Bucket: self.bucket,
        Key: url
    };

    return Q.nbind(s3.getSignedUrl, s3)('getObject', params)
        .then(function (results) {
            return results;
        })
        .fail(function (e) {
            console.log('error in chain: ', e);
        });

};

module.exports = PGExport;
