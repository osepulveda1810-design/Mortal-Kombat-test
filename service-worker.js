// Service Worker - Sub-Zero Adventure
// Sube este archivo a la RAÍZ del repo (mismo nivel que index.html) como "service-worker.js"

const CACHE_VERSION = 'subzero-v1.18';
const CACHE_NAME = `subzero-adventure-${CACHE_VERSION}`;

// Todo lo necesario para que el juego cargue y funcione sin conexión.
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',

  // Sprites del personaje
  './idle_subzero.png',
  './walk_subzero.png',
  './jump_subzero.png',
  './kick_subzero.png',
  './kick_subzero2.png',
  './kick_air.png',
  './punch_subzero.png',
  './punch_subzero2.png',
  './punch_air.png',

  // Sprites de hielo
  './subzero_ice_charge.png',
  './subzero_ice1.png',
  './subzero_ice2.png',
  './ice.png',

  // Íconos PWA
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png'
];

// ─── INSTALACIÓN: precachear todo lo de arriba ───
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// ─── ACTIVACIÓN: borrar cachés de versiones viejas ───
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name.startsWith('subzero-adventure-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── FETCH: network-first para index.html, cache-first para el resto ───
self.addEventListener('fetch', (event) => {
  // Solo manejamos peticiones GET del mismo origen
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const url = new URL(event.request.url);
  
  // Para index.html: network-first (siempre trae la última versión)
  if (url.pathname.endsWith('/index.html') || url.pathname === '/' || url.pathname === '') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Para el resto de assets: stale-while-revalidate (rápido, actualiza en segundo plano)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkFetch = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkFetch;
    })
  );
});
