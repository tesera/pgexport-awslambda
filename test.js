'use strict';
var lambda = require('./index.js');
require('node-env-file')('.env');

var evt = {
    "action": "exportData",
    "key": "yves.richard@tesera.com/psp/506115e2-a17c-44a0-90d0-aefbcea22f68/pgyi-data-export.zip",
    "pgurl": process.env.PGURL,
    "rds": {
      "DBSecurityGroupName": "pg-lambda"
    },
    "queries": [
      {
        "filename": "plot.csv",
        "sql": "SELECT * FROM psp.plot"
      }
    ]
};

// var evt = {
//     "action": "getExports",
//     "prefix": "yves.richard@tesera.com",
// };

// var evt = {
//     "action": "getExportSignedUrl",
//     "key": "yves.richard@tesera.com/reports/66f41e6a-d2e6-4f74-94b9-88d7888ece2d/strata.zip"
// };

var context = {
    done: function(err, data) {
        if(err) console.log('lambda exited with errors: ', err)
        else console.log('lambda exited without errors ', data)
    }
};

lambda.handler(evt, context);
