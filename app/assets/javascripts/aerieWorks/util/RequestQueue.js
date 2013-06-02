'use strict';
window.aerieWorks.require('aerieWorks.util', [
    'aerieWorks.log',
    'aerieWorks.util.Request'
  ], function (aw) {
  function RequestQueue(maxConcurrent, defaultTimeout) {
    this.requests = {};
    aw.util.Request.Priority.each((function (value) {
      this.requests[value] = [];
    }).bind(this));
    this.activeRequests = [];
    this.maxConcurrent = maxConcurrent;
    this.defaultTimeout = defaultTimeout;
    this.request_onCompleteHandler = request_onComplete.bind(this);
  }

  function request_onComplete(request) {
    for (var i = 0; i < this.activeRequests.length; i++) {
      if (this.activeRequests[i].id == request.id) {
        this.activeRequests.splice(i, 1);
        break;
      }
    }

    aw.log.debug('aw.util.RequestQueue: Request completed. ' + this.getActiveCount() + ' of ' + this.maxConcurrent + ' now in progress.  ' + this.getPendingCount() + ' pending.');

    if (this.canStartRequest()) {
      startNextRequest.call(this);
    }
  }

  function startNextRequest() {
    var me = this;
    aw.util.Request.Priority.reverseEach(function (priority) {
      if (me.requests[priority].length > 0) {
        var request = me.requests[priority].shift();
        me.activeRequests.push(request);
        request.start();
        aw.log.debug('aw.util.RequestQueue: Request started. ' + me.getActiveCount() + ' of ' + me.maxConcurrent + ' now in progress.  ' + me.getPendingCount() + ' pending.');
        return false;
      }
    });
  }

  aw.util.define('RequestQueue', RequestQueue, {
    canStartRequest: function () {
      return this.activeRequests.length < this.maxConcurrent;
    },

    getActiveCount: function () {
      return this.activeRequests.length;
    },

    getPendingCount: function () {
      var me = this;
      var count = 0;
      aw.util.Request.Priority.each(function (priority) {
        count += me.requests[priority].length;
      });

      return count;
    },

    enqueue: function (args) {
      if ($.isFunction(args)) {
        args = { method: args };
      }

      if (args.timeout == null) {
        args.timeout = this.defaultTimeout;
      }
      if (args.priority == null) {
        args.priority = aw.util.Request.Priority.Normal;
      }

      var request = new aw.util.Request(args);
      if ($.isFunction(args.success)) {
        request.onSuccess.addHandler(args.success);
      }
      request.onSuccess.addHandler(this.request_onCompleteHandler);

      if ($.isFunction(args.failure)) {
        request.onFailure.addHandler(args.failure);
      }
      request.onFailure.addHandler(this.request_onCompleteHandler);

      this.requests[request.priority].push(request);
      aw.log.debug('aw.util.RequestQueue: Request enqueued. ' + this.getActiveCount() + ' of ' + this.maxConcurrent + ' now in progress.  ' + this.getPendingCount() + ' pending.');
      if (this.canStartRequest()) {
        startNextRequest.call(this);
      }

      return request.id;
    }
  });
});
