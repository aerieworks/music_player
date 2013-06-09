'use strict';
window.aerieWorks.require('aerieWorks.io', [
    'aerieWorks.util.RequestQueueFactory'
  ], function (aw) {
  var urlApi = window.URL || window.webkitURL;

  function constructor(file) {
    this.buffer = null;
    this.file = file;
    this.name = file.name;
    this.type = file.type;
  }

  function fileReader_load(bufferCallback, requestCallback, ev) {
    this.debug('Finished reading ' + this.name + ' from disk.');
    this.buffer = ev.target.result;
    requestCallback(ev.target.result);
    bufferCallback(this.buffer);
  }

  function getUrl() {
    return urlApi.createObjectURL(this.file);
  }

  function startRead(bufferCallback, requestCallback) {
    this.debug('Starting to read ' + this.name + ' from disk.');
    var fileReader = aw.io.FileReader.create();
    fileReader.onload = fileReader_load.bind(this, bufferCallback, requestCallback);
    fileReader.readAsArrayBuffer(this.file);
  }

  function read(suggestedSize, callback) {
    if (this.buffer) {
      this.debug('File ' + this.name + ' already read from disk, calling back immediately.');
      callback(this.buffer);
      return;
    }

    this.debug('File queuing request to read ' + this.name + ' from disk.');
    aw.util.RequestQueueFactory.getLocalIoRequestQueue().enqueue(startRead.bind(this, callback));
  }

  aw.Type.create({
    name: 'LocalFile',
    namespace: aw.io,
    initializer: constructor,
    members: {
      getUrl: getUrl,
      read: read
    }
  });
});
