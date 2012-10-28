var detective = require('detective');

module.exports = safeDetective;

function safeDetective(fileContents) {
  if (!(fileContents instanceof String)) {
    // Nothing lost here since detective stringifies anyway
    fileContents = fileContents.toString();
  }

  // Filter out #! lines
  if (fileContents.indexOf('#!') === 0) {
    fileContents = fileContents.split('\n').slice(1).join('\n');
  }

  return detective(fileContents);
}
