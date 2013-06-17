'use strict';
window.aerieWorks.require('aerieWorks.musicPlayer', [
    'aerieWorks.OneTimeTrigger'
  ], function (aw) {
  var dbName = 'aerieWorks.musicPlayer.Library:library';
  var dbVersion = 2;
  var libraryDb = null;
  var items = {};
  var dbTrigger = null;

  aw.require([ 'aerieWorks.musicPlayer.Library' ], function () {
    dbTrigger = aw.OneTimeTrigger.create({
      name: 'aerieWorks.musicPlayer.Library:db.library',
      softEvaluate: openDatabase,
      hardEvaluate: openDatabase
    });
  });

  function openDatabase(success, failure) {
    aw.musicPlayer.Library.debug('Opening database: ' + dbName + ', version: ' + dbVersion);
    var request = indexedDB.open(dbName, dbVersion);
    request.onerror = failure;

    request.onsuccess = function (ev) {
      aw.musicPlayer.Library.debug('Database ' + dbName + ' opened with version ' + dbVersion + '.');
      libraryDb = ev.target.result;
      success();
    };

    request.onupgradeneeded = function databaseUpgradeNeeded(ev) {
      var db = ev.target.result;
      var oldVersion = db.oldVersion == null ? 0 : db.oldVersion;
      var trans = ev.target.transaction;
      ev.target.transaction.onerror = failure;

      aw.musicPlayer.Library.debug('Database ' + dbName + ' is on version ' + oldVersion + ', must be upgraded to ' + dbVersion);
      if (oldVersion < 1) {
        db.createObjectStore('item', { autoIncrement: true });
      }
      if (oldVersion < 2) {
        aw.musicPlayer.Library.debug('Adding source.remoteId index.');
        var itemStore = trans.objectStore('item');
        itemStore.createIndex('remoteId', 'source.remoteId');
      }
    }
  }

  function doQuery(library, transactionMode, storeNames, query) {
    if (typeof storeNames == 'string') {
      storeNames = [ storeNames ];
    }

    library.debug('Opening ' + transactionMode + ' transaction for query on the following stores: ' + storeNames.join(', '));
    var transaction = libraryDb.transaction(storeNames, transactionMode);

    var stores = {};
    for (var i = 0; i < storeNames.length; i++) {
      stores[storeNames[i]] = transaction.objectStore(storeNames[i]);
    }

    library.debug('Executing query.');
    query.call(library, transaction, stores);
  }

  function getItemSource(item) {
    var remoteId = item.getSourceFileId();
    if (remoteId == null) {
      return null;
    }

    return {
      type: item.getType().getFullName(),
      remoteId: remoteId
    };
  }

  function serializeItem(item) {
    return {
      artist: item.getArtist(),
      album: item.getAlbum(),
      source: getItemSource(item),
      title: item.getTitle(),
      url: item.getUrl()
    };
  }

  function doAdd(library, tx, itemStore, item, success, failure) {
    var itemContent = serializeItem(item);
    var failureCallback = failure == null ? null : failure.bind(null, { library: library, item: item });

    var request = itemStore.put(itemContent);
    request.onerror = failureCallback;

    request.onsuccess = function (ev) {
      library.debug('Added item ' + ev.target.result + ': ' + JSON.stringify(itemContent));

      if (failureCallback) {
        tx.addEventListener('abort', failureCallback);
        tx.addEventListener('error', failureCallback);
      }

      tx.addEventListener('complete', function () {
        library.debug('Transaction complete, item ' + ev.target.result + ' committed.');
        items[ev.target.result] = item;
        item.onFileChanged.addHandler(function () { library.update(ev.target.result, item); });
        if (success) {
          success.call(null, { library: library, key: ev.target.result, item: item });
        }
      });
    };
  }

  function doUpdate(library, tx, itemStore, key, item, success, failure) {
    var itemContent = serializeItem(item);
    var failureCallback = failure == null ? null : failure.bind(null, { library: library, key: key, item: item });

    var request = itemStore.put(itemContent, key);
    request.onerror = failureCallback;

    request.onsuccess = function (ev) {
      library.debug('Updated item ' + ev.target.result + ': ' + key + ': ' + JSON.stringify(itemContent));

      if (failureCallback) {
        tx.addEventListener('abort', failureCallback);
        tx.addEventListener('error', failureCallback);
      }

      tx.addEventListener('complete', function () {
        library.debug('Transaction complete, item ' + ev.target.result + ' updated.');
        items[key] = item;
        if (success) {
          success.call(null, { library: library, key: key, item: item });
        }
      });
    };
  }

  aw.Type.create({
    name: 'Library',
    namespace: aw.musicPlayer,
    initializer: function (onReadyCallback) {
      var callback = onReadyCallback == null ? null : onReadyCallback.bind(null, { library: this });
      dbTrigger.require(callback);
    },

    members: {
      add: function (itemOrItems, success, failure) {
        var items = $.isArray(itemOrItems) ? itemOrItems : [ itemOrItems ];
        doQuery(this, 'readwrite', 'item', function (tx, stores) {
          var remoteIdIndex = stores.item.index('remoteId');

          var library = this;
          for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var itemSource = getItemSource(item);
            if (itemSource == null) {
              this.debug('Item has no source, cannot add it to library: ' + item.getDisplayName());
              continue;
            }

            var range = IDBKeyRange.only(itemSource.remoteId);
            stores.item.index('remoteId').openCursor(range).onsuccess = function (ev) {
              var cursor = ev.target.result;
              if (cursor) {
                if (cursor.value.source.type == itemSource.type) {
                  item.onFileChanged.addHandler(function () { library.update(cursor.key, item); });
                } else {
                  cursor.continue();
                }
              } else {
                doAdd(library, tx, stores.item, item, success, failure);
              }
            }
          }
        });
      },

      update: function (key, item, success, failure) {
        var me = this;
        doQuery(this, 'readwrite', 'item', function (tx, stores) {
          doUpdate(me, tx, stores.item, key, item, success, failure);
        });
      },

      each: function (fn) {
        var keys = Object.keys(items);
        var keyCount = keys.length;
        for (var i = 0; i < keyCount; i++) {
          fn({ key: keys[i], item: items[keys[i]] });
        }
      },

      load: function (callback) {
        this.debug('Loading library items.');
        var me = this;
        doQuery(this, 'readonly', 'item', function (tx, stores) {
          me.debug('Starting library item load.');
          items = {};

          var keyRange = IDBKeyRange.lowerBound(0);
          var cursor = stores.item.openCursor(keyRange);
          cursor.onsuccess = function (ev) {
            var result = ev.target.result;
            if (!!result == false) {
              me.debug('Library item load complete: ' + Object.keys(items).length + ' items loaded.');
              setTimeout(callback.bind(null, items), 0);
              return;
            }

            items[result.key] = result.value;
            me.debug('Loaded item ' + result.key + ': ' + JSON.stringify(result.value) + '.');
            result.continue();
          };
        });
      }
    }
  });
});
