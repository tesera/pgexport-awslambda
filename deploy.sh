#!/usr/bin/env bash

# desc:   zips up lambda function resources and uploads to aws
# docs:   http://docs.aws.amazon.com/cli/latest/reference/lambda/upload-function.html

zip -r function.zip package.json node_modules/* lib/* index.js

# aws lambda upload-function \
#  --function-name pgexport \
#  --function-zip function.zip  \
#  --runtime nodejs  \
#  --role arn:aws:iam::674223647607:role/pgexport_lambda_exec_role \
#  --handler index.handler  \
#  --mode event  \
#  --timeout 60  \
#  --memory-size 256  \
#  --region us-east-1

aws lambda update-function-code \
    --function-name pgexport \
    --zip-file fileb://function.zip

rm function.zip
