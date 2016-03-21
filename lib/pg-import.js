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
    self.defaultType = options.defaultType || "VARCHAR(255)"
    self.pg = new pgClient();
    self.pg.connectSync(self.pgurl);
};

PGImport.prototype.importData = function (queries) {
    var self = this;

    function createTable(query, readable) {
        var headers = false;
        return function(chunk) {
            if(!headers) {
                console.log("Created table "+query.tablename)
                var chunkString = (typeof chunk === 'string') ? chunk : chunk.toString();
                headers = chunkString.split('\n')[0].split(',');
                var columns = headers.map(function(value, index) {
                    var dataType = query.overrides[headers[index]] || self.defaultType;
                    return value + " " + dataType
                }).join(', ')
                var create = "CREATE TABLE "+query.tablename+"("+columns+")"
                self.pg.querySync(create);
                self.pg.querySync("COPY "+query.tablename+" FROM STDIN CSV HEADER DELIMITER ','");
                var stream = self.pg.getCopyStream();
                readable.pipe(stream);
            }
        }
    }

    function startStream(query) {
        var params = {
            Bucket: self.bucket,
            Key: query.key
        };
        query.overrides = query.overrides || {};
        var streamClosed = Q.defer()
        var readable = s3.getObject(params).createReadStream();
        readable.on('data', createTable(query, readable));
        readable.on('end', streamClosed.resolve);
        return streamClosed.promise;
    }

    return queries.reduce(function(chain, query) {
        return chain.then(function(){
            return startStream(query)
        });
    }, Q.resolve());
}

module.exports = PGImport;
