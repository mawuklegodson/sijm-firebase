// public/sw.js
// This is the FALLBACK service worker used by browsers that load manifest.json
// directly (e.g. some older Samsung Internet versions).
// vite-plugin-pwa generates a Workbox-powered SW at build time which supersedes
// this file in production — but we keep this for completeness.

const CACHE_NAME = 'sijm-cache-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/assets/logo.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  // Don't intercept Firebase or Paystack API calls
  const url = new URL(event.request.url);
  if (
    url.hostname.includes('firebaseapp.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('paystack.co')
  ) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      });
    })
  );
});
