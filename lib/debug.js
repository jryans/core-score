var argv = require('optimist').boolean('v').argv;
var util = require('util');

module.exports = debug;

function debug(message) {
  if (argv.v) {
    util.debug(message);
  }
}
