'use strict';
window.aerieWorks.require('aerieWorks.util', [
   'aerieWorks.util.RequestQueue'
  ], function (aw) {
  var queues = {
    localIo: function () { return aw.util.RequestQueue.create(4, 10000); },
    net: function () { return aw.util.RequestQueue.create(8, 30000); }
  };

  function getQueue(type) {
    if (typeof queues[type] == 'function') {
      queues[type] = queues[type]();
    }

    return queues[type];
  }

  aw.Type.create({
    name: 'RequestQueueFactory',
    namespace: aw.util,
    statics: {
      getLocalIoRequestQueue: function () { return getQueue('localIo'); },
      getNetRequestQueue: function () { return getQueue('net'); }
    }
  });
});
