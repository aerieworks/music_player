'use strict';
window.aerieWorks.require('aerieWorks.musicPlayer.file', [
   'aerieWorks.log',
   'aerieWorks.musicPlayer.file.AudioFile',
   'aerieWorks.musicPlayer.metadata.Id3v1Reader',
   'aerieWorks.musicPlayer.metadata.Id3v2Reader'
  ], function (aw) {
  // Constructor
  function mp3(file) {
    var reader;

    aw.musicPlayer.file.AudioFile.call(this, file);

    this.id3v1 = new aw.musicPlayer.metadata.Id3v1Reader();
    this.id3v2 = new aw.musicPlayer.metadata.Id3v2Reader();

    file.read(4096, readTags.bind(this));
  }

  // Private methods
  function readTags(buffer) {
    aw.log.debug('aw.musicPlayer.file.Mp3.readTags: Reading id3v2 tags for ' + this.filename);
    if (!this.id3v2.read(buffer)) {
      aw.log.debug('aw.musicPlayer.file.Mp3.readTags: Buffer too small, requesting first ' + this.id3v2.fullSize + ' bytes of file.');
      this.file.read(this.id3v2.fullSize, readTags.bind(this));
      return;
    }

    aw.log.debug('aw.musicPlayer.file.Mp3.readTags: triggering onFileChanged.');
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
      return aw.musicPlayer.file.AudioFile.prototype.getDisplayName.call(this);
    }
  }

  mp3.prototype = new aw.musicPlayer.file.AudioFile();
  mp3.prototype.getDisplayName = getDisplayName;

  aw.musicPlayer.file.define('Mp3', mp3);
});
