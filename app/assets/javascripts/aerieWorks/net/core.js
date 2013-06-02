'use strict';
window.aerieWorks.require('aerieWorks.net', [
    'aerieWorks.util.RequestQueue'
  ], function (aw) {
  var netIoRequestQueue;

  aw.net.define({
    getNetIoRequestQueue: function () {
      if (netIoRequestQueue == null) {
        netIoRequestQueue = new aw.util.RequestQueue(8, 30000);
      }

      return netIoRequestQueue;
    }
  });
});
