var lambda = require('./index.js');

// var evt = {
//     action: "exportData",
//     folder: "magda",
//     rds:
//         {
//             pgurl: "",
//             securitygroup : 'pg-lambda'
//         },
//     queries: [
//         {
//             filename: 'plot.csv',
//             sql: "SELECT * FROM app.export_report_as_csv('app.report_full','APLY')"//app.export_as_csv('psp.plot', 'APLY')"
//         }
//     ]
// };
var evt = {
    action: "getExports",
    folder: "magda",
    rds:
        {
            pgurl: "",
            securitygroup : 'pg-lambda'
        }
};
// var evt = {
//     action: "getExportSignedUrl",
//     folder: "magda",
//     rds:
//         {
//             pgurl: "",
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
