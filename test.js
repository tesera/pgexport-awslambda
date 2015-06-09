var lambda = require('./index.js');
require('node-env-file')('.env');

// var evt = {
//     "action": "exportData",
//     "key": "magda/reports/ad9da3a5-9dcc-401b-846d-9f060fc43ce9/full.zip",
//     "pgurl": process.env.PGURL,
//     "rds": {
//       "DBSecurityGroupName": "pg-lambda"
//     },
//     "queries": [
//       {
//         "filename": "report_full.csv",
//         "sql": "SELECT * FROM app.export_report_as_csv('app.report_full')"
//       }
//     ]
// };

var evt = {
 "action": "getExports",
 "key": "magda/reports",
};

var context = {
    done: function(err, data) {
        if(err) console.log('lambda exited with errors: ', err)
        else console.log('lambda exited without errors ', data)
    }
};

lambda.handler(evt, context);
