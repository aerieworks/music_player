"use strict";
(function (aw) {
  var driveTrigger = aw.vendor.google.api('drive', 'v2');
  driveTrigger.require();

  var myTrigger = new aw.OneTimeTrigger({
    name: 'aerieWorks.file.DriveFile',
    dependencies: [ driveTrigger, aw.vendor.google.authorization ],
    hardEvaluate: function (success) { success.call(); }
  });

  function constructor(file) {
    this.buffer = null;
    this.file = file;
    this.name = file.title;
    this.type = file.mimeType;
  }

  function getUrl() {
    return this.file.webContentLink;
  }

  function read(suggestedSize, callback) {
    if (this.buffer && this.buffer.byteLength >= suggestedSize) {
      callback.call(null, this.buffer);
      return;
    }

    var me = this;
    myTrigger.require(function () {
      var token = gapi.auth.getToken().access_token;
      var xhr = new XMLHttpRequest();
      xhr.open('GET', me.file.downloadUrl, true);
      xhr.setRequestHeader('Authorization', 'Bearer ' + token);
      xhr.setRequestHeader('Range', 'bytes=0-' + (suggestedSize - 1));
      xhr.responseType = 'arraybuffer';
      xhr.onload = function () {
        me.buffer = xhr.response;
        callback.call(null, me.buffer);
      };
      xhr.send(null);
    });
  }

  constructor.prototype = {
    getUrl: getUrl,
    read: read
  };

  aw.file.DriveFile = constructor;
})(window.aerieWorks);
