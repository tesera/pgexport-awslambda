'use strict';
var aws = require('aws-sdk');
var pgp = require('pg-promise')();
var admZip = require('adm-zip');
var Q = require('q');
var _ = require('underscore');
var _str = require('underscore.string');
//var uuid = require('uuid');
var RDSIngress = require('./rds-ingress');

var PGExport = function (options) {
    var self = this;
    self.bucket = options.bucket;
    self.key = options.key;
    self.rds = options.rds;
    self.pgurl = options.pgurl;
    self.s3 = new aws.S3({ params: { Bucket: self.bucket } });

    self.slugs = self.key.split('/').filter(function (s) { return s; });
    self.root = self.slugs.slice(0, -1).join('/');
}

PGExport.prototype.exportData = function (queries) {
    var self = this;
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
            var total_bytes = 0;
            var last_datetime;
            var filename;
            var zip = results.fulfilled.reduce(function (zip, row) {
                if (row.value != null)
                    zip.addFile(row.value.filename, row.value.data);
                return zip;
            }, new admZip());

            var params = {
                Key: self.key,
                ContentType: 'application/zip',
                Body: zip.toBuffer()
            };

            console.log('uploading zip file to s3');
            return Q.nbind(self.s3.upload, self.s3)(params);
        })
        .then(rdsIngress.revoke.bind(rdsIngress))
        .then(function () {
            console.log('writting meta.json');
            self.meta = {
                id: self.slugs[2],
                datetime: new Date().toLocaleString(),
                user: self.slugs[0],
                title: self.slugs[3]
            };
            return self.putMeta();
        })
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
    var metaList = [];


    return Q.nbind(self.s3.listObjects, self.s3)()
        .then(function (results) {
           // results.Contents.forEach(function(item) {

            var getUploadMeta = function () { return Q.nbind(self.getMeta, self.s3)(results.Contents,self.key); };

            getUploadMeta()
                .done(function (result) {
                    console.log(result);
                });
        });
};

PGExport.prototype.getMeta = function(items, key) {
    var self = this;

    var metaList = [];
    items.forEach(function(item) {
        console.log(item.Key);

        var params = {
            Bucket: self.bucket,
            Key: item.Key
        };
        if (_str.startsWith(item.Key, key) && _str.endsWith(item.Key, 'meta.json')) {
            console.log('im here');
            self.s3.getObject(params, function (err, result) {
                console.log(result);

                if(err && err.statusCode === 404) {
                    console.log(err);
                }
                else {
                    console.log(JSON.parse(result.Body.toString('utf8')));
                    metaList.push(JSON.parse(result.Body.toString('utf8')));
                }
            });
        }
    });
    console.log(metaList);
    return metaList;
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

PGExport.prototype.putMeta = function () {
    var self = this;
    var params = {
        Key: self.root + '/meta.json',
        Body: JSON.stringify(self.meta),
        ContentType: 'application/json'
    };
    var putUploadMeta = function () { return Q.nbind(self.s3.putObject, self.s3)(params); };

    return putUploadMeta()
        .then(function () {
            console.log('put upload.json to: ' + params.Key);
        });
};

module.exports = PGExport;
