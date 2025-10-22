// Import the functions you need from the SDKs you need
// FIX: Use compat libraries for app and auth to resolve import errors, likely due to a Firebase version mismatch.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
// FIX: Use compat libraries for firestore and storage to match the app initialization.
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBRn-dfdvPQ6ELMGDsFKTvUngez6Ly4yn4",
  authDomain: "tk-photo-4e1d7.firebaseapp.com",
  projectId: "tk-photo-4e1d7",
  storageBucket: "tk-photo-4e1d7.firebasestorage.app",
  messagingSenderId: "204896553011",
  appId: "1:204896553011:web:7be3db5a8bc45ba4cb3b46",
  measurementId: "G-D054Y6RX16"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
export const auth = firebase.auth();
// FIX: Use compat syntax for getting Firestore and Storage instances.
export const db = app.firestore();
export const storage = app.storage();

export default firebase;
