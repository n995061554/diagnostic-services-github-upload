/**
 * Diagnostic Services — Privacy-Preserving Service Worker
 * 
 * Rules:
 * 1. Cache-first / Stale-while-revalidate ONLY for public static UI assets (fonts, logo, shell).
 * 2. STRICTLY NETWORK-ONLY for /api/ endpoints to prevent caching sensitive clinical,
 *    customer, employee, or financial data.
 * 3. Never cache private visit photographs or authenticated credentials.
 */

const CACHE_NAME = 'a2z-pwa-static-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/assets/logo.jpeg',
  '/logo.jpeg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Strict Security Guard: Never intercept or cache API requests or WebSocket traffic
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. Strict Dev Guard: Never cache Vite dev modules, HMR, or TypeScript source files
  if (
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/') ||
    url.search.includes('t=') ||
    url.search.includes('import')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 3. Strict Security Guard: Never cache private uploads
  if (url.pathname.startsWith('/uploads/') || url.pathname.includes('/photos/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 3. For navigation requests, return index.html if offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // 4. Stale-while-revalidate for static scripts, CSS, and fonts
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
