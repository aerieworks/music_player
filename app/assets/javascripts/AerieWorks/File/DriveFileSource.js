"use strict";
(function (AW) {
  var driveTrigger = new AW.OneTimeTrigger({
    name: 'AerieWorks.File.DriveFileSource.drive',
    dependencies: [ AW.Google.api('drive', 'v2'), AW.Google.authorization ],
    hardEvaluate: function (success) { success.call(); }
  });


  function getList(mimeType, callback) {
    driveTrigger.require(function () {
      var request = gapi.client.drive.files.list({
        q: "mimeType = '" + mimeType + "'"
      });

      AW.Google.execute(request, function (result) {
        if (result.items) {
          AW.Log.debug('DriveFileSource.getList: ' + result.items.length + ' files of MIME type ' + mimeType + ' found.');
          for (var i = 0; i < result.items.length; i++) {
            AW.Log.debug('DriveFileSource.getList: found "' + result.items[i].title + '"' +
              '\n\tid: ' + result.items[i].id +
              '\n\tselfLink: ' + result.items[i].selfLink +
              '\n\tfileExtension: ' + result.items[i].fileExtension);
          }
          callback.call(null, result);
        } else {
          AW.Log.debug('DriveFileSource.getList: No files of MIME type ' + mimeType + ' found.');
        }
      });
    });
  }

  AW.Google.api('drive', 'v2').require();

  AW.File.DriveFileSource = {
    getList: getList
  };

})(window.AerieWorks);
