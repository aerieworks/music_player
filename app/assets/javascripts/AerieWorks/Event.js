"use strict";
(function (AW, $) {
  var handlerDefaults = {
    once: false
  };

  function constructor() {
    this.nextHandlerId = 1;
    this.handlers = [];
  }

  function addHandler(arg) {
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
  }

  function removeHandler(handlerId) {
    for (var i = 0; i < this.handlers.length; i++) {
      if (this.handlers[i].id == handlerId) {
        this.handlers.removeAt(i);
        break;
      }
    }
  }

  function trigger() {
    for (var i = 0; i < this.handlers.length; i++) {
      this.handlers[i].method.apply(null, arguments);
      if (this.handlers[i].once) {
        this.handlers.removeAt(i);
        i -= 1;
      }
    }
  }

  constructor.prototype = {
    addHandler: addHandler,
    removeHandler: removeHandler,
    trigger: trigger
  };

  AW.Event = constructor;
})(window.AerieWorks, window.jQuery);
