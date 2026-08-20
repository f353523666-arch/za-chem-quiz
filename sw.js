const CACHE='za-chem-final-v9-audit-fix';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon.svg','./data1.js','./data2.js','./data3.js','./extras.js','./notes.js','./app.js'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil(Promise.all([
    self.clients.claim(),
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
  ]));
});

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  e.respondWith(
    fetch(e.request).then(r=>{
      const copy=r.clone();
      if(r.ok && new URL(e.request.url).origin===self.location.origin){
        caches.open(CACHE).then(c=>c.put(e.request,copy));
      }
      return r;
    }).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html')))
  );
});
