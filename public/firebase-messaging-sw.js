// ------------------------- Firebase -------------------------
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');
importScripts('https://unpkg.com/idb/build/iife/index-min.js');

// Config Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCnOsFkxZEdMXPu_DtEfI2Rexkq4Fsje2k",
  authDomain: "mi-awp.firebaseapp.com",
  projectId: "mi-awp",
  storageBucket: "mi-awp.firebasestorage.app",
  messagingSenderId: "580697464751",
  appId: "1:580697464751:web:06fc2a00db56b10661d95a",
  measurementId: "G-1SKW4SGEDN"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Notificaciones en background
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Notificación en background', payload);
  const notification = payload.notification || {};
  self.registration.showNotification(notification.title || 'Notificación', {
    body: notification.body || 'Tienes un mensaje',
    icon: '/icons/icon-192x192.png'
  });
});

// ------------------------- IndexedDB -------------------------
const DB_NAME = 'tasks-db';
const STORE_NAME = 'tasks';

async function openDB() {
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
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
      await store.delete(task.id);
      console.log('✅ Tarea sincronizada:', task.id);
    } catch (err) {
      console.log('❌ Error sincronizando:', task.id, err);
    }
  }
  await tx.done;
}

// ------------------------- Cache -------------------------
const CACHE_NAME = 'mi-app-cache-v7';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/favicon.ico',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  
];

// ------------------------- Eventos SW -------------------------
self.addEventListener('install', e =>
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  )
);

self.addEventListener('activate', e =>
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
);

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Cache First: App Shell
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(caches.match(req).then(cached => cached || fetch(req)));
    return;
  }

  // Stale While Revalidate: Imágenes
  if (req.destination === 'image') {
    event.respondWith(
      caches.match(req).then(cached => {
        const fetchPromise = fetch(req).then(res => {
          caches.open('img-cache').then(c => c.put(req, res.clone()));
          return res;
        });
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Network First: API
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req)
        .then(resp => {
          caches.open('api-cache').then(c => c.put(req, resp.clone()));
          return resp;
        })
        .catch(async () => {
          // fallback: IndexedDB si es /api/tasks
          if (url.pathname.startsWith('/api/tasks')) {
            const db = await openDB();
            const tasks = await db.getAll(STORE_NAME);
            return new Response(JSON.stringify(tasks), { headers: { 'Content-Type': 'application/json' } });
          }
          return caches.match(req);
        })
    );
    return;
  }

  // Navegación offline
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match('/offline.html')));
  }
});

// Background Sync
self.addEventListener('sync', e => {
  if (e.tag === 'sync-entries') e.waitUntil(syncTasks());
});

// Notification click
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(list => list.length ? list[0].focus() : clients.openWindow('/'))
  );
});

// Push API genérica
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  self.registration.showNotification(data.title || "Notificación", {
    body: data.body || "Tienes un mensaje nuevo",
    icon: "/icons/icon-192x192.png"
  });
});
