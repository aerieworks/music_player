'use strict';
window.aerieWorks.require('aerieWorks.vendor.google', [
   'aerieWorks.OneTimeTrigger',
   'aerieWorks.util.RequestQueueFactory'
  ], function (aw) {
  var isClientLoaded = false;
  var clientTrigger = aw.OneTimeTrigger.create({
    name: 'aw.google.client',
    hardEvaluate: function(success) {
      if (isClientLoaded) {
        aw.vendor.google.Client.debug('Client required and loaded.');
        success.call(null);
      } else {
        aw.vendor.google.Client.debug('Client required, but not loaded yet.');
        window.aerieWorks_vendor_google_onClientLoad = success;
      }
    }
  });

  var authorizationTrigger = aw.OneTimeTrigger.create({
    name: 'aw.google.authorization',
    dependencies: [ clientTrigger ],
    softEvaluate: function (success, failure) {
      authorize(false, success, failure);
    },
    hardEvaluate: function (success, failure) {
      authorize(true, success, failure);
    }
  });

  var CLIENT_ID = '235366474804.apps.googleusercontent.com';
  var SCOPES = 'https://www.googleapis.com/auth/drive';

  var apiTriggers = {};

  function authorize(required, success, failure) {
    aw.vendor.google.Client.debug('Checking authorization (' + (required ? 'hard' : 'soft') + ').');
    gapi.auth.authorize({
        client_id: CLIENT_ID,
        scope: SCOPES,
        immediate: !required
      },
      function (authResult) {
        aw.vendor.google.Client.debug('Returned from API.');
        aw.vendor.google.Client.debug(authResult);
        if (authResult && !authResult.error) {
          aw.vendor.google.Client.debug('Authorized.');
          success.call();
        } else {
          aw.vendor.google.Client.debug('Not authorized (' + (required ? 'soft' : 'hard') + ').');
          failure.call();
        }
      }
    );
  }

  function getApiTrigger(api, version) {
    if (apiTriggers[api] == null) {
      apiTriggers[api] = {};
    }

    var trigger = apiTriggers[api][version];
    if (trigger == null) {
      trigger = aw.OneTimeTrigger.create({
        name: 'aw.google.client.' + api + '.' + version,
        dependencies: [ clientTrigger ],
        hardEvaluate: function (success) {
          aw.vendor.google.Client.debug('Loading "' + api + '" version "' + version + '".');
          gapi.client.load(api, version, success);
        }
      });

      apiTriggers[api][version] = trigger;
    }

    return trigger;
  }

  function doExecute(googleRequest, successCallback, failureCallback) {
    aw.vendor.google.Client.debug('Queued request started.');
    googleRequest.execute(function (response) {
      if (response.error) {
        if (response.error.code == 401) {
          var reauthSuccess = function () { doExecute(googleRequest, successCallback, failureCallback); };
          aw.vendor.google.Client.info('Authorization expired, reauthorizing.');
          authorize(false, reauthSuccess, function () {
            authorize(true, reauthSuccess, function () {
              aw.vendor.google.Client.error('reauthorization failed.');
              failureCallback();
            });
          });
        } else {
          aw.vendor.google.Client.error('request execution error: ' + response.error.message);
          failureCallback();
        }
      } else {
        successCallback(response);
      }
    });
  }

  function execute(request, callback) {
    aw.util.RequestQueueFactory.getNetRequestQueue().enqueue({
      method: doExecute.bind(this, request),
      success: callback
    });
  }

  function doExecuteXhr(args, successCallback, failureCallback) {
    var xhr = new XMLHttpRequest();
    xhr.open(args.method, args.url, true);
    xhr.responseType = args.responseType;

    var token = gapi.auth.getToken().access_token;
    xhr.setRequestHeader('Authorization', 'Bearer ' + token);

    var headerNames = Object.keys(args.headers);
    for (var i = 0; i < headerNames.length; i++) {
      xhr.setRequestHeader(headerNames[i], args.headers[headerNames[i]]);
    }

    xhr.onload = function () {
      successCallback(xhr.response);
    };
    xhr.send(null);
  }

  function executeXhr(args) {
    aw.util.RequestQueueFactory.getNetRequestQueue().enqueue({
      method: doExecuteXhr.bind(this, args),
      success: args.success,
      failure: args.failure
    });
  }

  window.aerieWorks_vendor_google_onClientLoad = function () {
    isClientLoaded = true;
  };

  aw.Type.create({
    name: 'Client',
    namespace: aw.vendor.google,
    statics: {
      api: getApiTrigger,
      authorization: authorizationTrigger,
      execute: execute,
      executeXhr: executeXhr
    }
  });
});
