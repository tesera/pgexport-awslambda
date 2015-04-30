'use strict';
var Q = require('q');
var aws = require('aws-sdk');
var request = require('request');

var Ingress = function(options) {
    var self = this;
    options = options || {};
    self.region = options.region || 'us-east-1';
    self.DBSecurityGroupName = options.DBSecurityGroupName || 'default';

    self.rds = new aws.RDS({
        region: self.region,
        params: {
            DBSecurityGroupName: self.DBSecurityGroupName
        }
    });
}

Ingress.prototype.authorizeMe = function () {
    var self = this;
    console.log('authorizingSecurityGroupIngress for me');

    return Q.nfcall(request, 'http://ipinfo.io')
        .then(function (args) {
            var info = JSON.parse(args[1]);
            console.log('lambda CIDRIP is ' + info.ip + '/32');
            return info.ip + '/32';
        })
        .then(self.authorizeCIDRIP.bind(self));
};

Ingress.prototype.authorizeCIDRIP = function (cidrip) {
    var self = this;
    console.log('authorizingSecurityGroupIngress for : ' + cidrip);
    var auth = Q.nbind(self.rds.authorizeDBSecurityGroupIngress, self.rds);

    return auth({ CIDRIP: cidrip })
        .then(function () {
            console.log('success in authorize cidrip ' + cidrip);
            self.cidrip = cidrip;
        })
        .fail(function (err) {
            console.log(err);
            if(err.code !== 'AuthorizationAlreadyExists') {
                throw new Error(err);
            } else {
                self.cidrip = cidrip;
                return console.log('AuthorizationAlreadyExists for CIDRIP ' + cidrip);
            }
        });
};

Ingress.prototype.revoke = function () {
    var self = this;
    console.log('revokeSecurityGroupIngress for CIDRIP ' + self.cidrip);
    var revoke = Q.nbind(self.rds.revokeDBSecurityGroupIngress, self.rds);
    return revoke({ CIDRIP: self.cidrip });
};

module.exports = Ingress;
