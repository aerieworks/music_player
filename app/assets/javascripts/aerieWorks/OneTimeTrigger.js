'use strict';
aerieWorks.require([ 'aerieWorks.Event' ], function (aw, $) {
  var State = {
    Unknown: 0,
    Blocked: 1,
    Evaluating: 2,
    Success: 3,
    Failure: 4
  };

  var defaults = {
    name: '',
    dependencies: [],
    notifyOnFailure: false,
    softEvaluate: null
  };

  function constructor(options) {
    var fullOptions = $.extend({}, defaults, options);

    if (!$.isFunction(fullOptions.hardEvaluate)) {
      throw "aerieWorks.OneTimeTrigger: option hardEvaluate is required and must be function.";
    }

    this.name = fullOptions.name;
    this.dependencies = fullOptions.dependencies;
    this.notifyOnFailure = !!fullOptions.notifyOnFailure;
    this.hardEvaluate = fullOptions.hardEvaluate;
    this.softEvaluate = fullOptions.softEvaluate;
    this.requiresEvaluation = false;

    this.state = State.Unknown;
    this.onSuccess = new aw.Event();

    if (this.notifyOnFailure) {
      this.onFailure = new aw.Event();
    } else {
      this.onFailure = null;
    }

    if (!hasDependencies(this)) {
      execSoftEvaluate(this);
    } else {
      for (var i = 0; i < this.dependencies.length; i++) {
        aw.log.debug('aerieWorks.OneTimeTrigger: [' + this.name + '] Depends on ' + this.dependencies[i].name + '.');
      }
    }

    aw.log.debug('aerieWorks.OneTimeTrigger: [' + this.name + '] Created.');
  }

  function execSoftEvaluate(me) {
    if ($.isFunction(me.softEvaluate)) {
      aw.log.debug('aerieWorks.OneTimeTrigger: [' + me.name + '] Soft evaluating.');
      me.state = State.Evaluating;
      me.softEvaluate.call(null, onEvaluateSuccess.bind(me), onSoftEvaluateFailure.bind(me));
    }
  }

  function execHardEvaluate(me) {
    aw.log.debug('aerieWorks.OneTimeTrigger: [' + me.name + '] Hard evaluating.');
    me.state = State.Evaluating;
    me.hardEvaluate.call(null, onEvaluateSuccess.bind(me), onHardEvaluateFailure.bind(me));
  }

  function hasDependencies(me) {
    return me.dependencies.length > 0;
  }

  function onDependencySuccess(dependency) {
    if (this.state === State.Failure) {
      // Already failed due to a different dependency.
      return;
    }

    aw.log.debug('aerieWorks.OneTimeTrigger: [' + this.name + '] Dependency ' + dependency.name + ' met.');
    var index = this.dependencies.indexOf(dependency);
    if (index >= 0) {
      this.dependencies.splice(index, 1);
    }

    if (!hasDependencies(this)) {
      if (this.state === State.Blocked) {
        execHardEvaluate(this);
      } else {
        execSoftEvaluate(this);
      }
    }
  }

  function onEvaluateSuccess() {
    aw.log.debug('aerieWorks.OneTimeTrigger: [' + this.name + '] Successful evaluation.');
    this.state = State.Success;
    this.onSuccess.trigger(this);
  }

  function onSoftEvaluateFailure() {
    aw.log.debug('aerieWorks.OneTimeTrigger: [' + this.name + '] Failed soft evaluation.');
    if (this.requiresEvaluation) {
      execHardEvaluate(this);
    } else {
      this.state = State.Unknown;
    }
  }

  function onHardEvaluateFailure() {
    aw.log.debug('aerieWorks.OneTimeTrigger: [' + this.name + '] Failed hard evaluation.');
    this.state = State.Failure;
    if (this.notifyOnFailure) {
      this.onFailure.trigger(this);
    }
  }

  function when(success, failure) {
    if (this.state === State.Success) {
      if ($.isFunction(success)) {
        setTimeout(success.bind(null, this), 0);
      }
      return;
    } else if (this.state === State.Failure) {
      if ($.isFunction(failure)) {
        setTimeout(failure.bind(null, this), 0);
      }
    }

    if ($.isFunction(success)) {
      this.onSuccess.addHandler({ method: success, once: true });
    }

    if (this.notifyOnFailure && $.isFunction(failure)) {
      this.onFailure.addHandler({ method: failure, once: true });
    }
  }

  function require(success, failure) {
    this.requiresEvaluation = true;
    this.when(success, failure);

    if (this.state === State.Unknown) {
      if (hasDependencies(this)) {
        aw.log.debug('aerieWorks.OneTimeTrigger: [' + this.name + '] Required, but has ' + this.dependencies.length + ' dependencies.');
        var successCallback = onDependencySuccess.bind(this);
        var failureCallback = onHardEvaluateFailure.bind(this);

        this.state = State.Blocked;
        for (var i = 0; i < this.dependencies.length; i++) {
          aw.log.debug('aerieWorks.OneTimeTrigger: [' + this.name + '] Requiring ' + this.dependencies[i].name + '.');
          this.dependencies[i].require(successCallback, failureCallback);
        }
      } else {
        aw.log.debug('aerieWorks.OneTimeTrigger: [' + this.name + '] Required, no dependencies.');
        execHardEvaluate(this);
      }
    }
  }

  aw.define('OneTimeTrigger', constructor, {
    require: require,
    when: when
  });
});
