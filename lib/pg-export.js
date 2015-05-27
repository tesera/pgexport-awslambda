'use strict';
var aws = require('aws-sdk');
var pgp = require('pg-promise')();
var admZip = require('adm-zip');
var Q = require('q');
var _ = require('underscore');
var s = require('underscore.string');
var RDSIngress = require('./rds-ingress');
var uuid = require('uuid');

var PGExport = function (options) {
    this.bucket = options.bucket;
    this.key = options.folder + '/' + uuid.v4() + '.zip';
    this.rds = options.rds;
    this.folder = options.folder;
}

PGExport.prototype.exportData = function (queries) {

    var self = this;
    var db = pgp(this.rds.pgurl);
    var rdsIngress = new RDSIngress(this.rds);
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
        // .then(function (result) {
        //     //console.log(result.Location);
        //     var s3 = new aws.S3();
        //     var params = {
        //         Bucket: self.bucket,
        //         Key: self.key
        //     };
        //     s3.getSignedUrl('getObject', params, function (err, url) {
        //       //console.log("The URL is", url);
        //       fileUrl = url;
        //     });
        // })
        .then(rdsIngress.revoke.bind(rdsIngress))
        .then(function () {
            // var result ={
            //     "message": 'Successfully exported data.',
            //     "fileUrl": fileUrl
            // };
            console.log(fileUrl);
            return fileUrl;
            context.done(fileUrl, 'Successfully exported data.');
        })
        .fail(function (e) {
            console.log('error in chain: ', e);
            rdsIngress.revoke()
                .then(function () {
                    // throw new Error('export failed');
                    context.done(e);
                });
        });
};

PGExport.prototype.getExports = function (queries) {

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
                if (s.startsWith(item.Key, self.folder+'/') && (item.Key.length > self.folder.length+1)) {
                    console.log(s.splice(item.Key,0,self.folder.length+1,''));
                    var params = {
                        Bucket: self.bucket,
                        Key: s.splice(item.Key,0,self.folder.length+1,'')
                    };
                    s3.getSignedUrl('getObject', params, function (err, url) {
                      urlList.urls.push(url);
                    });
                }
            });
        })
        .then(function () {
            return urlList;
            context.done(urlList, 'Successfully exported urls.');
        })
        .fail(function (e) {
            console.log('error in chain: ', e);
            rdsIngress.revoke()
                .then(function () {
                    // throw new Error('export failed');
                    context.done(e);
                });
        });
};

module.exports = PGExport;
