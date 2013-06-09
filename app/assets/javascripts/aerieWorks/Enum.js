'use strict';
window.aerieWorks.require(function (aw) {
  aw.Type.create({
    name: 'Enum',
    namespace: aw,
    initializer: function Enum(values) {
      this.values = values;

      for (var i = 0; i < this.values.length; i++) {
        this[this.values[i]] = i;
      }
    },
    members: {
      each: function (fn) {
        for (var i = 0; i < this.values.length; i++) {
          if (fn(i) === false) {
            break;
          }
        }
      },

      reverseEach: function (fn) {
        for (var i = this.values.length - 1; i >= 0; i--) {
          if (fn(i) === false) {
            break;
          }
        }
      }
    }
  });
});
