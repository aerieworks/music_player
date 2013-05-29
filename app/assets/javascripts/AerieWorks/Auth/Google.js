"use strict";
(function (AW, $) {
  var AuthState = AW.Auth.State;

  var CLIENT_ID = '235366474804.apps.googleusercontent.com';
  var SCOPES = 'https://www.googleapis.com/auth/drive';

  var authorizationState = AuthState.Unknown;
  var requiresAuthorization = false;
  var onAuthorized = new AW.Event();
  var onUnauthorized = new AW.Event();

  function authorize(required) {
    requiresAuthorization |= required;

    if (isAuthorized()) {
      onAuthorized.trigger();
      return;
    } else if (isUnauthorized()) {
      onUnauthorized.trigger();
      return;
    } else if (authorizationState === AuthState.Authorizing) {
      return;
    }

    authorizationState = AuthState.Authorizing;

    gapi.auth.authorize({
        client_id: CLIENT_ID,
        scope: SCOPES,
        immediate: !required
      },
      function (authResult) {
        AW.Log.debug("Google.authorze: Returned from API.");
        AW.Log.debug(authResult);
        if (authResult && !authResult.error) {
          authorizationState = AuthState.Authorized;
          AW.Log.debug("Google.authorize: Authorized.");
          onAuthorized.trigger();
        } else if (required) {
          authorizationState = AuthState.Unauthorized;
          AW.Log.debug("Google.authorize: Interactive authorization failed.");
          onUnauthorized.trigger();
        } else {
          AW.Log.debug("Google.authorize: Immediate authorization failed.");
          if (requiresAuthorization) {
            AW.Log.debug("Google.authorize: Attempting interactive authorization.");
            authorize(true);
          } else {
            authorizationState = AuthState.Unknown;
          }
        }
      }
    );
  }

  function checkAuthorization() {
    authorize(false);
  }

  function isAuthorized() {
    return authorizationState === AuthState.Authorized;
  }

  function isUnauthorized() {
    return authorizationState === AuthState.Unauthorized;
  }

  function requestAuthorization(success, failure) {
    if ($.isFunction(success)) {
      onAuthorized.addHandler({ method: success, once: true });
    }

    if ($.isFunction(failure)) {
      onUnauthorized.addHandler({ method: failure, once: true });
    }

    authorize(true);
  }

  window.AerieWorks_Auth_Google_onClientLoad = function () {
    setTimeout(checkAuthorization, 1);
  };

  AW.Auth.Google = {
    isAuthorized: isAuthorized,
    isUnauthorized: isUnauthorized,
    requestAuthorization: requestAuthorization
  };
})(window.AerieWorks, window.jQuery);
