'use strict';
var aws = require('aws-sdk');
var PGExport = require('./lib/pg-export');
//var PGImport = require('./lib/pg-import');

exports.handler = function (event, context) {
    process.env.LD_LIBRARY_PATH = process.env.LAMBDA_TASK_ROOT + '/lib/libpq/lib';
    process.env.PATH = process.env.PATH + ':' + process.env.LAMBDA_TASK_ROOT + '/lib/libpq/lib'

    var options = {
        bucket: event.bucket || 'pgexport-awslambda',
        key: event.key || null,
        rds: event.rds,
        filters: event.filters || {},
        pgurl: event.pgurl,
        action: event.action || 'exportData',
        isArchive: 'archive' in event ? event.archive : true
    };

    var pgExport = new PGExport(options);
    //var pgImport = new PGImport(options);

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
        // importData: function() {
        //     return pgImport.importData(event.queries);
        // }
    };

    actions[options.action](event)
        .then(function (result) {
            console.log(options.action + ' succeeded ');
            context.done(null, result);
        })
        .fail(context.done);
};
