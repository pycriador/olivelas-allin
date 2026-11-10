/**
 * Service Worker - PWA offline caching
 */
const CACHE_NAME = 'pbecia-catalog-v2';

const STATIC_ASSETS = [
  './',
  './index.html',
  './offline.html',
  './manifest.webmanifest',
  './assets/css/variables.css',
  './assets/css/style.css',
  './assets/css/layout.css',
  './assets/css/components.css',
  './assets/css/responsive.css',
  './assets/js/app.js',
  './assets/js/pagination.js',
  './assets/js/utils.js',
  './assets/js/catalog.js',
  './assets/js/filters.js',
  './assets/js/search.js',
  './assets/js/modal.js',
  './assets/js/whatsapp.js',
  './assets/js/cart.js',
  './assets/images/favicon.png',
  './assets/images/apple-touch-icon.png',
  './assets/images/logo.png',
  './assets/images/placeholder.webp',
  './data/produtos.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  // Network-first for data (always fresh product data when online)
  if (url.pathname.includes('/data/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => {
          if (request.mode === 'navigate') {
            return caches.match('./offline.html');
          }
        });
    })
  );
});
