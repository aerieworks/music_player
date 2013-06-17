'use strict';
window.aerieWorks.require('aerieWorks.musicPlayer.file', [
   'aerieWorks.Event',
   'aerieWorks.musicPlayer.file.AudioFileFactory'
  ], function (aw) {

  aw.Type.create({
    name: 'AudioFile',
    namespace: aw.musicPlayer.file,

    initializer: function (file) {
      this.debug('AudioFile initializer: ' + (file ? file.name : '<null>'));
      if (file == null) {
        return;
      }

      this.file = file;
      this.url = file.getUrl();
      this.filename = file.name;
      this.onFileChanged = aw.Event.create();
    },

    members: {
      getAlbum: function () { return null; },
      getArtist: function () { return null; },
      getDisplayName: function () {
        return this.filename;
      },
      getSourceFileId: function () { return null; },
      getTitle: function () { return null; },
      getUrl: function () {
        return this.url;
      }
    },

    onCreated: function () {
      aw.musicPlayer.file.AudioFileFactory.registerDefaultFileType(this);
    }
  });
});
