#!/usr/bin/env bash

# desc:   zips up lambda function resources and uploads to aws
# docs:   http://docs.aws.amazon.com/cli/latest/reference/lambda/upload-function.html

mv node_modules/pg-native node_modules/pg-native-org
cp -R lib/pg-native node_modules

zip -r function.zip package.json node_modules/* lib/* index.js

aws lambda create-function \
 --function-name pgexport \
 --zip-file fileb://function.zip  \
 --runtime nodejs  \
 --role arn:aws:iam::674223647607:role/pgexport_lambda_exec_role \
 --handler index.handler  \
 --timeout 300  \
 --memory-size 1536  \
 --region us-east-1

# aws lambda update-function-code \
#     --function-name pgexport \
#     --zip-file fileb://function.zip

rm function.zip
rm -fr node_modules/pg-native
mv node_modules/pg-native-org node_modules/pg-native