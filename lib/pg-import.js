'use strict';
var aws = require('aws-sdk');
var Q = require('q');
var s3 = new aws.S3();
var pgClient = require('pg-native');

var PGImport = function (options) {
    var self = this;
    self.bucket = options.bucket;
    self.rds = options.rds;
    self.pgurl = options.pgurl;
    self.s3 = new aws.S3({ params: { Bucket: self.bucket } });
    self.dataType = options.type || "VARCHAR(255)"
};

PGImport.prototype.importData = function (queries) {
    var self = this;

    function createTable(query, readable) {
        var headers = false;
        return function(chunk) {
            if(!headers) {
                console.log("Created table "+query.tablename)
                var chunkString = (typeof chunk === 'string') ? chunk : chunk.toString();
                headers = chunkString.split('\n')[0];
                var columns = headers.split(',').map(function(value) { return value + " " + self.dataType}).join(', ')
                var create = "CREATE TABLE "+query.tablename+"("+columns+")"
                var pg = new pgClient();
                pg.connectSync(self.pgurl);
                pg.querySync(create);
                pg.querySync("COPY "+query.tablename+" FROM STDIN CSV HEADER DELIMITER ','");
                var stream = pg.getCopyStream();
                readable.pipe(stream);
            }
        }
    }

    function startStream(query) {
        var params = {
            Bucket: self.bucket,
            Key: query.key
        };
        var streamClosed = Q.defer()
        var readable = s3.getObject(params).createReadStream();
        readable.on('data', createTable(query, readable));
        readable.on('end', streamClosed.resolve);
        return streamClosed.promise;
    }

    return Q.allSettled(queries.map(function(query){ return startStream(query); }));
}

module.exports = PGImport;
