"use strict";
(function (AW) {
  var isClientLoaded = false;
  var clientTrigger = new AW.OneTimeTrigger({
    name: 'AW.Google.client',
    hardEvaluate: function(success) {
      if (isClientLoaded) {
        AW.Log.debug('Google: Client required and loaded.');
        success.call(null);
      } else {
        AW.Log.debug('Google: Client required, but not loaded yet.');
        window.AerieWorks_Google_onClientLoad = success;
      }
    }
  });

  var authorizationTrigger = new AW.OneTimeTrigger({
    name: 'AW.Google.authorization',
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
    AW.Log.debug('Google.authorize: Checking authorization (' + (required ? 'hard' : 'soft') + ').');
    gapi.auth.authorize({
        client_id: CLIENT_ID,
        scope: SCOPES,
        immediate: !required
      },
      function (authResult) {
        AW.Log.debug('Google.authorize: Returned from API.');
        AW.Log.debug(authResult);
        if (authResult && !authResult.error) {
          AW.Log.debug('Google.authorize: Authorized.');
          success.call();
        } else {
          AW.Log.debug('Google.authorize: Not authorized (' + (required ? 'soft' : 'hard') + ').');
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
      trigger = new AW.OneTimeTrigger({
        name: 'AW.Google.client.' + api + '.' + version,
        dependencies: [ clientTrigger ],
        hardEvaluate: function (success) {
          AW.Log.debug('Google.api: Loading "' + api + '" version "' + version + '".');
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
          AW.Log.info('Google.execute: Authorization expired, reauthorizing.');
          authorize(false, success, function () {
            authorize(true, success, function () {
              AW.Log.error('Google.execute: reauthorization failed.');
            });
          });
        } else {
          AW.Log.error('Google.execute: request execution error: ' + response.error.message);
        }
      } else {
        callback(response);
      }
    });
  }

  window.AerieWorks_Google_onClientLoad = function () {
    AW.Log.debug('Google: Client loaded.');
    isClientLoaded = true;
  };

  AW.Google = {
    api: getApiTrigger,
    authorization: authorizationTrigger,
    execute: execute
  };
})(window.AerieWorks);
