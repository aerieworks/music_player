'use strict';
(function ($) {
  var typeRequirers = {};
  var AwObject;
  var Type;

  (function () {
    function inherit(o) {
      function F() {}
      F.prototype = o;
      return new F();
    }

    function initializeInstance(type, instance, args) {
      instance.type = type;

      var initializers = [];
      var current = type;
      do {
        if ($.isFunction(current.initializer)) {
          initializers.push(current.initializer);
        }
        current = current.baseType;
      } while (current != null);

      while (initializers.length > 0) {
        initializers.pop().apply(instance, args);
      }
    }

    var awObjectMembers = {
      getType: function () {
        return this.type;
      }
    };

    var typeMembers = $.extend(inherit(awObjectMembers), {
      create: function () {
        var instance = inherit(this.members);
        initializeInstance(this, instance, arguments);
        return instance;
      },

      getBaseType: function () {
        return this.baseType;
      },

      getFullName: function () {
        return this.namespace == null ? this.name : (this.namespace.fullName + '.' + this.name);
      },

      getNamespace: function () {
        return this.namespace;
      },

      isSuperTypeOf: function (o) {
        if (o == null || !$.isFunction(o.getType)) {
          return false;
        }

        var oType = o.getType();
        do {
          if (this === oType) {
            return true;
          }

          oType = oType.getBaseType();
        } while (oType != null);

        return false;
      },

      require: function (/* [dependencies,][ fn] */) {
        var params = Array.prototype.slice.call(arguments);
        var fn = params.pop();
        var dependencies = params.pop();
        var requirer = {
          remaining: 0,
          fn: fn
        };

        if (dependencies != null) {
          for (var i = 0; i < dependencies.length; i++) {
            var dep = dependencies[i];
            var nsEndIndex = dep.lastIndexOf('.');
            var depNamespace = Namespace.get(dep.substring(0, nsEndIndex), true);
            if (depNamespace == null || !depNamespace.isDefined(dep.substring(nsEndIndex + 1))) {
              console.log('Found pending dependency on ' + dep + '.');
              requirer.remaining += 1;

              if (typeRequirers[dep] == null) {
                typeRequirers[dep] = [];
              }
              typeRequirers[dep].push(requirer);
            }
          }
        }

        if (requirer.remaining == 0) {
          requirer.fn(window.aerieWorks, $);
        }
      }
    });

    Type = inherit(typeMembers);
    Type.initializer = function (args) {
      this.initializer = args.initializer || null;
      this.namespace = args.namespace || null;
      this.name = args.name;
      this.baseType = args.baseType || AwObject;
      this.members = this.baseType ? $.extend(inherit(this.baseType.members), args.members) : args.members;
      $.extend(this, args.statics);
    };
    initializeInstance(Type, Type, [{
      initializer: Type.initializer,
      members: typeMembers,
      name: 'Type'
    }]);

    AwObject = Type.create({
      members: awObjectMembers,
      name: 'AwObject'
    });

    Type.baseType = AwObject;
  })();

  var Namespace = (function () {
    var namespaceRegEx = /^[a-z][a-zA-Z0-9]*$/;

    return Type.create({
      name: 'Namespace',

      initializer: function (/* [parentNamespace,] name */) {
        var params = Array.prototype.slice.call(arguments);
        this.name = params.pop();
        this.parentNamespace = params.pop();

        if (!namespaceRegEx.test(this.name)) {
          throw 'Invalid namespace name: "' + this.name + '".';
        }

        if (this.parentNamespace) {
          this.parentNamespace[this.name] = this;
          this.fullName = this.parentNamespace.getFullName() + '.' + this.name;
        } else {
          window[this.name] = this;
          this.fullName = this.name;
        }

        console.log('aerieWorks.Namespace: Created namespace ' + this.getFullName());
      },

      members: {
        createNamespace: function (name) {
          return Namespace.create(this, name);
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
            throw 'Type "' + typeName + '" already defined in namespace ' + this.getFullName() + '.';
          }

          this[typeName] = definition;
          if (prototype != null) {
            this[typeName].prototype = prototype;
          }
          definition.typeName = this.getFullName() + '.' + typeName;
          console.log('aerieWorks.Namespace: Defined type ' + definition.typeName);

          var requirers = typeRequirers[definition.typeName];
          if (requirers != null) {
            while (requirers.length > 0) {
              var req = requirers.shift();
              req.remaining -= 1;
              if (req.remaining == 0) {
                Type.require(req.fn);
              }
            }
          }
        },

        getFullName: function () {
          return this.fullName;
        },

        getParent: function () {
          return this.parentNamespace;
        },

        isDefined: function (name) {
          return this.hasOwnProperty(name);
        }
      },

      statics: {
        get: function (namespace, doNotCreate) {
          var current = window;
          var parts = namespace.split('.');
          var currentName = '';
          for (var i = 0; i < parts.length; i++) {
            if (current[parts[i]] == null) {
              if (doNotCreate) {
                return null;
              } else if (current == window) {
                current[parts[i]] = Namespace.create(parts[i]);
              } else {
                current.createNamespace(parts[i]);
              }
            } else if (!Namespace.isSuperTypeOf(current[parts[i]])) {
              throw parts.slice(0, i + 1).join('.') + ' exists, but is not a namespace.';
            }

            current = current[parts[i]];
          }

          return current;
        },

        require: function (/* [namespaceName,][ dependencies,] fn */) {
          var params = Array.prototype.slice.call(arguments);
          var namespace = (params.length > 1 && typeof params[0] == 'string') ? Namespace.get(params.shift()) : null;
          var dependencies = params.length > 1 ? params.shift() : null;
          var fn = params.shift();
          Type.require(dependencies, function (aw, $) {
            fn(aw, $, namespace);
          });
        }
      }
    });
  })();

  Namespace.require('aerieWorks', function (aw) {
    aw.AwObject = AwObject;
    aw.AwObject.namespace = aw;
    aw.Type = Type;
    aw.Type.namespace = aw;
    aw.Namespace = Namespace;
    aw.Namespace.namespace = aw;

    aw.require = function () {
      aw.Namespace.require.apply(Namespace, arguments);
    };
  });

  (function () {
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

    String.fromCodePoints = function (codepoints) {
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

    String.fromAscii = function (bytes, terminatable) {
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

    String.fromUtf8 = function (bytes, terminatable) {
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
  })();
})(window.jQuery);
