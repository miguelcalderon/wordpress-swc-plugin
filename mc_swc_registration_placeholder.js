'use strict';
console.log('Registering service worker.');
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/serviceWorker.js?settings=' + encodeURIComponent(mc_service_worker_cache.ajax_url) + '&nonce=' + mc_service_worker_cache.nonce + '&plugin_url=' + encodeURIComponent(mc_service_worker_cache.plugin_url), {
    scope: '/'
  }).then(function(reg) {
    // registration worked
    console.log('Registration succeeded. Scope is ' + reg.scope);
  }).catch(function(error) {
    // registration failed
    console.log('Registration failed with ' + error);
  });
}
