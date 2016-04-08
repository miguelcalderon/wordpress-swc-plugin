var config = {
  staticCacheItems: [
    '/'
  ]
};
var CACHE_NAME = 'static';
//console.log('I\'m a service worker!');
self.addEventListener('install', event => {
  //console.log('Install stuff');
  function onInstall () {
    return caches.open(CACHE_NAME)
        .then(cache => cache.addAll([
        '/'
      ])
  );
}
event.waitUntil(
  onInstall(event, config)
    .then( () => self.skipWaiting() )
  );
});

self.addEventListener('activate', event => {
  //console.log('Activate stuff');
  function onActivate (event, opts) {
    return caches.keys()
      .then(cacheKeys => {
        var oldCacheKeys = cacheKeys.filter(key =>
          key.indexOf(opts.version) !== 0
        );
        var deletePromises = oldCacheKeys.map(oldKey => caches.delete(oldKey));
        return Promise.all(deletePromises);
      });
  }
  event.waitUntil(
    onActivate(event, config)
      .then( () => self.clients.claim() )
  );
});

self.addEventListener('fetch', function(event) {
  if (event.request.url.match(/wp-admin/) || event.request.url.match(/preview=true/)) {
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