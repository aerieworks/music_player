"use strict";
(function (AW) {
    var readerQueue = [];

    // Private static methods
    function processReaderQueue() {
        var item;
        var fileReader;

        function onReadComplete(ev) {
            AW.Log.debug('AW.io.QueuedReader.processReaderQueue: async read complete from ' + item.file.name);
            readerQueue.shift();
            processReaderQueue();
            item.callback.call(null, ev.target.result);
        }

        function onProgress(ev) {
          AW.Log.debug('AW.ioQueuedReader.processReaderQueue: Progress made:' +
            '\n\tByte length: ' + ev.target.result.byteLength);
          console.log(ev);
        }

        if (readerQueue.length > 0) {
            item = readerQueue[0];
            AW.Log.debug('AW.io.QueuedReader.processReaderQueue: starting async read from ' + item.file.name);
            fileReader = new FileReader();
            fileReader.onload = onReadComplete;
            fileReader.onprogress = onProgress;
            fileReader.readAsArrayBuffer(item.file);
        }
    }

    // Constructor
    function queuedReader() {
    }

    // Public functions
    function readBuffer(file, callback) {
        AW.Log.debug('AW.io.QueuedReader.readBuffer: queuing a reader for ' + file.name);
        readerQueue.push({ file: file, callback: callback });
        if (readerQueue.length == 1) {
            processReaderQueue();
        }
    }

    queuedReader.prototype = {
        readBuffer: readBuffer
    };

    AW.io.QueuedReader = queuedReader;
})(window.AerieWorks);
