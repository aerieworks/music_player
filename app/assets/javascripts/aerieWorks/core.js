'use strict';
(function ($) {
  var typeRequirers = {};

  var Namespace = (function () {
    function namespaceConstructor(parentNamespace, name) {
      this.parentNamespace = parentNamespace;
      this.name = name;

      if (this.parentNamespace) {
        this.fullName = this.parentNamespace.fullName + '.' + this.name;
      } else {
        this.fullName = this.name;
      }

      console.log('aerieWorks.Namespace: Created namespace ' + this.fullName);
    }

    namespaceConstructor.prototype = {
      createNamespace: function (name) {
        this[name] = new Namespace(this, name);
        return this[name];
      },

      define: function (typeName, definition, prototype) {
        if ($.isPlainObject(typeName)) {
          var typeMap = typeName;
          var typeNames = Object.keys(typeMap);
          for (var i = 0; i < typeNames.length; i++) {
            this.define(typeNames[i], typeMap[typeNames[i]]);
          }
          return;
        }

        if (this[typeName] != null) {
          throw 'Type "' + typeName + '" already defined in namespace ' + this.fullName + '.';
        }

        this[typeName] = definition;
        if (prototype != null) {
          this[typeName].prototype = prototype;
        }
        console.log('aerieWorks.Namespace: Defined type ' + this.fullName + '.' + typeName);

        var requirers = typeRequirers[this.fullName + '.' + typeName];
        if (requirers != null) {
          while (requirers.length > 0) {
            var req = requirers.shift();
            req.remaining -= 1;
            if (req.remaining == 0) {
              require(req.namespaceName, req.fn);
            }
          }
        }
      },

      isDefined: function (name) {
        return this.hasOwnProperty(name);
      }
    };

    return namespaceConstructor;
  })();

  var namespaceRegEx = /^[a-z][a-zA-Z0-9]*(?:\.[a-z][a-zA-Z0-9]*)*$/;
  function getNamespace(namespace, doNotCreate) {
    if (!namespaceRegEx.test(namespace)) {
      throw 'Invalid namespace name: "' + namespace + '".';
    }

    var current = window;
    var parts = namespace.split('.');
    var currentName = '';
    for (var i = 0; i < parts.length; i++) {
      if (current[parts[i]] == null) {
        if (doNotCreate) {
          return null;
        } else if (current instanceof Namespace) {
          current.createNamespace(parts[i]);
        } else {
          current[parts[i]] = new Namespace(null, parts[i]);
        }
      } else if (!(current[parts[i]] instanceof Namespace)) {
        throw parts.slice(0, i + 1).join('.') + ' exists, but is not a namespace.';
      }

      current = current[parts[i]];
    }

    return current;
  }

  function evaluateDefinitionRequirements(requiredDefinitions, namespaceName, fn) {
    var allMet = true;
    var requirer = {
      remaining: 0,
      namespaceName: namespaceName,
      fn: fn
    };

    for (var i = 0; i < requiredDefinitions.length; i++) {
      var dfn = requiredDefinitions[i];
      var nsEndIndex = dfn.lastIndexOf('.');
      var dfnNamespace = getNamespace(dfn.substring(0, nsEndIndex), true);
      if (dfnNamespace == null || !dfnNamespace.isDefined(dfn.substring(nsEndIndex + 1))) {
        console.log('Found pending dependency on ' + dfn + '.');
        requirer.remaining += 1;

        if (typeRequirers[dfn] == null) {
          typeRequirers[dfn] = [];
        }
        typeRequirers[dfn].push(requirer);
        allMet = false;
      }
    }

    return allMet;
  }

  function require(/* [namespaceName,][ requiredDefinitions,] fn */) {
    var params = Array.prototype.slice.call(arguments);
    var namespaceName = (params.length > 1 && typeof params[0] == 'string') ? params.shift() : null;
    var requiredDefinitions = params.length > 1 ? params.shift() : null;
    var fn = params.shift();

    if (requiredDefinitions == null || evaluateDefinitionRequirements(requiredDefinitions, namespaceName, fn)) {
      var namespace = namespaceName == null ? null : getNamespace(namespaceName);
      fn(window.aerieWorks, $, namespace);
    }
  }

  window.aerieWorks = new Namespace(null, 'aerieWorks');
  require('aerieWorks', function (aw) {
    aw.getNamespace = getNamespace;
    aw.require = require;
  });

  function getCodePointFromUtf8(bytes, offset) {
    var length;
    var byte1;
    var byte2;
    var byte3;
    var byte4;

    length = bytes.length;
    byte1 = bytes[offset];
    if ((byte1 & 0x80) == 0) {
      // Single-byte code sequence maps to simple code point.
      return { bytes: 1, codepoint: byte1 };
    }

    // Try two-byte code sequence.
    if (offset < length - 1) {
      byte2 = bytes[offset + 1];

      if ((byte1 & 0xe0) == 0xc0 && (byte2 & 0xc0) == 0x80) {
        // Valid two-byte sequence.
        return {
          bytes: 2,
          codepoint:
            ((byte1 & 0x1c) << 6) +
            ((byte1 & 0x03) << 6) + (byte2 & 0x3f)
        };
      }

      // Try three-byte code sequence.
      if (offset < length - 2) {
        byte3 = bytes[offset + 2];

        if ((byte1 & 0xf0) == 0xe0 && (byte2 & 0xc0) == 0x80 &&
          (byte3 & 0xc0) == 0x80) {
          // Valid three-byte sequence.
          return {
            bytes: 3,
            codepoint:
              ((byte1 & 0x0f) << 12) + ((byte2 & 0x3c) << 6) +
              ((byte2 & 0x03) << 6) + (byte3 & 0x3f)
          };
        }

        // Try four-byte code sequence.
        if (offset < length - 3) {
          byte4 = bytes[offset + 3];

          if ((byte1 & 0xf8) == 0xf0 && (byte2 & 0xc0) == 0x80 &&
            (byte3 & 0xc0) == 0x80 && (byte4 & 0xc0) == 0x80) {
            // Valid four-byte sequence.
            return {
              bytes: 4,
              codepoint:
                ((byte1 & 0x07) << 18) + ((byte2 & 0x30) << 12) +
                ((byte2 & 0x0f) << 12) + ((byte3 & 0x3c) << 6) +
                ((byte3 & 0x03) << 6) + (byte4 & 0x3c)
            };
          }
        }
      }
    }

    return { bytes: 1, codepoint: null };
  }

  String.fromCodePoints = function(codepoints) {
    var length = codepoints.length;
    var adjusted = [];
    var current;
    for (var i = 0; i < length; i++) {
      current = codepoints[i];
      if (current > 0xffff) {
        current -= 0x10000;
        adjusted.push(0xd800 + (current >> 10), 0xdc00 + (current & 0x3ff));
      } else {
        adjusted.push(current);
      }
    }

    return String.fromCharCode.apply(null, adjusted);
  }

  String.fromAscii = function(bytes, terminatable) {
    var length;
    if (terminatable) {
      length = bytes.length;
      for (var i = 0; i < length; i++) {
        if (bytes[i] == 0) {
          bytes.splice(i);
          break;
        }
      }
    }

    return String.fromCharCode.apply(null, bytes);
  };

  String.fromUtf16 = function (bytes) {
    var asciiBytes = [];
    for (var i = 2; i < bytes.length - 1; i += 2) {
      if (bytes[i + 1] == 0 && bytes[i] < 128) {
        asciiBytes.push(bytes[i]);
      } else {
        asciiBytes.push(63); // Use '?' for non-ASCII characters.
      }
    }

    return String.fromAscii(asciiBytes);
  }

  String.fromUtf8 = function(bytes, terminatable) {
    var codepoints = [];
    var index = 0;
    var length = bytes.length;
    var result;

    while (index < length) {
      result = getCodePointFromUtf8(bytes, index);
      index += result.bytes;
      if (result.codepoint !== null) {
        if (terminatable && result.codepoint == 0) {
          break;
        }
        codepoints.push(result.codepoint);
      }
    }

    return String.fromCodePoints(codepoints);
  };
})(window.jQuery);
