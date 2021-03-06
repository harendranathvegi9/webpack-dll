var uuid = require('uuid');
var queue = {};
var fs = require('fs');
var path = require('path');

var getQueueIdByVendorsBundleName = function (vendorsBundleName) {
  return Object.keys(queue).filter(function (key) {
    return queue[key].name === vendorsBundleName;
  })[0];
};

module.exports = {
  add: function (vendorsBundleName) {
    var id = uuid.v1();
    queue[id] = {
      name: vendorsBundleName,
      isDone: false
    };
    return id;
  },
  getQueueIdByVendorsBundleName: getQueueIdByVendorsBundleName,
  remove: function (vendorsBundleName) {
    var queueId = getQueueIdByVendorsBundleName(vendorsBundleName);

    fs.rmdir(path.resolve('temp', 'queues', queueId), function () {
      delete queue[queueId];
    });
  },
  update: function (id, bundle) {
    queue[id] = bundle;
  },
  get: function (req, res) {
    res.send(queue[req.params.id]);
  }
}
