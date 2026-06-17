const CACHE = 'placebook-v1';
const PRECACHE = [
  '/placebook/',
  '/placebook/index.html',
  '/placebook/css/main.css',
  '/placebook/js/storage.js',
  '/placebook/js/themes.js',
  '/placebook/js/utils.js',
  '/placebook/js/modal.js',
  '/placebook/js/map.js',
  '/placebook/js/location.js',
  '/placebook/js/timeline.js',
  '/placebook/js/food.js',
  '/placebook/js/passport.js',
  '/placebook/js/app.js',
  '/placebook/manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const { request } = e;
  // Let Leaflet CDN and Google Fonts go through network-first
  if (request.url.includes('unpkg.com') || request.url.includes('fonts.g')) {
    e.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }
  // Cache-first for everything else
  e.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(resp => {
      if (resp && resp.status === 200) {
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(request, clone));
      }
      return resp;
    }))
  );
});
