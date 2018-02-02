const CACHE_NAME = 'kobbly-kelly';
const urlsToCache = [
  '.',
  'css/bootstrap.min.css',
  'css/style.css',
  'js/bitcoinjs-lib.js',
  'js/bootstrap.min.js',
  'js/jquery-3.2.1.slim.min.js',
  'js/localforage.js',
  'js/popper.min.js',
  'qrcode-web-worker.js',
  'img/qr-phone.png',
  'img/drawable-xhdpi-icon.png',
  'img/drawable-xxhdpi-icon.png',
  'img/drawable-xxxhdpi-icon.png',
  'img/qr-bg.jpg',
];

// Listen for the install event, which fires when the service worker is installing
self.addEventListener('install', event => {
  // Ensures the install event doesn't complete until after the cache promise resolves
  // This is so we don't move on to other events until the critical initial cache is done
  event.waitUntil(
    // Open a named cache, then add all the specified URLs to it
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// Listen for the activate event, which is fired after installation
// Activate is when the service worker actually takes over from the previous
// version, which is a good time to clean up old caches
self.addEventListener('activate', event => {
  console.log('Finally active. Ready to serve!');
  event.waitUntil(
    // Get the keys of all the old caches
    caches
      .keys()
      // Ensure we don't resolve until all the promises do (i.e. each key has been deleted)
      .then(keys =>
        Promise.all(
          keys
            // Remove any cache that matches the current cache name
            .filter(key => key !== CACHE_NAME)
            // Map over the array of old cache names and delete them all
            .map(key => caches.delete(key))
        )
      )
  );
});

// Listen for browser fetch events. These fire any time the browser tries to load
// any outside resources
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});
