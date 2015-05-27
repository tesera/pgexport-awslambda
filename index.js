'use strict';
var aws = require('aws-sdk');
var pgp = require('pg-promise')();
var admZip = require('adm-zip');
var Q = require('q');
var _ = require('underscore');
var PGExport = require('./lib/pg-export');

var RDSIngress = require('./lib/rds-ingress');

exports.handler = function (event, context) {

    var options = {
        bucket: 'pgexport-awslambda',
        rds: event.rds,
        folder: event.folder
    };
    var pgExport = new PGExport(options);

    var actions = {
        exportData: function () {
            return pgExport.exportData(event.queries);
        },
        getExports: function (event) {
            return pgExport.getExports();
        },
        getExportSignedUrl: function (event) {
            // aws s3 get signed url
            var options = {
                bucket: 'pgexport-awslambda',
                key: event.key
            };
            // var s3 = new AWS.S3();
            // var params = {Bucket: 'myBucket', Key: 'myKey'};
            // s3.getSignedUrl('getObject', params, function (err, url) {
            //   console.log("The URL is", url);
            // });
        }
    };

    actions[event.action](event)
        .then(function (result) {
            console.log(event.action + ' succeeded ')
            context.done(null, result);
        })
        .fail(context.done);
};
