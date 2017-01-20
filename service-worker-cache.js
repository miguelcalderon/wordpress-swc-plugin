'use strict';
const defaultConfig = {
  cache_images: "no",
  cache_css: "no",
  cache_js: "no",
  cache_other: "no"
};
var webConfig = {};
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
  'image/*': 'cache_images',
  'text/css': 'cache_css',
  'application/javascript': 'cache_js',
  'application/x-javascript': 'cache_js',
  'text/javascript': 'cache_js',
  'text/html': 'cache_other',
  'application/xhtml+xml': 'cache_other',
  'application/xml': 'cache_other'
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
        break;
      }
    }
  }
  return 'cache_other';
}
function getFileTypeFromAcceptHeader (accepted) {
  var acceptedTypes = accepted.split(';');
  for (var i = 0, n = acceptedTypes.length; i < n; i++) {
    var acceptedType = acceptedTypes[i].split(',');
    for (var j = 0, k = acceptedType.length; j < k; j++) {
      if (acceptedType[i].indexOf('/') !== -1) {
        if (supportedTypes[acceptedType[i].trim()]) {
          return supportedTypes[acceptedType[i].trim()];
        }
        break;
      }
    }
  }
  return 'cache_other';
}
function getFileTypeFromURLExtension (url) {
  var URLExtension = function(url) {
    return url.split('.').pop().split(/\#|\?/)[0];
  };
  switch (URLExtension(url).toLowerCase()) {
    case 'jpeg':
    case 'jpg':
    case 'webp':
    case 'gif':
    case 'png':
      return 'cache_images';
      break;
    case 'css':
      return 'cache_css';
      break;
    case 'js':
      return 'cache_js';
      break;
    default:
      return 'cache_other';
      break;
  }
}
self.addEventListener('fetch', function(event) {
  if (event.request.url.indexOf('/wp-admin') !== -1 || event.request.url.indexOf('preview=true') !== -1 ) {
    return;
  }
  var requestCache = 'cache_none';
  for (let entry of event.request.headers.entries()) {
    if (entry[0].toLowerCase() === 'accept') {
      requestCache = getFileTypeFromAcceptHeader(entry[1]);
      break;
    }
  }
  requestCache = requestCache === 'cache_none' ? getFileTypeFromURLExtension(event.request.url) : requestCache;
  if (webConfig[requestCache] !== 'yes') {
    return;
  }
  if (event.request.url === '/') {
    getConfig().then(idbConfig => {
      return idb().put('settings', 'config', idbConfig);
    }).then(() => {
      webConfig = idb().get('settings', 'config');
      if (webConfig === undefined) {
        webConfig = defaultConfig;
        idb().put('settings', 'config', webConfig);
      }
    });
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
            caches.open(requestCache)
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