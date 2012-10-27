var util = require('util');
var npm = require('npm');
var _ = require('lodash');
var async = require('async');
var path = require('path');
var fs = require('fs');
var detective = require('detective');

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

    new ScoringModule('npm').score(cb);
  });
}

function ScoringModule(moduleName) {
  var self = this;

  self.moduleName = moduleName;
  self.filesSeen = {};
  self.coreCount = {};
  
  coreModules.forEach(function(coreMod) {
    self.coreCount[coreMod] = 0;
  });
}

ScoringModule.prototype = {
  score: function(cb) {
    var self = this;
    async.waterfall([
      self.grabPackage.bind(self),
      self.findMain.bind(self),
      self.processDependencies.bind(self)
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

        self.modulePath = path.resolve(cacheLocation, self.moduleName, _.keys(info)[0], 'package');

        cb(null, json);
      });
    });
  },

  getAbsolutePath: function(relFilePath) {
    var self = this;
    return path.resolve(self.modulePath, relFilePath);
  },

  getRelativePath: function(absFilePath) {
    var self = this;
    return path.relative(self.modulePath, absFilePath);
  },

  findMain: function(json, cb) {
    var self = this;

    var mainFilePath = _.find([
      (json && json.main) ? json.main : null,
      (json && json.main) ? json.main + '.js' : null,
      './index.js'
    ], function(testPath) {
      if (!testPath) {
        return false;
      }
   
      testPath = self.getAbsolutePath(testPath);
      if (fs.existsSync(testPath)) {
        return self.getRelativePath(testPath);
      }

      return false;
    });

    if (mainFilePath) {
      util.debug(self.moduleName + " has main at " + mainFilePath);
      return cb(null, mainFilePath);
    }

    cb(new Error("No main file found for " + self.moduleName));
  },

  processDependencies: function(relativeFilePath, cb) {
    var self = this;

    var fileContents = fs.readFileSync(self.getAbsolutePath(relativeFilePath));

    util.debug(detective(fileContents));

    _.forEach(detective(fileContents), function(moduleRef) {
      if (typeof self.coreCount[moduleRef] === 'number') {
        self.coreCount[moduleRef]++;
      }
    });

    util.debug(util.inspect(self.coreCount));
  }
};
