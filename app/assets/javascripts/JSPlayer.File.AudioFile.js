(function() {
    "use strict";
    var URLAPI = window.URL || window.webkitURL;

    // Constructor
    function audioFile(file) {
        if (file == null) {
            return;
        }

        this.url = URLAPI.createObjectURL(file);
        this.filename = file.name;
        this.onFileChanged = new JSPlayer.event();
    }

    function getDisplayName() {
        return this.filename;
    }

    audioFile.prototype = {
        getDisplayName: getDisplayName
    };

    // Factory
    function create(file) {
        if (/\.mp3$/.test(file.name)) {
            JSPlayer.log('JSPlayer.File.create: creating mp3 from ' + file.name);
            return new JSPlayer.File.mp3(file);
        } else {
            JSPlayer.log('JSPlayer.File.create: creating audioFile from ' + file.name);
            return new JSPlayer.File.audioFile(file);
        }
    }

    JSPlayer.File.audioFile = audioFile;
    JSPlayer.File.create = create;
})();
