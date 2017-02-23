#!/usr/bin/env bash

# desc:   zips up lambda function resources and uploads to aws
# docs:   http://docs.aws.amazon.com/lambda/latest/dg/API_UpdateFunctionCode.html

zip -r function.zip package.json node_modules/* lib/* index.js

aws lambda update-function-code \
    --function-name pgexport \
    --zip-file fileb://function.zip

rm function.zip
