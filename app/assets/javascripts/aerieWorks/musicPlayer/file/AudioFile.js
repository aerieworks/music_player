"use strict";
(function (aw) {
  // Constructor
  function audioFile(file) {
    if (file == null) {
      return;
    }

    this.file = file;
    this.url = file.getUrl();
    this.filename = file.name;
    this.onFileChanged = new aw.Event();
  }

  function getDisplayName() {
    return this.filename;
  }

  audioFile.prototype = {
    getDisplayName: getDisplayName
  };

  // Factory
  audioFile.create = function (file) {
    if (/\.mp3$/.test(file.name)) {
      aw.log.debug('aw.musicPlayer.file.AudioFile.create: creating mp3 from ' + file.name);
      return new aw.musicPlayer.file.Mp3(file);
    } else {
      aw.log.debug('aw.musicPlayer.file.AudioFile.create: creating audioFile from ' + file.name);
      return new aw.musicPlayer.file.AudioFile(file);
    }
  }

  aw.musicPlayer.file.AudioFile = audioFile;
})(window.aerieWorks);
