'use strict';
window.aerieWorks.require('aerieWorks.vendor.google.drive', [
    'aerieWorks.OneTimeTrigger',
    'aerieWorks.vendor.google.Client'
  ], function (aw) {
  var driveTrigger = aw.vendor.google.Client.api('drive', 'v2');
  driveTrigger.require();

  var myTrigger = aw.OneTimeTrigger.create({
    name: 'aerieWorks.vendor.google.drive.DriveFile',
    dependencies: [ driveTrigger, aw.vendor.google.Client.authorization ],
    hardEvaluate: function (success) { success.call(); }
  });

  aw.Type.create({
    name: 'DriveFile',
    namespace: aw.vendor.google.drive,
    initializer: function (file) {
      this.buffer = null;
      this.file = file;
      this.name = file.title;
      this.type = file.mimeType;
    },

    members: {
      getId: function () {
        return this.file.id;
      },

      getUrl: function () {
        return this.file.webContentLink;
      },

      read: function (suggestedSize, callback) {
        if (this.buffer && this.buffer.byteLength >= suggestedSize) {
          callback.call(null, this.buffer);
          return;
        }

        var me = this;
        myTrigger.require(function () {
          aw.vendor.google.Client.executeXhr({
            method: 'GET',
            url: me.file.downloadUrl,
            responseType: 'arraybuffer',
            headers: {
              Range: 'bytes=0-1' + (suggestedSize - 1)
            },
            success: function (response) {
              me.buffer = response;
              callback.call(null, me.buffer);
            }
          });
        });
      }
    }
  });
});
