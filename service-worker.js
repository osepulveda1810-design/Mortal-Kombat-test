const CACHE_NAME = 'subzero-v1-43-buttons-fix';
self.addEventListener('install', e=>{ self.skipWaiting(); });
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e=>{
  if(e.request.url.includes('index.html') || e.request.url.endsWith('/') || e.request.url.includes('version.json') || e.request.url.includes('manifest.json')){
    e.respondWith(fetch(e.request, {cache:'no-store'}).catch(()=>caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then(r=>r || fetch(e.request)));
});
