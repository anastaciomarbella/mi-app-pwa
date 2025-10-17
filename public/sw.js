// public/sw.js
importScripts('https://unpkg.com/idb/build/iife/index-min.js');

const CACHE_NAME = 'mi-app-cache-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/favicon.ico',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // 🔹 Agrega aquí tus bundles reales de React/Vite
  '/src/main.js',
  '/src/styles.css'
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

// ---------- Sincronización ----------
async function syncTasks() {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const allTasks = await store.getAll();

  for (const task of allTasks) {
    try {
      // 🔹 Cambia esta URL por tu backend o endpoint Firestore
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
      await store.delete(task.id);
      console.log('✅ Tarea sincronizada:', task.id);
    } catch (err) {
      console.log('❌ Error sincronizando:', task.id, err);
    }
  }
  await tx.done;
}

// ---------- Install ----------
self.addEventListener('install', event => {
  console.log('[SW] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ---------- Activate ----------
self.addEventListener('activate', event => {
  console.log('[SW] Activando...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => key !== CACHE_NAME && caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ---------- Fetch ----------
self.addEventListener('fetch', event => {
  const req = event.request;

  // 1️⃣ App Shell → cache-first
  if (STATIC_ASSETS.includes(new URL(req.url).pathname)) {
    event.respondWith(caches.match(req).then(resp => resp || fetch(req)));
    return;
  }

  // 2️⃣ Imágenes → stale-while-revalidate
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

  // 3️⃣ API → network-first con fallback a IndexedDB
  if (req.url.includes('/api/')) {
    if (req.url.includes('/api/tasks')) {
      event.respondWith(
        fetch(req)
          .then(resp => {
            caches.open('api-cache').then(cache => cache.put(req, resp.clone()));
            return resp;
          })
          .catch(async () => {
            const db = await openDB();
            const tasks = await db.getAll(STORE_NAME);
            return new Response(JSON.stringify(tasks), {
              headers: { 'Content-Type': 'application/json' }
            });
          })
      );
      return;
    }

    event.respondWith(
      fetch(req)
        .then(resp => {
          caches.open('api-cache').then(cache => cache.put(req, resp.clone()));
          return resp;
        })
        .catch(() =>
          caches.match(req).then(resp =>
            resp || new Response(JSON.stringify({ error: 'Sin conexión y sin caché' }), {
              headers: { 'Content-Type': 'application/json' }
            })
          )
        )
    );
    return;
  }

  // 4️⃣ Páginas → fallback offline
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match('/offline.html')));
  }
});

// ---------- Background Sync ----------
self.addEventListener('sync', event => {
  if (event.tag === 'sync-entries') {
    console.log('[SW] Sincronización en segundo plano...');
    event.waitUntil(syncTasks());
  }
});

// ---------- Push Notifications ----------
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : { title: 'Notificación', body: 'Tienes un mensaje' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.png'
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      if (clientList.length > 0) return clientList[0].focus();
      return clients.openWindow('/');
    })
  );
});
