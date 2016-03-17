'use strict';
var aws = require('aws-sdk');
var Q = require('q');
var s3 = new aws.S3();

var PGImport = function (options) {
    var self = this;
    self.bucket = options.bucket;
    self.rds = options.rds;
    self.pgurl = options.pgurl;
    self.s3 = new aws.S3({ params: { Bucket: self.bucket } });
};

PGImport.prototype.importData = function (queries) {
    var self = this;
    var headers = false;

    var params = {
        Bucket: self.bucket,
        Key: queries[2].key
    };

    function getHeaders(promise) {
        return function(chunk) {
            if(!headers) {
                var chunkString = (typeof chunk === 'string') ? chunk : chunk.toString();
                headers = chunkString.split('\n')[0];
                console.log('got headers');
                promise.resolve();
            }
        }
    }

    function getStream() {
        var gotHeaders = Q.defer()
        var streamClosed = Q.defer()
        s3.getObject(params).createReadStream()
            .on('data', getHeaders(gotHeaders))
            .on('end', streamClosed.resolve);
            //.pipe(process.stdout)
        return [gotHeaders.promise, streamClosed.promise];
    }

    // "COPY tablename FROM STDIN IGNOREHEADER 1 DELIMITER ',' CSV"
    return Q.allSettled(getStream());
}

module.exports = PGImport;
