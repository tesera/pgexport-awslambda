'use strict';
var aws = require('aws-sdk');
var pgp = require('pg-promise')();
var admZip = require('adm-zip');
var Q = require('q');
var _ = require('underscore');
var RDSIngress = require('./rds-ingress');
var uuid = require('uuid');

var PGExport = function (options) {
    this.bucket = options.bucket;
    this.key = uuid.v4() + '.zip';
    this.pgurl = options.pgurl;
    this.DBSecurityGroupName = options.rds.securityGroup;
}

PGExport.prototype.exportData = function (queries) {
    var self = this;
    var db = pgp(this.pgurl);
    var rdsIngress = new RDSIngress();
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
        .then(function (result) {
            fileUrl = result.Location;
        })
        .then(rdsIngress.revoke.bind(rdsIngress))
        .then(function () {
            var result ={
                "message": 'Successfully exported data.',
                "fileUrl": fileUrl
            };

            return result;
        })
        .fail(function (e) {
            console.log('error in chain: ', e);
            rdsIngress.revoke()
                .then(function () {
                    throw new Error('export failed');
                });
        });
};

module.exports = PGExport;
