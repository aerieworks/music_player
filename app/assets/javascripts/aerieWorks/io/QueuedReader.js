"use strict";
(function (aw) {
    var readerQueue = [];

    // Private static methods
    function processReaderQueue() {
        var item;
        var fileReader;

        function onReadComplete(ev) {
            aw.log.debug('aw.io.QueuedReader.processReaderQueue: async read complete from ' + item.file.name);
            readerQueue.shift();
            processReaderQueue();
            item.callback.call(null, ev.target.result);
        }

        function onProgress(ev) {
          aw.log.debug('aw.io.QueuedReader.processReaderQueue: Progress made:' +
            '\n\tByte length: ' + ev.target.result.byteLength);
          console.log(ev);
        }

        if (readerQueue.length > 0) {
            item = readerQueue[0];
            aw.log.debug('aw.io.QueuedReader.processReaderQueue: starting async read from ' + item.file.name);
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
        aw.log.debug('aw.io.QueuedReader.readBuffer: queuing a reader for ' + file.name);
        readerQueue.push({ file: file, callback: callback });
        if (readerQueue.length == 1) {
            processReaderQueue();
        }
    }

    queuedReader.prototype = {
        readBuffer: readBuffer
    };

    aw.io.QueuedReader = queuedReader;
})(window.aerieWorks);
