'use strict';
window.aerieWorks.require('aerieWorks.io', [ 'aerieWorks.log' ], function (aw) {
    // Constructor
    function ForwardReader(view) {
        this.view = view;
        this.index = 0;
    }

    // Private methods
    function readUint(reader, byteLength, bitsPerByte) {
        var value = 0;
        for (var i = 0; i < byteLength; i++) {
            value = (value << bitsPerByte) + reader.readByte();
        }
        return value;
    }

    // Public methods
    function getRemainingBytes() {
        return this.view.length - this.index;
    }

    function readByte() {
        var b = this.view[this.index];
        if (b == null || b == undefined) {
          aw.log.warn('ForwardReader.readByte: got null byte at index ' + this.index);
        }

        this.index += 1;
        return b;
    }

    function readBytes(length) {
        var bytes = [];
        for (var i = 0; i < length; i++) {
            bytes.push(this.readByte());
        }
        return bytes;
    }

    function readSyncsafeInt(byteLength) {
        if (byteLength === undefined) {
            byteLength = 4;
        }
        return readUint(this, byteLength, 7);
    }

    function readUint32() {
        return readUint(this, 4, 8);
    }

    aw.io.define('ForwardReader', ForwardReader, {
        getRemainingBytes: getRemainingBytes,
        readByte: readByte,
        readBytes: readBytes,
        readSyncsafeInt: readSyncsafeInt,
        readUint32: readUint32
    });
});
