var util = require('util'),
    npm = require('npm');

npm.load({}, function(err) {
  npm.commands.search('', true, function(err, data) {
    if (err) {
      util.error("Search failed!");
      process.exit(1);
    }

     Object.keys(data).forEach(function (k) {
      console.log(k);
     });
  });
});
