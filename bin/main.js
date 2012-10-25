var coreScore = require('../lib/main.js');
var util = require('util');

coreScore.scoreModules(function(err, data) {
  if (err) {
    util.error(err.stack);
    process.exit(1);
  }

  util.debug(util.inspect(data));
});
