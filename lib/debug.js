var argv = require('optimist');
var util = require('util');

module.exports = debug;

function debug(message) {
  if (argv.v) {
    util.debug(message);
  }
}
