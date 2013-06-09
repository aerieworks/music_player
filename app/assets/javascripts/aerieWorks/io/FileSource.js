'use strict';
window.aerieWorks.require('aerieWorks.io', function (aw) {
  var sources = {};

  aw.Type.create({
    name: 'FileSource',
    namespace: aw.io,
    statics: {
      registerSource: function (sourceType) {
        var typeId = sourceType.typeName;
        sources[typeId] = sourceType;
        return typeId;
      }
    }
  });
});
