/**
 * iCALLOG Creative AI & 3D WebGL Gateway - Service Worker
 * Precaches critical application shell assets and enables
 * offline fallback via Stale-While-Revalidate and Cache-First strategies.
 */

const CACHE_VERSION = 'icallog-pwa-v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

// Critical application shell assets to precache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Syne:wght@600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap',
];

// Installation: Precache critical static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        return Promise.allSettled(
          PRECACHE_ASSETS.map((url) =>
            fetch(url, { cache: 'reload' })
              .then((res) => {
                if (res.ok) return cache.put(url, res);
              })
              .catch((err) => console.warn('[SW] Could not precache asset:', url, err))
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activation: Clean up stale legacy caches and claim active clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== STATIC_CACHE && name !== RUNTIME_CACHE)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch: Strategy depending on request type
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (cannot be cached in CacheStorage)
  if (request.method !== 'GET') {
    return;
  }

  // Handle API Requests (/api/*)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        // Return offline synthetic JSON response so app does not crash
        return new Response(
          JSON.stringify({
            offline: true,
            cached: true,
            message: 'You are currently offline. IndexedDB state and local cache are active.',
            timestamp: Date.now(),
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'X-iCALLOG-Offline-Fallback': 'true',
            },
          }
        );
      })
    );
    return;
  }

  // Handle SPA Navigation requests (HTML)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache fresh copy of HTML
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          // If network is offline, serve cached /index.html or /
          return caches.match('/index.html').then((cached) => {
            return cached || caches.match('/');
          });
        })
    );
    return;
  }

  // Handle Static Assets (JS, CSS, SVGs, Fonts, Images)
  // Stale-While-Revalidate strategy
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Return null if network fails; cachedResponse will be returned
          return null;
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// Listen for messages from client (e.g. skip waiting, cache diagnostics)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
