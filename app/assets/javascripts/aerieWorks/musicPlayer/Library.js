'use strict';
window.aerieWorks.require('aerieWorks.musicPlayer', [
    'aerieWorks.log',
    'aerieWorks.OneTimeTrigger'
  ], function (aw) {
  var dbName = 'aerieWorks.musicPlayer.Library:library';
  var dbVersion = 1;
  var libraryDb = null;
  var items = {};

  var dbTrigger = new aw.OneTimeTrigger({
    name: 'aerieWorks.musicPlayer.Library:db.library',
    softEvaluate: openDatabase,
    hardEvaluate: openDatabase
  });

  function openDatabase(success, failure) {
    aw.log.debug('aerieWorks.musicPlayer.Library: Opening database: ' + dbName + ', version: ' + dbVersion);
    var request = indexedDB.open(dbName, dbVersion);
    request.onerror = failure;

    request.onsuccess = function (ev) {
      aw.log.debug('aerieWorks.musicPlayer.Library: Database ' + dbName + ' opened with version ' + dbVersion + '.');
      libraryDb = ev.target.result;
      success();
    };

    request.onupgradeneeded = function (ev) {
      var db = ev.target.result;
      ev.target.transaction.onerror = failure;

      aw.log.debug('aerieWorks.musicPlayer.Library: Database ' + dbName + ' is on version ' + db.oldVersion + ', must be upgraded to ' + dbVersion);
      if (db.oldVersion == null || db.oldVersion < 1) {
        db.createObjectStore('item', { autoIncrement: true });
      }
    }
  }

  function doQuery(storeNames, transactionMode, query) {
    if (typeof storeNames == 'string') {
      storeNames = [ storeNames ];
    }

    dbTrigger.require(function () {
      aw.log.debug('aerieWorks.musicPlayer.Library: Opening ' + transactionMode + ' transaction for query on the following stores: ' + storeNames.join(', '));
      var transaction = libraryDb.transaction(storeNames, transactionMode);

      var stores = {};
      for (var i = 0; i < storeNames.length; i++) {
        stores[storeNames[i]] = transaction.objectStore(storeNames[i]);
      }

      aw.log.debug('aerieWorks.musicPlayer.Library: Executing query.');
      query(stores);
    });
  }

  function doAdd(itemStore, item) {
    var request = itemStore.put(item);
    request.onsuccess = function (ev) {
      aw.log.debug('aerieWorks.musicPlayer.Library: Added item ' + ev.target.result + ': ' + JSON.stringify(item) + '.');
      items[ev.target.result] = item;
    }
  }

  aw.musicPlayer.define('Library', {
    add: function (itemOrItems) {
      var items = $.isArray(itemOrItems) ? itemOrItems : [ itemOrItems ];

      doQuery('item', 'readwrite', function (stores) {
        for (var i = 0; i < items.length; i++) {
          doAdd(stores.item, items[i]);
        }
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
      aw.log.debug('aerieWorks.musicPlayer.Library: Loading library items.');
      doQuery('item', 'readonly', function (stores) {
        aw.log.debug('aerieWorks.musicPlayer.Library: Starting library item load.');
        items = {};

        var keyRange = IDBKeyRange.lowerBound(0);
        var cursor = stores.item.openCursor(keyRange);
        cursor.onsuccess = function (ev) {
          var result = ev.target.result;
          if (!!result == false) {
            aw.log.debug('aerieWorks.musicPlayer.Library: Library item load complete: ' + Object.keys(items).length + ' items loaded.');
            setTimeout(callback.bind(null, items), 0);
            return;
          }

          items[result.key] = result.value;
          aw.log.debug('aerieWorks.musicPlayer.Library: Loaded item ' + result.key + ': ' + JSON.stringify(result.value) + '.');
          result.continue();
        };
      });
    }
  });
});
