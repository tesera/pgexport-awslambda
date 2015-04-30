'use strict';
var aws = require('aws-sdk');
var Q = require('q');

var Logger = function(options) {
    var self = this;
    self.options = options;
    self.logs = [];
}

Logger.prototype.log = function (str) {
    var self = this;
    if (self.options.debug) console.log(str);
    self.logs.push(str);
};

Logger.prototype.save = function () {
    var self = this;
    var params = {
        Bucket: self.options.bucket,
        Key: self.options.key,
        Body: JSON.stringify(self.logs),
        ContentType: 'application/json'
    };
    var s3 = new aws.S3();
    var put = Q.nbind(s3.putObject, s3);
    return put(params);
};

module.exports = Logger;