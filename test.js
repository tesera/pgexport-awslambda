var lambda = require('./index.js');
require('node-env-file')('.env');

var evt = {
    "action": "exportData",
    "folder": "magda",
    "pgurl": process.env.PGURL,
    "rds": {
      "DBSecurityGroupName": "pg-lambda"
    },
    "queries": [
      {
        "filename": "report_full.csv",
        "sql": "SELECT * FROM app.export_report_as_csv('app.report_full', 'APLY')"
      }
    ]
};

// var evt = {
//     action: "getExports",
//     folder: "magda",
    // "pgurl": process.env.PGURL,
//     rds:
//         {
//             securitygroup : 'pg-lambda'
//         }
// };

// var evt = {
//     action: "getExportSignedUrl",
//     folder: "magda",
    // "pgurl": process.env.PGURL,
//     rds:
//         {
//             securitygroup : 'pg-lambda'
//         },
//     url: "ba8f9215-65e3-46d8-8fde-10457ead6719.zip"
// };

var context = {
    done: function(err, data) {
        if(err) console.log('lambda exited with errors: ', err)
        else console.log('lambda exited without errors ', data)
    }
};

lambda.handler(evt, context);
