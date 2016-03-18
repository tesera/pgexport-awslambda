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

var evt = {
    "pgurl": "postgresql://ibcmrat:huSav8japr3b@tsi-postgres-1.cn0lfmewpatf.us-east-1.rds.amazonaws.com:5432/mrat_dev",
    "bucket": "borisgeojson",
    "key": "test/9d4e9ddf-28cb-45a1-8e17-full",
    "rds": {
      "DBSecurityGroupName": "pg-lambda"
    },
    "queries": [
        {
            "filename": "coquitlam_20150116_druid_data_y_ins_2016.csv",
            "sql": "select * from datasets.coquitlam_20150116_druid_data_y_ins_2016 limit 10"
        }
    ],
    archive: false
};


 // ,
      // {
      //   "filename": "coquitlam_20150116_druid_data_x_2015.csv",
      //   "sql": "select * from datasets.coquitlam_20150116_druid_data_x_2015"
      // },
      // {
      //   "filename": "coquitlam_20150116_druid_data_x_2015_data_y_ins_2016.csv",
      //   "sql": "select * from datasets.coquitlam_20150116_druid_data_x_2015_data_y_ins_2016"
      // }    

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
