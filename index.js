'use strict';
var aws = require('aws-sdk');
var pgp = require('pg-promise')();
var admZip = require('adm-zip');
var Q = require('q');
var _ = require('underscore');

var RDSIngress = require('./lib/rds-ingress');

exports.handler = function (event, context) {
    var db = pgp(event.pgurl);
    var rdsIngress = new RDSIngress();

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

    rdsIngress.authorizeMe()
        .then(function () {
            var csvExports = event.queries.map(function (query) {
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
                Bucket: event.bucket,
                Key: event.key,
                ContentType: 'application/zip',
                Body: zip.toBuffer()
            };
            var s3 = new aws.S3();

            console.log('uploading zip file to s3');
            return Q.nbind(s3.upload, s3)(params);
        })
        .then(rdsIngress.revoke.bind(rdsIngress))
        .then(function () {
            context.done(null, 'Successfully exported data.');
        })
        .fail(function (e) {
            console.log('error in chain: ', e);
            rdsIngress.revoke()
                .then(function () {
                    context.done(e);
                });
        });
};
