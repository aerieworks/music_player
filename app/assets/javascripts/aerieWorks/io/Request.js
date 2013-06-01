'use strict';
(function (aw, $) {
  var Priority = {
    // Requests that are loading/syncing data that is not immediately asked for, but is expected to be needed.
    PreFetch: 0,
    // Requests that have been specifically asked for, but are not required for the user's workflow (e.g. loading file metadata).
    Normal: 1,
    // Requests that are required in order to proceed with the user's current workflow (e.g. loading file list form Drive).
    User: 2
  };

  var nextRequestId = 0;

  function requestConstructor(args) {
    this.id = nextRequestId++;
    this.priority = Priority.Normal;
    this.requestTimer = null;
    this.success = new aw.Event();
    this.failure = new aw.Event();

    if ($.isFunction(args)) {
      this.method = args;
    } else {
      this.method = args.method;
      if (args.priority) {
        this.priority = args.priority;
      }
    }
  }

  function method_onSuccess(result) {
    this.success.trigger(this, result);
  }

  function method_onFailure() {
    this.failure.trigger(this, result);
  }

  requestConstructor.prototype = {
    start: function () {
      this.method.call(null, method_onSuccess.bind(this), method_onFailure.bind(this));
    }
  };

  aw.util.queue.Request = requestConstructor;
  aw.util.Request.Priority = Priority;
})(window.aerieWorks, window.jQuery);
