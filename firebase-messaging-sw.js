// --- PWA Caching Logic (Merged from service-worker.js) ---
const CACHE_NAME = 'timepass-katta-cache-v3'; // Incremented version
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/index.tsx'
];

// On install, cache the app shell and take control immediately
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching App Shell');
        return cache.addAll(APP_SHELL_URLS);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker.
        return self.skipWaiting();
      })
  );
});

// On activation, clean up old caches and take control
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        // Tell the active service worker to take control of the page immediately.
        return self.clients.claim();
    })
  );
});


self.addEventListener('fetch', event => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return the cached response if it's found.
        if (cachedResponse) {
          return cachedResponse;
        }

        // If the resource is not in the cache, fetch it from the network.
        return fetch(event.request);
      })
  );
});

// --- Firebase Messaging Logic ---

// Import and initialize the Firebase SDK
// Use importScripts for service workers
self.importScripts('https://www.gstatic.com/firebasejs/10.12.3/firebase-app-compat.js');
self.importScripts('https://www.gstatic.com/firebasejs/10.12.3/firebase-messaging-compat.js');

// SECURITY FIX: Get Firebase config from URL search params
const params = new URL(location).searchParams;
const firebaseConfig = JSON.parse(params.get('firebaseConfig'));

if (firebaseConfig) {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message ', payload);
      
      const notificationTitle = payload.notification?.title || 'New Message';
      const notificationOptions = {
        body: payload.notification?.body || 'You have a new notification.',
        icon: '/icons/icon-192x192.png'
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });
    console.log('Firebase messaging service worker initialized.');
} else {
    console.error('Firebase config not found in service worker.');
}
