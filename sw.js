// Bump this string on every deploy that must invalidate caches.
const CACHE = 'placebook-v26';

const PRECACHE = [
  '/placebook/',
  '/placebook/index.html',
  '/placebook/manifest.json',
];

self.addEventListener('install', e => {
  // Activate the new worker immediately instead of waiting for old tabs.
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).catch(() => {}));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-first so a fresh deploy is always picked up when online; fall back
// to cache only when offline. This is what stops the app getting "stuck" on
// an old cached build.
self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET') return;

  e.respondWith(
    fetch(request)
      .then(resp => {
        // Cache a copy of successful same-origin responses for offline use.
        if (resp && resp.status === 200 && request.url.startsWith(self.location.origin)) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(request, clone));
        }
        return resp;
      })
      .catch(() =>
        caches.match(request).then(cached => cached || caches.match('/placebook/index.html'))
      )
  );
});
