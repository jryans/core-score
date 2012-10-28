var util = require('util');
var npm = require('npm');
var _ = require('lodash');
var async = require('async');
var path = require('path');
var fs = require('fs');
var detective = require('./detective.js');
var debug = require('./debug.js');

var coreModules = require('repl')._builtinLibs;

exports.scoreModules = scoreModules;
exports.ScoringModule = ScoringModule;

function scoreModules(modules, cb) {
  npm.load({}, function(err) {
    if (typeof modules == 'number') {
      npm.commands.search('', true, function(err, data) {
        if (err) {
          return cb(err);
        }

        modules = _.chain(data).keys().shuffle().head(modules).value();
        begin();
      });
    } else {
      begin();
    }

    function begin() {
      var tasks = {};

      _.forEach(modules, function(module) {
        tasks[module] = function(done) {
          new ScoringModule(module).score(function(err, data) {
            if (err) {
              util.error(err);
            }

            done(null, data);
          });
        };
      });

      async.parallel(tasks, cb);
    }
  });
}

function ScoringModule(moduleName) {
  var self = this;

  self.moduleName = moduleName;
  self.filesSeen = {};
  self.coreModsUsed = {};

  coreModules.forEach(function(coreMod) {
    self.coreModsUsed[coreMod] = false;
  });
}

ScoringModule.prototype = {
  score: function(cb) {
    var self = this;
    async.waterfall([
      self.grabPackage.bind(self),
      self.findMain.bind(self),
      self.processModuleFile.bind(self),
      function (next) {
        next(null, self.coreModsUsed);
      }
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

      util.debug(util.inspect(info));

      var tarUrl = _.values(info)[0]['dist.tarball'];

      npm.commands.cache.add(tarUrl, function(err, json) {
        if (err) {
          return cb(err);
        }

        self.modulePath = path.resolve(npm.config.get('cache'), self.moduleName, _.keys(info)[0], 'package');

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

    debug("BEGIN: " + relativeFilePath);

    var self = this;

    var dependencies = _.uniq(detective(fileContents));

    debug(util.inspect(dependencies));

    var pendingTasks = 0;

    self.filesSeen[relativeFilePath] = true;

    _.forEach(dependencies, function(moduleRef) {
      if (typeof self.coreModsUsed[moduleRef] !== 'undefined') {
        self.coreModsUsed[moduleRef] = true;
      } else if (!!relativeFilePath && moduleRef.indexOf('.') === 0) {
        var childRelativeFilePath = self.navigate(relativeFilePath, moduleRef);

        childRelativeFilePath = _.find([
          childRelativeFilePath,
          childRelativeFilePath + '.js'
        ], function(testPath) {
          testPath = self.getAbsolutePath(testPath);
          if (fs.existsSync(testPath)) {
            return self.getRelativePath(testPath);
          }

          return false;
        });

        if (!childRelativeFilePath) {
          util.error('Error: ' + self.moduleName + ' reqs ' + moduleRef + ', but it doesn\'t exist!');
          return;
        }

        if (self.filesSeen[childRelativeFilePath]) {
          debug('SKIP: already seen ' + childRelativeFilePath);
          return;
        }

        pendingTasks++;
        debug('INC: current task count: ' + pendingTasks);

        self.processModuleFile(childRelativeFilePath, function(err) {
          if (err) {
            return cb(err);
          }

          pendingTasks--;
          debug('DEC: current task count: ' + pendingTasks);

          if (pendingTasks === 0) {
            tasksDone();
          }
        });
      }
    });

    if (pendingTasks === 0) {
      tasksDone();
    }

    function tasksDone() {
      debug(util.inspect(self.coreModsUsed));

      debug("END:   " + relativeFilePath);

      cb(null);
    }
  }
};
