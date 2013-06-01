"use strict";
window.aerieWorks.require('aerieWorks.file', [
    'aerieWorks.io.QueuedReader'
  ], function (aw) {
  var urlApi = window.URL || window.webkitURL;

  function constructor(file) {
    this.buffer = null;
    this.file = file;
    this.name = file.name;
    this.type = file.type;
  }

  function getUrl() {
    return urlApi.createObjectURL(this.file);
  }

  function read(suggestedSize, callback) {
    if (this.buffer) {
      callback.call(null, this.buffer);
      return;
    }

    function callbackWrapper(buf) {
      this.buffer = buf;
      callback.call(null, this.buffer);
    }

    var reader = new aw.io.QueuedReader();
    reader.readBuffer(this.file, callbackWrapper.bind(this));
  }

  aw.file.define('LocalFile', constructor, {
    getUrl: getUrl,
    read: read
  });
});
