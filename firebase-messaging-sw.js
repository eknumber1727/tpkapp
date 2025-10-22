// Import and initialize the Firebase SDK
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging/sw";

const firebaseConfig = {
  apiKey: "AIzaSyBRn-dfdvPQ6ELMGDsFKTvUngez6Ly4yn4",
  authDomain: "tk-photo-4e1d7.firebaseapp.com",
  projectId: "tk-photo-4e1d7",
  storageBucket: "tk-photo-4e1d7.firebasestorage.app",
  messagingSenderId: "204896553011",
  appId: "1:204896553011:web:7be3db5a8bc45ba4cb3b46",
  measurementId: "G-D054Y6RX16"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Background message handler can be added here if needed
console.log('Firebase messaging service worker initialized.');