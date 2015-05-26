var lambda = require('./index.js');

var evt = {
    pgurl: "postgres://afgo:YUaXqGc37ANy@tsi-postgres-1.cn0lfmewpatf.us-east-1.rds.amazonaws.com/afgo_dev",
    rds:
        {
            securityGroup : 'pg-lambda'
        },
    queries: [
        {
            filename: 'plot.csv',
            sql: "SELECT * FROM app.export_report_as_csv('app.report_full','APLY')"//app.export_as_csv('psp.plot', 'APLY')"
        }
    ],
    bucket: "pgexport-awslambda",
    key: "9d4e9ddf-28cb-45a1-8e17-748694831155.zip"
};

var context = {
    done: function(err, data) {
        if(err) console.log('lambda exited with errors:', err)
        else console.log('lambda exited without errors', data)
    }
};

lambda.handler(evt, context);
