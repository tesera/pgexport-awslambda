# pgexport-awslambda
## Generic postgreSQL export lambda microservice.

Pass it a postgreSQl URL and queries with an s3 destination and voila!
Archive boolean flag will produce a zip file at specified key on true,
and upload files to key if false.

###Usage
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

###test
Update the test.js event object for your environment.

``$ npm test``

###Publishing
Update the ``./script/publi.sh`` script for your environment.

``$ bash ./scripts/publish.sh``

###Updating
Update the ``./script/update.sh`` script for your environment.

``$ bash ./scripts/update.sh``