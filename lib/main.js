var util = require('util');
var npm = require('npm');
var _ = require('lodash');
var async = require('async');

var cacheLocation = '/Users/jryans/projects/core-score/npmcache'; 

var npmConfig = {
  cache: cacheLocation
};

exports.scoreModules = scoreModules;

function scoreModules(cb) {
  npm.load(npmConfig, function(err) {
    /*npm.commands.search('mkdirp', true, function(err, data) {
      if (err) {
        return cb(err);
      }

      // Object.keys(data).slice(0, 1).forEach(grabPackage);
    });*/

    async.waterfall([
      function(next) {
        grabPackage('mkdirp', next);
      }
    ], cb);
  });
}


function grabPackage(pkgName, cb) {
  npm.commands.info([pkgName, 'dist.tarball'], true, function(err, data) {
    if (err) {
      return cb(err);
    }

    var tarUrl = _.values(data)[0]['dist.tarball'];

    npm.commands.cache.add(tarUrl, function(err, data) {
      if (err) {
        return cb(err);
      }

      console.log(util.inspect(data));

      cb();
    });
  });
}
