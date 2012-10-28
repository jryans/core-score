var should = require('should');
var _ = require('lodash');

var util = require('util');

var coreScore = require('../lib/main.js');

describe('ScoringPackage', function() {
  describe('#processDependencies()', function() {
    it('should flag dependencies once', function(done) {
      var scorePkg = new coreScore.ScoringPackage();

      var testContents =
        "var a = require('os');" +
        "var b = require('path');" +
        "var c = require('os');";

      scorePkg.processDependencies(testContents, function(err) {
        should.not.exist(err);

        _.chain(scorePkg.coreModsUsed).pick(function(v, k) {
          return v;
        }).keys().value().should.have.length(2);

        done();
      });
    });
  });
});
