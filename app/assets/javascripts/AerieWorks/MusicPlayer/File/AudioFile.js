"use strict";
(function (AW) {
  // Constructor
  function audioFile(file) {
    if (file == null) {
      return;
    }

    this.url = file.getUrl();
    this.filename = file.name;
    this.onFileChanged = new AW.Event();
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
      AW.Log.debug('AW.MusicPlayer.File.AudioFile.create: creating mp3 from ' + file.name);
      return new AW.MusicPlayer.File.Mp3(file);
    } else {
      AW.Log.debug('AW.MusicPlayer.File.AudioFile.create: creating audioFile from ' + file.name);
      return new AW.MusicPlayer.File.AudioFile(file);
    }
  }

  AW.MusicPlayer.File.AudioFile = audioFile;
})(window.AerieWorks);
