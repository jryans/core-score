var util = require('util');
var npm = require('npm');
var _ = require('lodash');
var async = require('async');

require('es6-collections');

var cacheLocation = '/Users/jryans/projects/core-score/npmcache'; 

var npmConfig = {
  cache: cacheLocation
};

var coreModules = require('repl')._builtinLibs;

exports.scoreModules = scoreModules;

function scoreModules(cb) {
  npm.load(npmConfig, function(err) {
    /*npm.commands.search('mkdirp', true, function(err, data) {
      if (err) {
        return cb(err);
      }

      // Object.keys(data).slice(0, 1).forEach(grabPackage);
    });*/

    new ScoringModule('mkdirp').score(cb);
  });
}

function ScoringModule(moduleName) {
  this.moduleName = moduleName;
  this.filesSeen = new Set();
}

ScoringModule.prototype.score = function(cb) {
  async.waterfall([
    function(next) {
      grabPackage('mkdirp', next);
    }
  ], cb);
};

ScoringModule.prototype.seen = function(modRelPath) {
  return this.filesSeen.has(modRelPath);
};

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


