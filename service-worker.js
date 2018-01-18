const CACHE_NAME = 'carbonkey-cache-v11';
const urlsToCache = [
  '/',
  '/css/bootstrap.min.css',
  '/css/style.css',
  '/js/bitcoinjs-lib.js',
  '/js/bootstrap.min.js',
  '/js/jquery-3.2.1.slim.min.js',
  '/js/popper.min.js'
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

self.addEventListener('message', function(e) {
    const input = e.data;

    switch (input.cmd) {
        case 'init':
            init();
            break;
        case 'process':
            var result = process(input);
            e.ports[0].postMessage(result);
            break;
        default:
            console.log('Unknown command for worker.');
            break;
    }
});

function init() {
    console.log('Importing QR code files.');
    self.importScripts(
        'js/jsqrcode/grid.js',
        'js/jsqrcode/version.js',
        'js/jsqrcode/detector.js',
        'js/jsqrcode/formatinf.js',
        'js/jsqrcode/errorlevel.js',
        'js/jsqrcode/bitmat.js',
        'js/jsqrcode/datablock.js',
        'js/jsqrcode/bmparser.js',
        'js/jsqrcode/datamask.js',
        'js/jsqrcode/rsdecoder.js',
        'js/jsqrcode/gf256poly.js',
        'js/jsqrcode/gf256.js',
        'js/jsqrcode/decoder.js',
        'js/jsqrcode/qrcode.js',
        'js/jsqrcode/findpat.js',
        'js/jsqrcode/alignpat.js',
        'js/jsqrcode/databr.js'
    );
}

function process(input) {
    qrcode.width = input.width;
    qrcode.height = input.height;
    qrcode.imagedata = input.imageData;

    let result = { result: false, error: '' }
    try {
        result.result = qrcode.process();
        console.log(result.result);

    } catch (e) { 
      console.log(e);
      result.error = e 
    }


    return result;
}