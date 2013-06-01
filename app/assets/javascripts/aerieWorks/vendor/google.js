"use strict";
window.aerieWorks.require('aerieWorks.vendor', [
   'aerieWorks.log',
   'aerieWorks.OneTimeTrigger'
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

  function execute(request, callback) {
    request.execute(function (response) {
      if (response.error) {
        if (response.error.code == 401) {
          var success = function () { execute(request, callback); };
          aw.log.info('Google.execute: Authorization expired, reauthorizing.');
          authorize(false, success, function () {
            authorize(true, success, function () {
              aw.log.error('Google.execute: reauthorization failed.');
            });
          });
        } else {
          aw.log.error('Google.execute: request execution error: ' + response.error.message);
        }
      } else {
        callback(response);
      }
    });
  }

  window.aerieWorks_vendor_google_onClientLoad = function () {
    aw.log.debug('Google: Client loaded.');
    isClientLoaded = true;
  };

  aw.vendor.define('google', {
    api: getApiTrigger,
    authorization: authorizationTrigger,
    execute: execute
  });
});
