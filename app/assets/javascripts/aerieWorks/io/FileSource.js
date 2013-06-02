'use strict';
window.aerieWorks.require('aerieWorks.io', [
    'aerieWorks.log'
  ], function (aw) {
  var sources = {};

  aw.io.define('FileSource', {
    registerSource: function (sourceType) {
      var typeId = sourceType.typeName;
      sources[typeId] = sourceType;
      return typeId;
    }
  });
});
