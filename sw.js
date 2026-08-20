const CACHE='za-chem-final-v10-fast-open';
const ASSETS=[
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './data1.js',
  './data2.js',
  './data3.js',
  './extras.js',
  './notes.js',
  './app.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(keys =>
        Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))
      )
    ])
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 已缓存资源立即返回，同时后台静默检查更新。
  // 这样第二次及以后打开 App 不再等待 GitHub 网络。
  event.respondWith(
    caches.match(req).then(cached => {
      const networkUpdate = fetch(req)
        .then(resp => {
          if (resp && resp.ok) {
            const copy = resp.clone();
            event.waitUntil(
              caches.open(CACHE).then(cache => cache.put(req, copy))
            );
          }
          return resp;
        })
        .catch(() => null);

      if (cached) {
        return cached;
      }

      return networkUpdate.then(resp => {
        if (resp) return resp;
        if (req.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      });
    })
  );
});
