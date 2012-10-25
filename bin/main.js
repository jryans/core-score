var coreScore = require('../lib/main.js');
var util = require('util');

coreScore.scoreModules(function(err, data) {
  if (err) {
    util.error(err);
    process.exit(1);
  }

  console.log(util.inspect(data));
});
