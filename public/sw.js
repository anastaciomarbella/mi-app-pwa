importScripts('https://unpkg.com/idb/build/iife/index-min.js');

const CACHE_NAME = 'mi-app-cache-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',      // 👉 Página offline personalizada
  '/favicon.ico',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// ---------- IndexedDB ----------
const DB_NAME = 'tasks-db';
const STORE_NAME = 'tasks';

function openDB() {
  return idb.openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    }
  });
}

async function syncTasks() {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const allTasks = await store.getAll();

  for (const task of allTasks) {
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });

      if (response.ok) {
        await store.delete(task.id);
        console.log('✅ Tarea sincronizada:', task.id);
      }
    } catch (err) {
      console.log('❌ Error sincronizando:', task.id, err);
    }
  }

  await tx.done;
}

// ---------- Install / Activate ----------
self.addEventListener('install', event => {
  console.log('[SW] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] Activando...');
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Borrando cache viejo:', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// ---------- Estrategias de cache ----------
self.addEventListener('fetch', event => {
  const req = event.request;

  // 1. App Shell → cache-first
  if (STATIC_ASSETS.includes(new URL(req.url).pathname)) {
    event.respondWith(
      caches.match(req).then(resp => resp || fetch(req))
    );
    return;
  }

  // 2. Imágenes → stale-while-revalidate
  if (req.destination === 'image') {
    event.respondWith(
      caches.open('images-cache').then(async cache => {
        try {
          const fresh = await fetch(req);
          cache.put(req, fresh.clone());
          return fresh;
        } catch {
          return cache.match(req);
        }
      })
    );
    return;
  }

  // 3. API → network-first
  if (req.url.includes('/api/')) {
    event.respondWith(
      fetch(req)
        .then(resp => {
          const clone = resp.clone();
          caches.open('api-cache').then(cache => cache.put(req, clone));
          return resp;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // 4. Fallback para páginas offline
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/offline.html'))
    );
  }
});

// ---------- Background Sync ----------
self.addEventListener('sync', event => {
  if (event.tag === 'sync-entries') {
    console.log('[SW] Sincronización en segundo plano...');
    event.waitUntil(syncTasks());
  }
});
