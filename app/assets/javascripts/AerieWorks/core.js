"use strict";
(function () {
  window.AerieWorks = {
    File: {}
  };

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
})();
