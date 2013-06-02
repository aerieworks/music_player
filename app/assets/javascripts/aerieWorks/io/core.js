'use strict';
window.aerieWorks.require('aerieWorks.io', [
   'aerieWorks.util.RequestQueue'
  ], function (aw) {
  var localIoRequestQueue;

  aw.io.define({
    getLocalIoRequestQueue: function () {
      if (localIoRequestQueue == null) {
        localIoRequestQueue = new aw.util.RequestQueue(4, 10000);
      }

      return localIoRequestQueue;
    }
  });
});
