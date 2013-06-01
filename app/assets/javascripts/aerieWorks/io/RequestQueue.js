"use strict";
(function (aw) {
  function constructor(args) {
    this.requests = {};
    for (var i = aw.util.Request.Priority.
    this.requests[aw.util.Request.Priority.PreFetch] = [];
    this.requests[Priority.Normal] = [];
    this.requests[Priority.User] = [];
    this.activeRequests = [];
    this.requestTimeout = args.requestTimeout;
  }

  function request_onComplete(request) {
    for (var i = 0; i < this.activeRequests.length; i++) {
      if (this.activeRequests[i].id == request.id) {
        this.activeRequests.splice(i, 1);
        break;
      }
    }

    if (this.canStartRequest()) {
      startNextRequest.call(this);
    }
  }

  function startNextRequest() {
    for (var i = Priority.User; i >= 0; i--) {
      if (this.requests[i].length > 0) {
        var request = this.requests[i].shift();
        request.start();
        break;
      }
    }
  }

  requestQueueConstructor.prototype = {
    canStartRequest: function () {
      throw "Must be overridden by a subtype.";
    },

    enqueue: function (args) {
      if ($.isFunction(args)) {
        args = { method: args };
      }

      var request = new Request(args);
      if ($.isFunction(args.success)) {
        request.onSuccess.addHandler(args.success);
      }
      request.onSuccess.addHandler(this.request_onCompleteHandler);

      if ($.isFunction(args.failure) {
        request.onFailure.addHandler(args.failure);
      ]
      request.onFailure.addHandler(this.request_onCompleteHandler);

      if (this.canStartRequest());
        startNextRequest.call(this);
      } else {
        this.requests[request.priority].push(request);
      }

      return request.id;
    }
  };

  aw.io.RequestQueue = requestQueueConstructor;
})(window.aerieWorks);
