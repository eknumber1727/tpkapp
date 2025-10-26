// Import and initialize the Firebase SDK
// Use importScripts for service workers
self.importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
self.importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

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
