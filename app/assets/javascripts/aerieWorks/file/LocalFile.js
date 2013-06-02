'use strict';
window.aerieWorks.require('aerieWorks.file', [
    'aerieWorks.log',
    'aerieWorks.util.RequestQueue'
  ], function (aw) {
  var urlApi = window.URL || window.webkitURL;
  var ioQueue = new aw.util.RequestQueue(4, 10000);

  function constructor(file) {
    this.buffer = null;
    this.file = file;
    this.name = file.name;
    this.type = file.type;
  }

  function fileReader_load(bufferCallback, requestCallback, ev) {
    aw.log.debug('aw.file.LocalFile: Finished reading ' + this.name + ' from disk.');
    this.buffer = ev.target.result;
    requestCallback(ev.target.result);
    bufferCallback(this.buffer);
  }

  function getUrl() {
    return urlApi.createObjectURL(this.file);
  }

  function startRead(bufferCallback, requestCallback) {
    aw.log.debug('aw.file.LocalFile: Starting to read ' + this.name + ' from disk.');
    var fileReader = new FileReader();
    fileReader.onload = fileReader_load.bind(this, bufferCallback, requestCallback);
    fileReader.readAsArrayBuffer(this.file);
  }

  function read(suggestedSize, callback) {
    if (this.buffer) {
      aw.log.debug('aw.file.LocalFile: File ' + this.name + ' already read from disk, calling back immediately.');
      callback(this.buffer);
      return;
    }

    aw.log.debug('aw.file.LocalFile: File queuing request to read ' + this.name + ' from disk.');
    ioQueue.enqueue(startRead.bind(this, callback));
  }

  aw.file.define('LocalFile', constructor, {
    getUrl: getUrl,
    read: read
  });
});
