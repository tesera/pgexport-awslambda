#!/usr/bin/env bash

# desc:   zips up lambda function resources and uploads to aws
# docs:   http://docs.aws.amazon.com/cli/latest/reference/lambda/upload-function.html

mv node_modules/pg-native node_modules/pg-native-org
cp -R lib/pg-native node_modules

zip -r function.zip package.json node_modules/* lib/* index.js

aws lambda update-function-code \
 --function-name pgexport \
 --zip-file fileb://function.zip

rm function.zip
rm -fr node_modules/pg-native
mv node_modules/pg-native-org node_modules/pg-native