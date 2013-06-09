'use strict';
window.aerieWorks.require('aerieWorks.vendor.google.drive', [
    'aerieWorks.OneTimeTrigger',
    'aerieWorks.io.FileSource',
    'aerieWorks.vendor.google.Client',
    'aerieWorks.vendor.google.drive.DriveFile'
  ], function (aw) {
  var driveTrigger = aw.vendor.google.Client.api('drive', 'v2');
  var sourceId = null;
  driveTrigger.require();

  var myTrigger = aw.OneTimeTrigger.create({
    name: 'aerieWorks.File.DriveFileSource.drive',
    dependencies: [ driveTrigger, aw.vendor.google.Client.authorization ],
    hardEvaluate: function (success) { success.call(); }
  });

  function getList(mimeType, callback) {
    myTrigger.require(function () {
      var request = gapi.client.drive.files.list({
        q: "mimeType = '" + mimeType + "'"
      });

      aw.vendor.google.Client.execute(request, function (result) {
        if (result.items) {
          aw.vendor.google.drive.DriveFileSource.debug(result.items.length + ' files of MIME type ' + mimeType + ' found.');
          var files = [];
          for (var i = 0; i < result.items.length; i++) {
            aw.vendor.google.drive.DriveFileSource.debug('found "' + result.items[i].title + '"' +
              '\n\tid: ' + result.items[i].id +
              '\n\tdownloadUrl: ' + result.items[i].downloadUrl +
              '\n\twebContentLink: ' + result.items[i].webContentLink +
              '\n\tfileExtension: ' + result.items[i].fileExtension);
            files.push(aw.vendor.google.drive.DriveFile.create(result.items[i]));
          }

          callback.call(null, files);
        } else {
          aw.vendor.google.drive.DriveFileSource.debug('No files of MIME type ' + mimeType + ' found.');
        }
      });
    });
  }

  aw.Type.create({
    name: 'DriveFileSource',
    namespace: aw.vendor.google.drive,
    statics: {
      getList: getList
    }
  });
  sourceId = aw.io.FileSource.registerSource(aw.vendor.google.drive.DriveFileSource);
});
