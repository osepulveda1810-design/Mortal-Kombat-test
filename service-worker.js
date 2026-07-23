// Sub-Zero v1.39 - FIX CACHE - Network first for HTML/JSON
const CACHE_NAME = 'subzero-v1-39-fix-cache-intro';
const CACHE_ASSETS = [
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', e=>{
  console.log('SW v1.39 installing');
  e.waitUntil(
    caches.open(CACHE_NAME).then(c=>c.addAll(CACHE_ASSETS).catch(()=>{})).then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate', e=>{
  console.log('SW v1.39 activating');
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(
      keys.filter(k=>k!==CACHE_NAME).map(k=>{
        console.log('Deleting old cache',k);
        return caches.delete(k);
      })
    )).then(()=>self.clients.claim())
  );
});

self.addEventListener('message', e=>{
  if(e.data && e.data.type==='SKIP_WAITING'){
    self.skipWaiting();
  }
});

self.addEventListener('fetch', e=>{
  const url = new URL(e.request.url);
  
  // NETWORK FIRST for these critical files - nunca cachear viejo
  if(url.pathname.endsWith('index.html') || url.pathname.endsWith('/') || url.pathname.endsWith('version.json') || url.pathname.endsWith('manifest.json')){
    e.respondWith(
      fetch(e.request, {cache:'no-store'})
        .then(res=>{
          // Guardar copia fresca
          const clone=res.clone();
          caches.open(CACHE_NAME).then(c=>c.put(e.request, clone));
          return res;
        })
        .catch(()=>caches.match(e.request).then(cached=>cached || caches.match('./index.html')))
    );
    return;
  }

  // Cache first for assets, but update in background
  e.respondWith(
    caches.match(e.request).then(cached=>{
      const fetchPromise=fetch(e.request).then(networkRes=>{
        if(networkRes.ok){
          caches.open(CACHE_NAME).then(c=>c.put(e.request, networkRes.clone()));
        }
        return networkRes;
      }).catch(()=>cached);
      
      return cached || fetchPromise;
    })
  );
});
