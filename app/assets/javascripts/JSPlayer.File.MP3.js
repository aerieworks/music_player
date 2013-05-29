(function() {
    "use strict";

    // Constructor
    function mp3(file) {
        var reader;

        JSPlayer.File.audioFile.call(this, file);

        this.id3v1 = new JSPlayer.File.id3v1Reader();
        this.id3v2 = new JSPlayer.File.ID3v2Reader();

        reader = new JSPlayer.File.queuedReader();
        reader.readBuffer(file, readTags.bind(this));
    }

    // Private methods
    function readTags(buffer) {
        JSPlayer.log('JSPlayer.File.mp3.readTags: Reading id3v1 tags for ' + this.filename);
        //this.id3v1.readTags(buffer);
        JSPlayer.log('JSPlayer.File.mp3.readTags: Reading id3v2 tags for ' + this.filename);
        //try {
            this.id3v2.read(buffer);
        //} catch (ex) {
            //JSPlayer.log('JSPlayer.File.mp3.readTags: ' + ex.message);
        //}
        JSPlayer.log('JSPlayer.File.mp3.readTags: triggering onFileChanged.');
        this.onFileChanged.trigger(this);
    }

    // Public methods
    function getDisplayName() {
        var parts = [];
        if (this.id3v2.frames['TPE1'] != null) {
            parts.push(this.id3v2.frames['TPE1'].value);
        } else if (this.id3v1.artist !== null) {
            parts.push(this.id3v1.artist);
        }

        if (this.id3v2.frames['TALB'] != null) {
            parts.push(this.id3v2.frames['TALB'].value);
        } else if (this.id3v1.album !== null) {
            parts.push(this.id3v1.album);
        }

        if (this.id3v1.year !== null) {
            parts.push('[' + this.id3v1.year + ']');
        }
        if (this.id3v1.trackNumber !== null) {
            parts.push(this.id3v1.trackNumber);
        }

        if (this.id3v2.frames['TIT2'] != null) {
            parts.push(this.id3v2.frames['TIT2'].value);
        } else if (this.id3v1.title !== null) {
            parts.push(this.id3v1.title);
        }
        if (this.id3v1.genre !== null) {
            parts.push('(' + this.id3v1.genre + ')');
        }
        if (this.id3v1.comment !== null) {
            parts.push('(' + this.id3v1.comment + ')');
        }

        if (parts.length > 0) {
            return parts.join(' - ');
        } else {
            return JSPlayer.File.audioFile.prototype.getDisplayName.call(this);
        }
    }

    mp3.prototype = new JSPlayer.File.audioFile();
    mp3.prototype.getDisplayName = getDisplayName;

    JSPlayer.File.mp3 = mp3;
})();
