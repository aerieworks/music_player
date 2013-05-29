(function() {
    "use strict";
    var readerQueue = [];

    // Private static methods
    function processReaderQueue() {
        var item;
        var fileReader;

        function onReadComplete(ev) {
            JSPlayer.log('JSPlayer.File.queuedReader.processReaderQueue: async read complete from ' + item.file.name);
            readerQueue.shift();
            processReaderQueue();
            item.callback.call(null, ev.target.result);
        }

        if (readerQueue.length > 0) {
            item = readerQueue[0];
            JSPlayer.log('JSPlayer.File.queuedReader.processReaderQueue: starting async read from ' + item.file.name);
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
        JSPlayer.log('JSPlayer.File.queuedReader.readBuffer: queuing a reader for ' + file.name);
        readerQueue.push({ file: file, callback: callback });
        if (readerQueue.length == 1) {
            processReaderQueue();
        }
    }

    queuedReader.prototype = {
        readBuffer: readBuffer
    };

    JSPlayer.File.queuedReader = queuedReader;
})();
