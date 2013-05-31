"use strict";
(function (AW) {
  // Constructor
  function mp3(file) {
    var reader;

    AW.MusicPlayer.File.AudioFile.call(this, file);

    this.id3v1 = new AW.MusicPlayer.Metadata.Id3v1Reader();
    this.id3v2 = new AW.MusicPlayer.Metadata.Id3v2Reader();

    file.read(4096, readTags.bind(this));
  }

  // Private methods
  function readTags(buffer) {
    AW.Log.debug('AW.MusicPlayer.File.Mp3.readTags: Reading id3v2 tags for ' + this.filename);
    this.id3v2.read(buffer);
    AW.Log.debug('AW.MusicPlayer.File.Mp3.readTags: triggering onFileChanged.');
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
      return AW.MusicPlayer.File.AudioFile.prototype.getDisplayName.call(this);
    }
  }

  mp3.prototype = new AW.MusicPlayer.File.AudioFile();
  mp3.prototype.getDisplayName = getDisplayName;

  AW.MusicPlayer.File.Mp3 = mp3;
})(window.AerieWorks);
