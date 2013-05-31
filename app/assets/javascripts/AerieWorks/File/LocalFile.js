"use strict";
(function (aw) {
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
    } else {
      var reader = new aw.io.QueuedReader();
      reader.readBuffer(this.file, callback);
    }
  }

  constructor.prototype = {
    getUrl: getUrl,
    read: read
  };

  aw.file.LocalFile = constructor;
})(window.AerieWorks);
