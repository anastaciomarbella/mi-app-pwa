importScripts('https://unpkg.com/idb/build/iife/index-min.js');

const CACHE_NAME = 'mi-app-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// ---------- IndexedDB ----------
const DB_NAME = 'tasks-db';
const STORE_NAME = 'tasks';

// Abrir IndexedDB
function openDB() {
  return idb.openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    }
  });
}

// Sincronizar tareas con servidor
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

// ---------- Install / Activate / Fetch ----------
self.addEventListener('install', event => {
  console.log('[SW] Instalando Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] Activando Service Worker...');
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Eliminando cache antiguo:', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => {
      return resp || fetch(event.request)
        .catch(() => {
          // Fallback si no hay conexión
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
        });
    })
  );
});

// ---------- Background Sync ----------
self.addEventListener('sync', event => {
  if (event.tag === 'sync-entries') {
    event.waitUntil(syncTasks());
  }
});
