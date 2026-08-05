/* QRoll launcher service worker.
 *
 * Its only real job is to make Chrome treat this page as an installable app
 * rather than a plain bookmark — that is what gets the QRoll icon onto the
 * home screen instead of a generic glyph or a page screenshot.
 *
 * It caches the launcher shell (page, manifest, icons) so the splash opens
 * instantly and still works with no signal. It deliberately does NOT touch the
 * Apps Script app: attendance must never be served from a stale cache.
 */

/* Bump this version string EVERY time you change index.html, manifest.json or
   an icon. The shell is served cache-first, so an installed phone keeps showing
   the old page until the cache name changes — a new name makes this worker
   install fresh and delete the previous cache on activate. */
var CACHE = 'qroll-launcher-v5';
var SHELL = [
  './',
  './index.html',
  './manifest.json',
  './qroll-icon-192.png',
  './qroll-icon-512.png',
  './qroll-icon-maskable-192.png',
  './qroll-icon-maskable-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);

  // Only ever serve our own launcher files from cache. Anything pointing at
  // script.google.com (or anywhere else) goes straight to the network.
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // ignoreSearch matters: colleagues arrive at index.html?u=<their app>, which
  // must still hit the cached shell rather than miss and pile up one cache
  // entry per teacher.
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
      return hit || fetch(e.request).then(function (res) {
        // Only ever cache the canonical, query-free URL.
        if (res && res.ok && !url.search) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function () {
        return caches.match('./index.html');
      });
    })
  );
});
