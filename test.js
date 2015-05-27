var lambda = require('./index.js');

var evt = {
    action: "getExports",
    folder: "magda",
    rds:
        {
            pgurl: "postgres://afgo:YUaXqGc37ANy@tsi-postgres-1.cn0lfmewpatf.us-east-1.rds.amazonaws.com/afgo_dev",
            securitygroup : 'pg-lambda'
        },
    queries: [
        {
            filename: 'plot.csv',
            sql: "SELECT * FROM app.export_report_as_csv('app.report_full','APLY')"//app.export_as_csv('psp.plot', 'APLY')"
        }
    ]
};

var context = {
    done: function(err, data) {
        if(err) console.log('lambda exited with errors: ', err)
        else console.log('lambda exited without errors ', data)
    }
};

lambda.handler(evt, context);
