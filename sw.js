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

/* Bump this version string whenever an ICON or the manifest changes.
   index.html no longer depends on it — see the fetch handler below. */
var CACHE = 'qroll-launcher-v4';
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

// Is this request for the launcher page itself (rather than an icon)?
function isPage_(request, url) {
  return request.mode === 'navigate' ||
         url.pathname === '/' ||
         /\/(index\.html)?$/.test(url.pathname);
}

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);

  // Only ever serve our own launcher files from cache. Anything pointing at
  // script.google.com (or anywhere else) goes straight to the network.
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Never let the worker cache itself — that makes future updates stickier
  // than they already are.
  if (url.pathname.indexOf('sw.js') >= 0) return;

  /* THE PAGE: network first.
   *
   * The previous version served index.html cache-first, which meant an
   * installed phone kept showing an old launcher until somebody remembered to
   * bump the cache name. Forgetting that once is enough to convince a teacher
   * the update never arrived, so the page no longer depends on anyone
   * remembering: with signal it is always fetched fresh and the copy in the
   * cache is refreshed behind it; with no signal the cached copy is served, so
   * the launcher still opens on a dead network. */
  if (isPage_(e.request, url)) {
    e.respondWith(
      fetch(e.request).then(function (res) {
        if (res && res.ok && !url.search) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put('./index.html', copy); });
        }
        return res;
      }).catch(function () {
        return caches.match('./index.html', { ignoreSearch: true });
      })
    );
    return;
  }

  /* ICONS AND MANIFEST: cache first — they are large, they change rarely, and
   * the home-screen icon should appear instantly.
   *
   * ignoreSearch matters: colleagues arrive at index.html?u=<their app>, which
   * must still hit the cached shell rather than miss and pile up one cache
   * entry per teacher. */
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
      return hit || fetch(e.request).then(function (res) {
        if (res && res.ok && !url.search) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      });
    })
  );
});
