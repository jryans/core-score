var should = require('should');
var _ = require('lodash');

var util = require('util');

var coreScore = require('../lib/main.js');

describe('ScoringModule', function() {
  describe('#processDependencies()', function() {
    it('should flag dependencies once', function(done) {
      var scoreMod = new coreScore.ScoringModule();

      var testContents =
        "var a = require('os');" +
        "var b = require('path');" +
        "var c = require('os');";

      scoreMod.processDependencies(testContents, function(err) {
        should.not.exist(err);

        _.chain(scoreMod.coreModsUsed).pick(function(v, k) {
          return v;
        }).keys().value().should.have.length(2);

        done();
      });
    });
  });
});
