var util = require('util');
var npm = require('npm');
var _ = require('lodash');
var async = require('async');
var path = require('path');
var fs = require('fs');

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
  var self = this;

  self.moduleName = moduleName;
  self.filesSeen = new Set();
  self.coreCount = new Map();
  
  coreModules.forEach(function(coreMod) {
    self.coreCount.set(coreMod, 0);
  });
}

ScoringModule.prototype = {
  score: function(cb) {
    var self = this;
    async.waterfall([
      self.grabPackage.bind(self),
      self.findMain.bind(self)
    ], cb);
  },

  seen: function(modRelPath) {
    return this.filesSeen.has(modRelPath);
  },

  grabPackage: function(cb) {
    var self = this;
    npm.commands.info([self.moduleName, 'dist.tarball'], true, function(err, info) {
      if (err) {
        return cb(err);
      }

      var tarUrl = _.values(info)[0]['dist.tarball'];

      npm.commands.cache.add(tarUrl, function(err, json) {
        if (err) {
          return cb(err);
        }

        var modulePath = path.resolve(cacheLocation, self.moduleName, _.keys(info)[0], 'package');

        cb(null, json, modulePath);
      });
    });
  },

  findMain: function(json, modulePath, cb) {
    var self = this;

    var mainFilePath = _.find([
      (json && json.main) ? json.main : null,
      (json && json.main) ? json.main + '.js' : null,
      './index.js'
    ], function(testPath) {
      if (!testPath) {
        return false;
      }
   
      testPath = path.resolve(modulePath, testPath);
      if (fs.existsSync(testPath)) {
        return path.relative(modulePath, testPath);
      }

      return false;
    });

    if (mainFilePath) {
      util.debug(self.moduleName + " has main at " + mainFilePath);
      return cb(null, mainFilePath);
    }

    cb(new Error("No main file found for " + self.moduleName));
  }
};
