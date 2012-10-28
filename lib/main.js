var util = require('util');
var npm = require('npm');
var _ = require('lodash');
var async = require('async');
var path = require('path');
var fs = require('fs');
var detective = require('detective');

var npmConfig = {
  'cache': '/Users/jryans/projects/core-score/npmcache',
  'cache-lock-stale': 60000 * 60 * 24
};

var coreModules = require('repl')._builtinLibs;

exports.scoreModules = scoreModules;
exports.ScoringModule = ScoringModule;

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
    self.coreCount[coreMod] = false;
  });
}

ScoringModule.prototype = {
  score: function(cb) {
    var self = this;
    async.waterfall([
      self.grabPackage.bind(self),
      self.findMain.bind(self),
      self.processModuleFile.bind(self)
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

        self.modulePath = path.resolve(npmConfig.cache, self.moduleName, _.keys(info)[0], 'package');

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

  navigate: function(curRelPath, newRelPath) {
    var self = this;
    return self.getRelativePath(path.resolve(self.getAbsolutePath(curRelPath), '../' + newRelPath));
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
      return cb(null, mainFilePath);
    }

    cb(new Error("No main file found for " + self.moduleName));
  },

  processModuleFile: function(relativeFilePath, cb) {
    var self = this;
    async.waterfall([
      self.getFileContents.bind(self, relativeFilePath),
      self.processDependencies.bind(self)
    ], cb);
  },

  getFileContents: function(relativeFilePath, cb) {
    var self = this;
    fs.readFile(self.getAbsolutePath(relativeFilePath), function(err, data) {
      cb(err, data, relativeFilePath);
    });
  },

  processDependencies: function(fileContents, relativeFilePath, cb) {
    if (typeof cb !== 'function') {
      cb = relativeFilePath;
      relativeFilePath = null;
    }

    util.debug("BEGIN: " + relativeFilePath);

    var self = this;

    var dependencies = _.uniq(detective(fileContents));

    util.debug(util.inspect(dependencies));

    var pendingTasks = 0;

    self.filesSeen[relativeFilePath] = true;

    _.forEach(dependencies, function(moduleRef) {
      if (typeof self.coreCount[moduleRef] !== 'undefined') {
        self.coreCount[moduleRef] = true;
      } else if (!!relativeFilePath && moduleRef.indexOf('.') === 0) {
        var childRelativeFilePath = self.navigate(relativeFilePath, moduleRef);

        if (self.filesSeen[childRelativeFilePath]) {
          util.debug('SKIP: already seen ' + childRelativeFilePath);
          return;
        }

        pendingTasks++;
        util.debug('INC: current task count: ' + pendingTasks);

        self.processModuleFile(childRelativeFilePath, function(err) {
          if (err) {
            return cb(err);
          }

          pendingTasks--;
          util.debug('DEC: current task count: ' + pendingTasks);

          if (pendingTasks === 0) {
            tasksDone();
          }
        });
      }
    });

    function tasksDone() {
      util.debug(util.inspect(self.coreCount));

      util.debug("END:   " + relativeFilePath);

      cb(null);
    }
  }
};
