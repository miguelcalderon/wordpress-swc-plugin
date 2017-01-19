'use strict';
const defaultConfig = {
  cache_images: "no",
  cache_css: "no",
  cache_js: "no",
  cache_other: "no"
};
var webConfig;
function queryVar(name, url) {
  if (!url) {
    url = self.location.href;
  }
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function getConfig() {
  return new Promise(function (resolve, reject) {
    var query = self.location.search;
    if (query) {
      var ajaxFormData = new FormData();
      ajaxFormData.append('action', 'getsettings');
      ajaxFormData.append('_ajax_nonce', queryVar('nonce'));
      fetch(decodeURIComponent(queryVar('settings'), query), { method: 'POST', body: ajaxFormData }).then(function(response) {
        if (response.ok) {
          return response.json().then(responseJSON => resolve(responseJSON));
        } else {
          return reject(response.statusText);
        }
      }).catch(function(error) {
        reject(error);
      });
    } else {
      reject('No settings retrieval URL available.');
    }
  });
}

self.importScripts(queryVar('plugin_url') + '/idb.js');

var swdb;
function idb() {
  if (!swdb) {
    swdb = new Idb('mc-swc', 1, function(db) {
      db.createObjectStore('settings');
    });
  }
  return swdb;
}

var CACHE_IMAGES = 'cache_images',
    CACHE_CSS = 'cache_css',
    CACHE_JS = 'cache_js',
    CACHE_OTHER = 'cache_other';
//console.log('I\'m a service worker!');
self.addEventListener('install', event => {
  //console.log('Install stuff');
  function onInstall () {
    return new Promise(function (resolve, reject) {
      getConfig().then(idbConfig => {
        return idb().put('settings', 'config', idbConfig);
      }).then(() => {
        webConfig = idb().get('settings', 'config');
        if (webConfig === undefined) {
          webConfig = defaultConfig;
          idb().put('settings', 'config', webConfig);
        }
        return resolve();
      }).catch(err => reject(err));
    });
    //return caches.open(CACHE_NAME).then(cache => cache.addAll(['/']));
  }
  event.waitUntil(onInstall(event)
    .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  //console.log('Activate stuff');
  function onActivate (event) {
    return caches.keys()
      .then(cacheKeys => {
        var deletePromises = cacheKeys.map(oldKey => caches.delete(oldKey));
        return Promise.all(deletePromises);
      });
  }
  getConfig().then(idbConfig => {
    return idb().put('settings', 'config', idbConfig);
  }).then(function () {
    webConfig = idb().get('settings', 'config');
    if (webConfig === undefined) {
      webConfig = defaultConfig;
      idb().put('settings', 'config', webConfig);
    }
  });
  event.waitUntil(
    onActivate(event)
      .then(() => self.clients.claim())
  );
});
var supportedTypes = {
  'image/png': 'cache_images',
  'image/jpeg': 'cache_images',
  'image/webp': 'cache_images',
  'image/gif': 'cache_images',
  'image/svg': 'cache_images',
  'text/css': 'cache_css',
  'application/javascript': 'cache_js'
};
function getFileTypeFromAcceptHeader (accepted) {
  var acceptedTypes = accepted.split(';');
  for (var i = 0, n = acceptedTypes.length; i < n; i++) {
    var acceptedType = acceptedTypes[i].split(',');
    for (var j = 0, k = acceptedType.length; j < k; j++) {
      if (acceptedType[i].indexOf('/') !== -1) {
        if (supportedTypes[acceptedType[i].trim()]) {
          return supportedTypes[acceptedType[i].trim()];
        }
      }
    }
  }
  return 'cache_other';
}
self.addEventListener('fetch', function(event) {
  var fileTypeCache = 'cache_other';
  for (let entry of event.request.headers.entries()) {
    if (entry[0].toLowerCase() === 'accept') {
      fileTypeCache = getFileTypeFromAcceptHeader(entry[1]);
      break;
    }
  }
  if (event.request.url.indexOf('/wp-admin') !== -1 || event.request.url.indexOf('preview=true') !== -1 ) {
    return;
  }
  if (webConfig[fileTypeCache] !== 'yes') {
    return;
  }
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        var fetchRequest = event.request.clone();
        return fetch(fetchRequest).then(
          function(response) {
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            var responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(function(cache) {
                //console.log(event.request);
                if (event.request.method === 'GET') {
                  cache.put(event.request, responseToCache);
                }
              });
            return response;
          }
        );
      })
  );
  //console.log('Fetch stuff');
});