'use strict';
window.aerieWorks.require(function (aw, $) {
  var handlerDefaults = {
    once: false
  };

  aw.Type.create({
    name: 'Event',
    namespace: aw,

    initializer: function () {
      this.nextHandlerId = 1;
      this.handlers = [];
    },

    members: {
      addHandler: function (arg) {
        var handler = {
          id: this.nextHandlerId
        };

        $.extend(handler, handlerDefaults);
        if ($.isFunction(arg)) {
          handler.method = arg;
        } else {
          $.extend(handler, arg);
        }

        this.nextHandlerId += 1;
        this.handlers.push(handler);
        return handler.id;
      },

      removeHandler: function (handlerId) {
        for (var i = 0; i < this.handlers.length; i++) {
          if (this.handlers[i].id == handlerId) {
            this.handlers.splice(i, 1);
            break;
          }
        }
      },

      trigger: function () {
        for (var i = 0; i < this.handlers.length; i++) {
          this.handlers[i].method.apply(null, arguments);
          if (this.handlers[i].once) {
            this.handlers.splice(i, 1);
            i -= 1;
          }
        }
      }
    }
  });
});
