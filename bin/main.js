#!/usr/bin/env node

var coreScore = require('../lib/main.js');
var util = require('util');
var argv = require('optimist').boolean('v').argv;
var Table = require('cli-table');
var _ = require('lodash');
var debug = require('../lib/debug.js');

var modules = argv._;

if (!argv.n && modules.length === 0) {
  console.error('Please specfiy one or more modules to analyze.');
  process.exit(1);
}

if (argv.n && modules.length > 0) {
  console.error('Modules can\'t be specified if a number is given.');
  process.exit(1);
}

if (argv.n) {
  modules = argv.n;
}

var resultsTable = new Table({
  head: ['Module', 'Usage']
});

var results = {};

require('repl')._builtinLibs.forEach(function(coreMod) {
  results[coreMod] = 0;
});

coreScore.scoreModules(modules, function(err, data) {
  if (err) {
    util.error(err.stack);
    process.exit(1);
  }

  debug('done!')

  debug(util.inspect(data));

  _.chain(data).values().forEach(function(moduleResults) {
    _.forEach(moduleResults, function(used, coreMod) {
      if (used) {
        results[coreMod]++;
      }
    });
  });

  results = _.chain(results).pairs().sortBy(function(entry) {
    return -entry[1];
  }).value();

  resultsTable.push.apply(resultsTable, results);

  console.log(resultsTable.toString());
});
