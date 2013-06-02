'use strict';
window.aerieWorks.require('aerieWorks.util', [
    'aerieWorks.log',
    'aerieWorks.Enum'
  ], function (aw, $) {
  var Priority = new aw.Enum([
    // Requests that are loading/syncing data that is not immediately asked for, but is expected to be needed.
    'PreFetch',
    // Requests that have been specifically asked for, but are not required for the user's workflow (e.g. loading file metadata).
    'Normal',
    // Requests that are required in order to proceed with the user's current workflow (e.g. loading file list form Drive).
    'User'
  ]);

  var nextRequestId = 0;

  function Request(args) {
    this.id = nextRequestId++;
    this.priority = Priority.Normal;
    this.requestTimer = null;
    this.onSuccess = new aw.Event();
    this.onFailure = new aw.Event();

    if ($.isFunction(args)) {
      this.method = args;
    } else {
      this.method = args.method;
      this.timeout = args.timeout;
      if (args.priority) {
        this.priority = args.priority;
      }
    }
  }

  function method_onSuccess(result) {
    cleanup.call(this);
    this.onSuccess.trigger(this, result);
  }

  function method_onFailure() {
    cleanup.call(this);
    this.onFailure.trigger(this, result);
  }

  function cleanup() {
    if (this.requestTimer) {
      clearTimeout(this.requestTimer);
      this.requestTimer = null;
    }
  }

  Request.Priority = Priority;
  aw.util.define('Request', Request, {
    start: function () {
      this.method.call(null, method_onSuccess.bind(this), method_onFailure.bind(this));
      if (this.timeout != null) {
        this.requestTimer = setTimeout(method_onFailure.bind(this), this.timeout);
      }
    }
  });
});
