"use strict";
(function (aw) {
  // The minimum byte length of an ID3 tag:
  //  10 byte tag header
  //   6 byte frame header
  //   1 byte frame body
  var ID3_minimumTagByteLength = 17;

  // The minimum byte length of a frame, including header:
  //  10 byte frame header
  //   1 byte frame body
  var ID3_minimumFrameLength = 11;

  var frameReaders;

  function log(message) {
    aw.log.debug('aw.musicPlayer.metadata.ID3v2Reader.' + message);
  }

  // Constructor
  function ID3v2Reader() {
    this.majorVersion = null;
    this.minorVersion = null;
    this.version = null;

    this.unsync = null;
    this.hasExtendedHeader = null;
    this.experimental = null;
    this.hasFooter = null;

    this.size = null;

    this.extendedHeaderSize = null;
    this.hasCRC = null;
    this.crc = null;
    this.paddingSize = null;

    this.frames = {};
  }

  // Private methods
  function hasBit(byte, bit) {
    return byte & (1 << bit) > 0;
  }

  function readSyncsafeInt(buffer, start) {
    var value = 0;
    for (var i = 0; i < 4; i++) {
      var current = buffer[start + i];
      if (current >= 0x80) {
        abortRead('Invalid syncsafe integer encountered.');
      }
      value = (value << 7) + current;
    }
  }

  function abortRead(id3, reason) {
    log('Aborting reading tag: ' + reason);
    throw { message: 'Aborting reading tag: ' + reason };
  }

  function readHeader(id3, reader) {
    var flagsByte;
    var readBytes;

    // Abort if the file doesn't start with the ASCII string "ID3".
    if ('ID3' != String.fromAscii(reader.readBytes(3))) {
      abortRead(id3, 'No tag header found.');
    }

    // Read version information.  Abort on invalid verion.
    id3.majorVersion = reader.readByte();
    id3.minorVersion = reader.readByte();
    id3.version = '2.' + id3.majorVersion + id3.minorVersion;
    if (id3.majorVersion == 0xff || id3.minorVersion == 0xff) {
      abortRead(id3, 'Invalid version found: "' + id3.version + '".');
    }

    // Read tag flags.
    flagsByte = reader.readByte();
    id3.unsync = hasBit(flagsByte, 7);
    id3.hasExtendedHeader = hasBit(flagsByte, 6);
    id3.experimental = hasBit(flagsByte, 5);

    if (id3.majorVersion == 4) {
      id3.hasFooter = hasBit(flagsByte, 4);
    }

    id3.size = reader.readSyncsafeInt();
    id3.fullSize = id3.size + (id3.hasFooter ? 20 : 10);

    log('readHeader: v' + id3.version +
      (id3.unsync ? ' unsynchronized' : '') +
      (id3.hasExtendedHeader ? ' extended_header' : '') +
      (id3.experimental ? ' experimental' : '') +
      (id3.hasFooter ? ' footer' : '') +
      ' ' + id3.size + ' bytes');
  }

  function readExtendedHeader(id3, reader) {
    if (id3.majorVersion == 3) {
      return readExtendedHeader_v23(id3, reader);
    } else if (id3.majorVersion == 4) {
      return readExtendedHeader_v24(id3, reader);
    }
  }

  function readExtendedHeader_v23(id3, reader) {
    id3.extendedHeaderSize = reader.readUint32();
    id3.hasCRC = hasBit(reader.readByte(), 7);
    id3.paddingSize = reader.readUint32();

    if (id3.hasCRC) {
      id3.crc = reader.readUint32();
    }
  }

  function readExtendedHeader_v24(id3, reader) {
    var flags;
    var restrictions;
    var stringLengthLimit;

    id3.extendedHeaderSize = reader.readSyncsafeInt();
    id3.numberOfFlagBytes = reader.readByte();

    flags = reader.readByte();
    id3.isUpdate = hasBit(flags, 6);
    if (id3.isUpdate) {
      // Discard the "Update" flag's data length.  It will always be 0.
      reader.readByte();
    }

    id3.hasCRC = hasBit(flags, 5);
    if (id3.hasCRC) {
      // Discard the "CRC" flag's data length.  It will always be 5.
      reader.readByte();
      id3.crc = reader.readSyncsafeInt(5);
    }

    id3.hasRestrictions = hasBit(flags, 4);
    if (id3.hasRestrictions) {
      // Discard the "Tag Restrictions" flag data length.  It will always be 1.
      reader.readByte();
      restrictions = reader.readByte();
      id3.sizeRestriction = restrictions >> 6;
      id3.restrictStringEncodings = hasBit(restrictions, 5);

      stringLengthLimit = (restrictions & 0x18) >> 4;
      if (stringLengthLimit == 1) {
        id3.maxStringLength = 1024;
      } else if (stringLengthLimit == 2) {
        id3.maxStringLength = 128;
      } else if (stringLengthLimit == 3) {
        id3.maxStringLength = 30;
      }

      id3.restrictImageEncodings = hasBit(restrictions, 2);
      id3.imageSizeLimit = (restrictions & 0x03);
    }
  }

  function readFrames(id3, reader) {
    var frame;

    // Read frames until we don't have any more room in the frame space.
    while (ID3_minimumFrameLength < reader.getRemainingBytes()) {
      frame = {
        id: String.fromAscii(reader.readBytes(4))
      };

      // If the frame ID starts with a null, then we've hit padding.
      if (frame.id.charCodeAt(0) == 0) {
        break;
      }
      readFrameHeader(id3, frame, reader);
      log('readFrames: Reading frame "' + frame.id + '" (' + frame.size + ' bytes)');
      readFrameBody(id3, frame, reader);
      log('Frame: ' + JSON.stringify(frame));
      id3.frames[frame.id] = frame;
    }
  }

  function readFrameHeader(id3, frame, reader) {
    var flags;

    if (id3.majorVersion == 3) {
      frame.size = reader.readUint32();
    } else if (id3.majorVersion == 4) {
      frame.size = reader.readSyncsafeInt();
    }

    flags = reader.readBytes(2);
    if (id3.majorVersion == 3) {
      // Read 2.3 flags.
      frame.discardOnTagAlteration = hasBit(flags[0], 7);
      frame.discardOnFileAlteration = hasBit(flags[0], 6);
      frame.isReadOnly = hasBit(flags[0], 5);

      frame.isCompressed = hasBit(flags[1], 7);
      if (frame.isCompressed) {
        frame.unpackedLength = reader.readUint32();
      }

      if (hasBit(flags[1], 6)) {
        frame.encryptionMethod = reader.readByte();
      }

      if (hasBit(flags[1], 5)) {
        frame.groupID = reader.readByte();
      }

      frame.hasDataLengthIndicator = false;
    } else {
      // read 2.4 flags.
      frame.discardOnTagAlteration = hasBit(flags[0], 6);
      frame.discardOnFileAlteration = hasBit(flags[0], 5);
      frame.isReadOnly = hasBit(flags[0], 4);

      if (hasBit(flags[1], 6)) {
        frame.groupID = reader.readByte();
      }

      frame.isCompressed = hasBit(flags[1], 3);

      if (hasBit(flags[1], 2)) {
        frame.encryptionMethod = reader.readByte();
      }

      frame.unsync = hasBit(flags[1], 1);

      if (hasBit(flags[1], 0)) {
        frame.unpackedLength = reader.readSyncsafeInt();
      }
    }
  }

  function readFrameBody(id3, frame, reader) {
    if (frame.id.charAt(0) == 'T' && frame.id != 'TXXX') {
      readTextFrameBody(id3, frame, reader);
    } else if (frame.id.charAt(0) == 'W' && frame.id != 'WXXX') {
      readURLFrameBody(id3, frame, reader);
    } else if (frameReaders[frame.id] != null) {
      frameReaders[frame.id](id3, frame, reader);
    } else {
      reader.readBytes(frame.size);
    }
  }

  function readTextFrameBody(id3, frame, reader) {
    frame.encoding = reader.readByte();

    // Read string from frame size - 1 bytes (-1 for the encoding).
    frame.value = readEncodedString(reader.readBytes(frame.size - 1), frame.encoding);
  }

  function readURLFrameBody(id3, frame, reader) {
    frame.url = readEncodedString(reader.readBytes(frame.size));
  }

  function readEncodedString(bytes, encoding) {
    if (encoding === null || encoding == 0) {
      // ASCII or ISO-8859-1 (for now...)
      return String.fromAscii(bytes);
    } else if (encoding == 1) {
      // UTF-16
      return String.fromUtf16(bytes);
    } else if (encoding == 3) {
      // UTF-8
      return String.fromUtf8(bytes);
    }
  }

  function readMultipartText(frame, partNames, reader, byteLength) {
    var doubleNull = frame.encoding == 1 || frame.encoding == 2;
    var bytes = reader.readBytes(byteLength);

    for (var i = 0; i < byteLength; i++) {
      if ((doubleNull && bytes[i] == 0) ||
        (doubleNull && i < length - 1 && bytes[i] == 0 && bytes[i + 1] == 0)) {
        frame[partNames[0]] = readEncodedString(bytes.splice(0, i), frame.encoding);
        partNames.unshift();
        if (partNames.length == 0) {
          break;
        }
        bytes.splice(0, doubleNull ? 1 : 2);
      }
    }

    if (partNames.length > 0 && bytes.length > 0) {
      frame[partNames[0]] = readEncodedString(bytes, frame.encoding);
    }
  }

  // Public methods
  function read(buffer) {
    var headerView;
    var bodyView;
    var bodyReader;

    if (buffer.length < ID3_minimumTagByteLength) {
       abortRead(this, 'The file is too small to contain an ID3 tag.');
    }

    headerView = new Uint8Array(buffer, 0, 10);
    readHeader(this, new aw.io.ForwardReader(headerView));

    if (this.size > buffer.byteLength) {
      aw.log.info('aw.musicPlayer.metadata.Id3v2Reader.read: Buffer is too small, aborting read.  Tag size: ' + this.size + '; Buffer size: ' + buffer.byteLength);
      return false;
    }

    bodyView = new Uint8Array(buffer, 10, this.size);
    bodyReader = new aw.io.ForwardReader(bodyView);
    if (this.hasExtendedHeader) {
      readExtendedHeader(this, bodyReader);
    }
    readFrames(this, bodyReader);

    return true;
  }

  frameReaders = {
    'TXXX': function(id3, frame, reader) {
      frame.encoding = reader.readByte();
      readMultipartText(frame, [ 'description', 'value' ], reader, frame.size - 1);
    },

    'WXXX': function(id3, frame, reader) {
      frame.encoding = reader.readByte();
      readMultipartText(frame, [ 'description', 'url' ], reader, frame.size - 1);
    }
  };

  ID3v2Reader.prototype = {
    read: read
  };

  aw.musicPlayer.metadata.Id3v2Reader = ID3v2Reader;
})(window.aerieWorks);
