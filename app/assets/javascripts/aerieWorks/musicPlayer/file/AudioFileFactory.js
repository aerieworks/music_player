'use strict';
window.aerieWorks.require('aerieWorks.musicPlayer.file', function (aw) {
  var defaultFileType = null;
  var fileTypes = [];

  aw.Type.create({
    name: 'AudioFileFactory',
    namespace: aw.musicPlayer.file,
    statics: {
      registerDefaultFileType: function (type) {
        this.defaultFileType = type;
      },

      registerFileType: function (nameRegex, type) {
        fileTypes.push({ regex: nameRegex, type: type });
      },

      createFile: function (file) {
        var fileType = defaultFileType;
        for (var i = 0; i < fileTypes.length; i++) {
          if (fileTypes[i].regex.test(file.name)) {
            fileType = fileTypes[i].type;
            break;
          }
        }

        if (fileType == null) {
          throw 'Unable to detect file type for file "' + file.name + '".';
        }

        this.debug('Creating ' + fileType.getType().getFullName() + ' from ' + file.name);
        return fileType.create(file);
      }
    }
  });
});
