"use strict";
window.aerieWorks.require('aerieWorks.musicPlayer.metadata', [
   'aerieWorks.log'
  ], function (aw) {
  // Constructor
  function id3v1Reader() {
    this.album = null;
    this.artist = null;
    this.comment = null;
    this.genre = null;
    this.title = null;
    this.trackNumber = null;
    this.year = null;
  }

  // Private methods
  function readTextFrame(reader, view, offset, max) {
    var characters = [];
    var curChar;

    for (var i = 0; i < max; i++) {
      curChar = view[offset + i];
      if (curChar == 0) {
        break;
      }
      characters.push(String.fromCharCode(curChar));
    }

    return characters.join('');
  }

  function readBinaryFrame(reader, view, offset) {
    return view[offset];
  }

  // Public methods
  function readTags(buffer) {
    var tag = new Uint8Array(buffer, buffer.byteLength - 128);
    aw.log.debug('aw.musicPlayer.metadata.Id3v1Reader.readTags: reading tags.');
    if ('TAG' == tag.getString(0, 3)) {
      this.title = readTextFrame(this, tag, 3, 30);
      this.artist = readTextFrame(this, tag, 33, 30);
      this.album = readTextFrame(this, tag, 63, 30);
      this.year = readTextFrame(this, tag, 93, 4);
      this.comment = readTextFrame(this, tag, 97, 28);
      this.trackNumber = readBinaryFrame(this, tag, 126);
      this.genre = readBinaryFrame(this, tag, 127);
    }
  }

  aw.musicPlayer.metadata.define('Id3v1Reader', id3v1Reader, {
    readTags: readTags
  });
});
