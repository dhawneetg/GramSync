// GramSync Offline-First Field Engine Service Worker (PWA Cache)
const CACHE_NAME = 'gramsync-cache-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/flow.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[GramSync ServiceWorker] Pre-caching offline clinical workspace assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[GramSync ServiceWorker] Removing old cache version:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GET requests
  if (req.method !== 'GET') return;

  // Stale-While-Revalidate or Cache-First for offline clinical operations
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh copy in background if network is available
        fetch(req).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, networkResponse);
            });
          }
        }).catch(() => {
          // Network offline - silence error, cached copy already delivered
        });
        return cachedResponse;
      }

      // If not in cache, fetch from network and cache it
      return fetch(req).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(req, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Fallback to offline index.html if navigating
        if (req.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
