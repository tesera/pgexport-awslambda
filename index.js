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
        key: event.key,
        rds: event.rds,
        filters: event.filters || {},
        pgurl: event.pgurl
    };

    var pgExport = new PGExport(options);

    var actions = {
        exportData: function () {
            return pgExport.exportData(event.queries);
        },
        getExports: function (event) {
            return pgExport.getExports(event.prefix);
        },
        getExportSignedUrl: function (event) {
            return pgExport.getExportSignedUrl(event.key);
        }
    };

    actions[event.action](event)
        .then(function (result) {
            console.log(event.action + ' succeeded ');
            context.done(null, result);
        })
        .fail(context.done);
};
