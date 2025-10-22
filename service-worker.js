
// This is a basic service worker for PWA capabilities.
// In a real application, you would use a library like Workbox to handle caching and offline strategies.

const CACHE_NAME = 'timepass-katta-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  // Add other static assets here that you want to cache
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
