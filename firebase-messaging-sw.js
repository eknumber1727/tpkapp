// Import and initialize the Firebase SDK
import firebase from 'firebase/compat/app';
import 'firebase/compat/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyBRn-dfdvPQ6ELMGDsFKTvUngez6Ly4yn4",
  authDomain: "tk-photo-4e1d7.firebaseapp.com",
  projectId: "tk-photo-4e1d7",
  storageBucket: "tk-photo-4e1d7.firebasestorage.app",
  messagingSenderId: "204896553011",
  appId: "1:204896553011:web:7be3db5a8bc45ba4cb3b46",
  measurementId: "G-D054Y6RX16"
};

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