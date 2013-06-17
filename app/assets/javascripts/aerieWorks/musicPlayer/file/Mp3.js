'use strict';
window.aerieWorks.require('aerieWorks.musicPlayer.file', [
   'aerieWorks.musicPlayer.file.AudioFile',
   'aerieWorks.musicPlayer.file.AudioFileFactory',
   'aerieWorks.musicPlayer.metadata.Id3v1Reader',
   'aerieWorks.musicPlayer.metadata.Id3v2Reader'
  ], function (aw) {
  // Constructor
  function mp3(file) {
    var reader;
    this.debug('Mp3 initializer: ' + (file ? file.name : '<null>'));

    this.id3v1 = aw.musicPlayer.metadata.Id3v1Reader.create();
    this.id3v2 = aw.musicPlayer.metadata.Id3v2Reader.create();
    this.artist = null;
    this.album = null;

    file.read(4096, readTags.bind(this));
  }

  // Private methods
  function readTags(buffer) {
    this.debug('Reading id3v2 tags for ' + this.filename);
    if (!this.id3v2.read(buffer)) {
      this.debug('Buffer too small, requesting first ' + this.id3v2.fullSize + ' bytes of file.');
      this.file.read(this.id3v2.fullSize, readTags.bind(this));
      return;
    }

    this.debug('triggering onFileChanged.');
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
      return aw.musicPlayer.file.AudioFile.members.getDisplayName.call(this);
    }
  }

  function getFrameOrDefault(id3v2, frame, defaultValue) {
    if (id3v2.frames[frame] != null) {
      return id3v2.frames[frame].value;
    }

    return defaultValue;
  }

  aw.Type.create({
    name: 'Mp3',
    namespace: aw.musicPlayer.file,
    baseType: aw.musicPlayer.file.AudioFile,
    initializer: mp3,
    members: {
      getAlbum: function () {
        return getFrameOrDefault(this.id3v2, 'TALB', null);
      },
      getArtist: function () {
        return getFrameOrDefault(this.id3v2, 'TPE1', null);
      },
      getDisplayName: getDisplayName,
      getSourceFileId: function () {
        return this.file.getId();
      },
      getTitle: function () {
        return getFrameOrDefault(this.id3v2, 'TIT2', this.name);
      }
    },

    onCreated: function () {
      aw.musicPlayer.file.AudioFileFactory.registerFileType(/\.mp3$/i, this);
    }
  });
});
