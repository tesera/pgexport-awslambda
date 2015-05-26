# pgexport-awslambda
## Generic postgreSQL export lambda microservice.

Pass it a postgreSQl URL and queries with an s3 destination and voila!

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
  "key": "9d4e9ddf-28cb-45a1-8e17-748694831155.zip"
}
````

###test
Update the test.js event object for your environment.

``$ node ./test.js``

###Publishing
Update the ``./script/publi.sh`` script for your environment.

``$ bash ./scripts/publish.sh``
