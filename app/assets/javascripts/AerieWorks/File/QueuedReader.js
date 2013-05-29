"use strict";
(function (AW) {
    var readerQueue = [];

    // Private static methods
    function processReaderQueue() {
        var item;
        var fileReader;

        function onReadComplete(ev) {
            AW.Log.debug('AW.File.QueuedReader.processReaderQueue: async read complete from ' + item.file.name);
            readerQueue.shift();
            processReaderQueue();
            item.callback.call(null, ev.target.result);
        }

        if (readerQueue.length > 0) {
            item = readerQueue[0];
            AW.Log.debug('AW.File.QueuedReader.processReaderQueue: starting async read from ' + item.file.name);
            fileReader = new FileReader();
            fileReader.onload = onReadComplete;
            fileReader.readAsArrayBuffer(item.file);
        }
    }

    // Constructor
    function queuedReader() {
    }

    // Public functions
    function readBuffer(file, callback) {
        AW.Log.debug('AW.File.QueuedReader.readBuffer: queuing a reader for ' + file.name);
        readerQueue.push({ file: file, callback: callback });
        if (readerQueue.length == 1) {
            processReaderQueue();
        }
    }

    queuedReader.prototype = {
        readBuffer: readBuffer
    };

    AW.File.QueuedReader = queuedReader;
})(window.AerieWorks);
