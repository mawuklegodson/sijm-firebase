const CACHE_NAME = 'grace-center-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Network First strategy for the root and index.html
  if (event.request.mode === 'navigate' || event.request.url.endsWith('index.html') || event.request.url.endsWith('/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache First for other assets
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Background Sync for offline attendance submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-attendance') {
    event.waitUntil(syncPendingAttendance());
  }
});

async function syncPendingAttendance() {
  const pending = JSON.parse(localStorage.getItem('pending_sync') || '[]');
  for (const record of pending) {
    try {
      await fetch('/api/attendance', { method: 'POST', body: JSON.stringify(record) });
    } catch (e) {
      throw e; // Will retry
    }
  }
  localStorage.removeItem('pending_sync');
}
