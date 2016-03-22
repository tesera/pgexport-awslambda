# pgexport-awslambda
## Generic postgreSQL export lambda microservice.

Pass it a postgreSQl URL and queries with an s3 destination and voila!
Archive boolean flag will produce a zip file at specified key on true,
and upload files to key if false.

###Usage

####Export
Uses AWS Lambda's basic execution mode to invoke an export.

````json
{
  "pgurl": "postgres://localhost/afgo_dev",
  "rds":
        {
            "securityGroup" : "pg-lambda"
        },
  "queries": [
    {
      "filename": "plot.csv",
      "sql": "SELECT * FROM app.export_as_csv('psp.plot', 'APLY')"
    }
  ],
  "bucket": "pgexport-awslambda",
  "key": "9d4e9ddf-28cb-45a1-8e17-748694831155",
  "archive": true
}
````

####Import
Uses AWS Lambda's basic execution mode to invoke an import. You can override the default column type of VARCHAR(255) by providing an mappings object.

````json
{
    "pgurl": "postgres://localhost/afgo_dev",
    "bucket": "tesera.svc.learn",
    "action": "importData",
    "rds": {
      "DBSecurityGroupName": "pg-lambda"
    },
    "queries": [
        {
            "key": "test-cqtlm-old/4a_filter/input/data-y-filter-options.csv",
            "tablename": "data_y_filter"
        },
        {
            "key": "test-cqtlm-old/4a_filter/input/CLAIMS.csv",
            "tablename": "claims",
            "mappings": {
                "YEAR": { "type": "smallint" }
            }
        },
        {
            "key": "test-cqtlm-old/4a_filter/input/SUMMARY_MUNICIPAL_SSH7_25_SPDIASTR1_4.csv",
            "tablename": "summary"
        }
    ]
}
````

###test
Update the test.js event object for your environment.

``$ npm test``

###Publishing
Update the ``./script/publi.sh`` script for your environment.

``$ bash ./scripts/publish.sh``

###Updating
Update the ``./script/update.sh`` script for your environment.

``$ bash ./scripts/update.sh``
