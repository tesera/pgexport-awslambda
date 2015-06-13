'use strict';
var aws = require('aws-sdk');
var pgp = require('pg-promise')();
var admZip = require('adm-zip');
var Q = require('q');
var _ = require('underscore');
var RDSIngress = require('./rds-ingress');
var stringify = require('csv-stringify');

var PGExport = function (options) {
    var self = this;
    self.bucket = options.bucket;
    self.key = options.key;
    self.rds = options.rds;
    self.pgurl = options.pgurl;
    self.filters = options.filters;
    self.s3 = new aws.S3({ params: { Bucket: self.bucket } });

    if(self.key) {
        self.slugs = self.key.split('/').filter(function (s) { return s; });
        self.root = self.slugs.slice(0, -1).join('/');
    }

    self.list = Q.nbind(self.s3.listObjects, self.s3);
    self.get = Q.nbind(self.s3.getObject, self.s3);
    self.url = Q.nbind(self.s3.getSignedUrl, self.s3);
    self.put = Q.nbind(self.s3.putObject, self.s3);
};

PGExport.prototype.exportData = function (queries) {
    var self = this;
    var db = pgp(self.pgurl);
    var rdsIngress = new RDSIngress(self.rds);
    var fileUrl = '';

   function csvExport(filename, query){
        console.log('querying database with: ', query);

        return db.query(query)
            .then(function (rows) {
                console.log('query returned for %s with %s rows', query, rows.length);
                return Q.denodeify(stringify)(rows, {header: true});
            })
            .then(function (csv) {
                return {
                    filename: filename,
                    data: csv
                };
            });
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
                if (row.value) {
                    zip.addFile(row.value.filename, row.value.data);
                }
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
                title: self.slugs[3],
                filters: JSON.stringify(self.filters)
            };

            return self.put({Key: self.root + '/meta.json', Body: JSON.stringify(self.meta), ContentType: 'application/json'});
        })
        .then(function () {
            console.log(fileUrl);
            return fileUrl;
        })
        .fail(function (e) {
            console.log('error in chain: ', e);
            rdsIngress.revoke()
                .then(function () {
                    console.log('rdsIngress revoked ');
                });
        });
};

PGExport.prototype.getExports = function (prefix) {
    var self = this;

    function filter(data) {
        return _.chain(data.Contents)
            .filter(function (o) {
                return /meta.json$/.test(o.Key);
            })
            .map(function (u) {
                return u.Key;
            })
            .value();
    }

    var exports = self.list({Prefix: prefix})
        .then(filter)
        .then(function (keys) {
            return keys.map(function (key) {
                return self.get({Key: key})
                    .then(function (data) {
                        var meta = JSON.parse(data.Body.toString('utf8'));
                        meta.key = key.replace('meta.json', meta.title);
                        return meta;
                    });
            });
        });

    return Q.allSettled(exports)
        .then(function (results) {
            return results.map(function (r) {
                return r.value;
            });
        })
        .then(function(data) {
            return data;
        });
};


PGExport.prototype.getExportSignedUrl = function (key) {
    var self = this;

    return self.url('getObject', {Key: key})
        .then(function(url) {
            return {
                key: key,
                url: url
            };
        });
};

module.exports = PGExport;
