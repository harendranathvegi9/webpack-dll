var path = require('path');
var extractAndBundle = require('../extractAndBundle');
var fs = require('fs');
var mime = require('mime');

function extractPackages (req) {
  var bundlePublicPath = path.resolve('src', 'dashboard', 'public', 'bundles', req.params.packages.replace(/\//g, ','));
  var dllPromise = new Promise(function (resolve, reject) {
    extractAndBundle('dll.js')(req, {
      setHeader: function () {},
      status: function () {
        this.reject = true;

        return this;
      },
      send: function (content) {
        fs.writeFileSync(path.join(bundlePublicPath, 'dll.js'), content, 'utf-8');
        if (this.reject) {
          reject(content);
        } else {
          resolve(content);
        }
      }
    });
  });
  var bundlePromise = new Promise(function (resolve, reject) {
    extractAndBundle('manifest.json')(req, {
      setHeader: function () {},
      status: function () {
        this.reject = true;

        return this;
      },
      send: function (content) {
        fs.writeFileSync(path.join(bundlePublicPath, 'manifest.json'), JSON.stringify(content, null, 2), 'utf-8');
        if (this.reject) {
          reject(content);
        } else {
          resolve(content);
        }
      }
    });
  });

  try {
    fs.mkdirSync(bundlePublicPath);
  } catch (err) {

  }


  return Promise.all([
    dllPromise,
    bundlePromise
  ]);
}

module.exports = {
  getDll: function (req, res) {
    var bundlePublicPath = path.resolve('src', 'dashboard', 'public', 'bundles', req.params.packages);

    try {
      if (fs.statSync(bundlePublicPath).isDirectory() && fs.statSync(path.join(bundlePublicPath, 'dll.js')).isFile()) {
        var content = fs.readFileSync(path.join(bundlePublicPath, 'dll.js')).toString();
        var contentType = mime.lookup('dll.js');
        var contentLength = content.length;

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', contentLength);
        res.send(content);
      } else {
        extractPackages(req)
          .then(function (results) {
            var content = results[0];
            var contentType = mime.lookup('dll.js');
            var contentLength = content.length;

            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Length', contentLength);
            res.send(results[0]);
          })
          .catch(function (err) {
            res.send(err);
          });
      }
    } catch (e) {
      extractPackages(req)
        .then(function (results) {
          var content = results[0];
          var contentType = mime.lookup('dll.js');
          var contentLength = content.length;

          res.setHeader('Content-Type', contentType);
          res.setHeader('Content-Length', contentLength);
          res.send(results[0]);
        })
        .catch(function (err) {
          res.send(err);
        });
    }
  },
  getManifest: function (req, res) {
    var bundlePublicPath = path.resolve('src', 'dashboard', 'public', 'bundles', req.params.packages);

    try {
      if (fs.statSync(bundlePublicPath).isDirectory() && fs.statSync(path.join(bundlePublicPath, 'manifest.json')).isFile()) {
        var content = fs.readFileSync(path.join(bundlePublicPath, 'manifest.json')).toString();

        res.send(JSON.parse(content));
      } else {
        extractPackages(req)
          .then(function (results) {
            res.send(results[1]);
          })
          .catch(function (err) {
            res.send(err);
          });
      }
    } catch (e) {
      extractPackages(req)
        .then(function (results) {
          res.send(results[1]);
        })
        .catch(function (err) {
          res.send(err);
        });
    }

  },
  getPackages: function (req, res) {
    var bundlePublicPath = path.resolve('src', 'dashboard', 'public', 'bundles');
    res.send(fs.readdirSync(bundlePublicPath));
  },
  getPackage: function (req, res) {
    var bundlePublicPath = path.resolve('src', 'dashboard', 'public', 'bundles', req.params.packageName);
    res.send(JSON.parse(fs.readFileSync(path.join(bundlePublicPath, 'manifest.json'))));
  },
  deletePackage: function (req, res) {
    var bundlePublicPath = path.resolve('src', 'dashboard', 'public', 'bundles', req.params.packageName);
    fs.unlinkSync(path.join(bundlePublicPath, 'dll.js'));
    fs.unlinkSync(path.join(bundlePublicPath, 'manifest.json'));
    fs.rmdirSync(bundlePublicPath);
    res.send();
  }
}
