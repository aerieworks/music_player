'use strict';
window.aerieWorks.require('aerieWorks.vendor.google', [
   'aerieWorks.log',
   'aerieWorks.OneTimeTrigger',
   'aerieWorks.net.getNetIoRequestQueue'
  ], function (aw) {
  var isClientLoaded = false;
  var clientTrigger = new aw.OneTimeTrigger({
    name: 'aw.google.client',
    hardEvaluate: function(success) {
      if (isClientLoaded) {
        aw.log.debug('Google: Client required and loaded.');
        success.call(null);
      } else {
        aw.log.debug('Google: Client required, but not loaded yet.');
        window.aerieWorks_vendor_google_onClientLoad = success;
      }
    }
  });

  var authorizationTrigger = new aw.OneTimeTrigger({
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
    aw.log.debug('Google.authorize: Checking authorization (' + (required ? 'hard' : 'soft') + ').');
    gapi.auth.authorize({
        client_id: CLIENT_ID,
        scope: SCOPES,
        immediate: !required
      },
      function (authResult) {
        aw.log.debug('Google.authorize: Returned from API.');
        aw.log.debug(authResult);
        if (authResult && !authResult.error) {
          aw.log.debug('Google.authorize: Authorized.');
          success.call();
        } else {
          aw.log.debug('Google.authorize: Not authorized (' + (required ? 'soft' : 'hard') + ').');
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
      trigger = new aw.OneTimeTrigger({
        name: 'aw.google.client.' + api + '.' + version,
        dependencies: [ clientTrigger ],
        hardEvaluate: function (success) {
          aw.log.debug('Google.api: Loading "' + api + '" version "' + version + '".');
          gapi.client.load(api, version, success);
        }
      });

      apiTriggers[api][version] = trigger;
    }

    return trigger;
  }

  function doExecute(googleRequest, successCallback, failureCallback) {
    aw.log.debug('Google.Client.execute: Queued request started.');
    googleRequest.execute(function (response) {
      if (response.error) {
        if (response.error.code == 401) {
          var reauthSuccess = function () { doExecute(googleRequest, successCallback, failureCallback); };
          aw.log.info('Google.Client.execute: Authorization expired, reauthorizing.');
          authorize(false, reauthSuccess, function () {
            authorize(true, reauthSuccess, function () {
              aw.log.error('Google.Client.execute: reauthorization failed.');
              failureCallback();
            });
          });
        } else {
          aw.log.error('Google.Client.execute: request execution error: ' + response.error.message);
          failureCallback();
        }
      } else {
        successCallback(response);
      }
    });
  }

  function execute(request, callback) {
    aw.net.getNetIoRequestQueue().enqueue({
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
    aw.net.getNetIoRequestQueue().enqueue({
      method: doExecuteXhr.bind(this, args),
      success: args.success,
      failure: args.failure
    });
  }

  window.aerieWorks_vendor_google_onClientLoad = function () {
    aw.log.debug('Google: Client loaded.');
    isClientLoaded = true;
  };

  aw.vendor.google.define('Client', {
    api: getApiTrigger,
    authorization: authorizationTrigger,
    execute: execute,
    executeXhr: executeXhr
  });
});
