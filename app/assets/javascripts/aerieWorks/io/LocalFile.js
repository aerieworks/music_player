'use strict';
window.aerieWorks.require('aerieWorks.io', [
    'aerieWorks.log',
    'aerieWorks.io.getLocalIoRequestQueue',
    'aerieWorks.util.RequestQueue'
  ], function (aw) {
  var urlApi = window.URL || window.webkitURL;

  function constructor(file) {
    this.buffer = null;
    this.file = file;
    this.name = file.name;
    this.type = file.type;
  }

  function fileReader_load(bufferCallback, requestCallback, ev) {
    aw.log.debug('aw.io.LocalFile: Finished reading ' + this.name + ' from disk.');
    this.buffer = ev.target.result;
    requestCallback(ev.target.result);
    bufferCallback(this.buffer);
  }

  function getUrl() {
    return urlApi.createObjectURL(this.file);
  }

  function startRead(bufferCallback, requestCallback) {
    aw.log.debug('aw.io.LocalFile: Starting to read ' + this.name + ' from disk.');
    var fileReader = new FileReader();
    fileReader.onload = fileReader_load.bind(this, bufferCallback, requestCallback);
    fileReader.readAsArrayBuffer(this.file);
  }

  function read(suggestedSize, callback) {
    if (this.buffer) {
      aw.log.debug('aw.io.LocalFile: File ' + this.name + ' already read from disk, calling back immediately.');
      callback(this.buffer);
      return;
    }

    aw.log.debug('aw.io.LocalFile: File queuing request to read ' + this.name + ' from disk.');
    aw.io.getLocalIoRequestQueue().enqueue(startRead.bind(this, callback));
  }

  aw.io.define('LocalFile', constructor, {
    getUrl: getUrl,
    read: read
  });
});
