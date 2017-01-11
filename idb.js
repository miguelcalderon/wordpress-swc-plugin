/* Adapted from https://github.com/jakearchibald/svgomg/blob/master/src/js/utils/indexeddouchbag.js */
'use strict';

function promisifyRequest(obj) {
  return new Promise(function(resolve, reject) {
    function onsuccess(event) {
      resolve(obj.result);
      unlisten();
    }
    function onerror(event) {
      reject(obj.error);
      unlisten();
    }
    function unlisten() {
      obj.removeEventListener('complete', onsuccess);
      obj.removeEventListener('success', onsuccess);
      obj.removeEventListener('error', onerror);
      obj.removeEventListener('abort', onerror);
    }
    obj.addEventListener('complete', onsuccess);
    obj.addEventListener('success', onsuccess);
    obj.addEventListener('error', onerror);
    obj.addEventListener('abort', onerror);
  });
}

function Idb(name, version, upgradeCallback) {
  var request = indexedDB.open(name, version);
  request.onupgradeneeded = function(event) {
    upgradeCallback(request.result, event.oldVersion);
  };
  var payload = {
    ready: promisifyRequest(request),
    transaction: function (stores, modeOrCallback, callback) {
      return payload.ready.then(function(db) {
        var mode = 'readonly';
        if (modeOrCallback.apply) {
          callback = modeOrCallback;
        } else {
          if (modeOrCallback) {
            mode = modeOrCallback;
          }
        }
        var tx = db.transaction(stores, mode),
          val = callback(tx, db),
          promise = promisifyRequest(tx),
          readPromise;
        if (!val) {
          return promise;
        }
        readPromise = val[0] && 'result' in val[0] ? Promise.all(val.map(promisifyRequest)) :  promisifyRequest(val);
        return promise.then(function() {
          return readPromise;
        });
      });
    },
    get: function (store, key) {
      return payload.transaction(store, function(tx) {
        return tx.objectStore(store).get(key);
      });
    },
    put: function (store, key, value) {
      return payload.transaction(store, 'readwrite', function(tx) {
        tx.objectStore(store).put(value, key);
      });
    },
    delete: function (store, key) {
      return payload.transaction(store, 'readwrite', function(tx) {
        tx.objectStore(store).delete(key);
      });
    }
  };
}