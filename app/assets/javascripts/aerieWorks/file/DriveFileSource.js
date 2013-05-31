"use strict";
(function (aw) {
  var driveTrigger = new aw.OneTimeTrigger({
    name: 'aerieWorks.File.DriveFileSource.drive',
    dependencies: [ aw.vendor.google.api('drive', 'v2'), aw.vendor.google.authorization ],
    hardEvaluate: function (success) { success.call(); }
  });


  function getList(mimeType, callback) {
    driveTrigger.require(function () {
      var request = gapi.client.drive.files.list({
        q: "mimeType = '" + mimeType + "'"
      });

      aw.vendor.google.execute(request, function (result) {
        if (result.items) {
          aw.log.debug('DriveFileSource.getList: ' + result.items.length + ' files of MIME type ' + mimeType + ' found.');
          for (var i = 0; i < result.items.length; i++) {
            aw.log.debug('DriveFileSource.getList: found "' + result.items[i].title + '"' +
              '\n\tid: ' + result.items[i].id +
              '\n\tselfLink: ' + result.items[i].selfLink +
              '\n\tfileExtension: ' + result.items[i].fileExtension);
          }
          callback.call(null, result);
        } else {
          aw.log.debug('DriveFileSource.getList: No files of MIME type ' + mimeType + ' found.');
        }
      });
    });
  }

  aw.vendor.google.api('drive', 'v2').require();

  aw.file.DriveFileSource = {
    getList: getList
  };

})(window.aerieWorks);
