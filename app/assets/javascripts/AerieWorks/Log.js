"use strict";
(function (AW) {
  var logLevelNames = [ 'DEBUG', 'INFO', 'WARN', 'ERROR' ];
  var LogLevel = {
    Debug: 0,
    Info: 1,
    Warn: 2,
    Error: 3
  };
  var loggingLevel = LogLevel.Debug;

  function log(level, message) {
    if (window.console != null && typeof window.console.log == 'function' && level <= loggingLevel) {
      if (typeof message !== 'string') {
        window.console.log(message);
      }

      var now = new Date();
      var fullMessage = [
        now.toString(),
        '[' + logLevelNames[level] + ']',
        message
      ];
      window.console.log(fullMessage.join(' '));
    }
  }

  AW.Log = {
    LogLevel: LogLevel,
    getLogLevel: function () {
      return loggingLevel;
    },
    setLogLevel: function (level) {
      loggingLevel = level;
    },
    debug: function (message) {
      log(LogLevel.Debug, message);
    },
    info: function (message) {
      log(LogLevel.Info, message);
    },
    warn: function (message) {
      log(LogLevel.Warn, message);
    },
    error: function (message) {
      log(LogLevel.Error, message);
    }
  };
})(window.AerieWorks);
