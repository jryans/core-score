var util = require('util'),
    npm = require('npm'),
    _ = require('lodash');

var cacheLocation = '/Users/jryans/projects/core-score/npmcache'; 

var npmConfig = {
  cache: cacheLocation
};

npm.load(npmConfig, function(err) {
  /*npm.commands.search('mkdirp', true, function(err, data) {
    if (err) {
      util.error("Search failed: " + err);
      process.exit(1);
    }

    Object.keys(data).slice(0, 1).forEach(grabPackage);
  });*/

  grabPackage('mkdirp');
});


function grabPackage(pkgName) {
  npm.commands.info([pkgName, "dist.tarball"], true, function(err, data) {
    if (err) {
      util.error("Info failed: " + err);
      process.exit(1);
    }

    var tarUrl = _.values(data)[0]['dist.tarball'];

    npm.commands.cache.add(tarUrl, function(err, data) {
      if (err) {
        util.error("Cache add failed: " + err);
        process.exit(1);
      }

      console.log(util.inspect(data));


    });
  });
}
