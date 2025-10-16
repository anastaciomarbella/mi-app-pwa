const CACHE_NAME = 'mi-app-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

// Intercepta las solicitudes
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(resp => resp || fetch(event.request))
  );
});
