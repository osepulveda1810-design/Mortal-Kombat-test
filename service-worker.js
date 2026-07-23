// v1.40 CLEAN - Network first for critical files
const CACHE_NAME = 'subzero-v1-40-clean';
const CACHE_ASSETS = [
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(CACHE_ASSETS).catch(()=>{})));
});

self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('message', e=>{
  if(e.data && e.data.type==='SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e=>{
  const req = e.request;
  const url = new URL(req.url);
  
  // NEVER cache index.html, version.json, manifest.json - always network
  if(url.pathname.endsWith('/') || url.pathname.includes('index.html') || url.pathname.endsWith('version.json') || url.pathname.endsWith('manifest.json')){
    e.respondWith(
      fetch(req, {cache:'no-store', headers:{'Cache-Control':'no-cache'}})
        .then(res=>{
          if(res.ok){
            const clone=res.clone();
            caches.open(CACHE_NAME).then(c=>c.put(req, clone));
          }
          return res;
        })
        .catch(()=>caches.match(req).then(r=>r || fetch(req)))
    );
    return;
  }

  // For other assets, cache first
  e.respondWith(
    caches.match(req).then(cached=> cached || fetch(req).then(res=>{
      if(res.ok) caches.open(CACHE_NAME).then(c=>c.put(req, res.clone()));
      return res;
    }).catch(()=>cached))
  );
});
