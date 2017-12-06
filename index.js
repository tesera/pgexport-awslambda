'use strict';
var PGExport = require('./lib/pg-export');

exports.handler = function (event, context, callback) {

    var options = {
        bucket: process.env.bucket,
        key: event.key,
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
            callback(null, result);
        })
        .fail(callback);
};
