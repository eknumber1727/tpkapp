// Import the functions you need from the SDKs you need
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import 'firebase/compat/messaging';

// SECURITY FIX: Your web app's Firebase configuration is now loaded from environment variables
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// FIX: Defer initialization to be called within the React component lifecycle.
// This allows the ErrorBoundary to catch any configuration errors.
export const initializeFirebaseApp = () => {
    if (!firebase.apps.length) {
      if (!firebaseConfig.apiKey) {
        throw new Error(
          "Firebase API Key is missing. Please add VITE_FIREBASE_API_KEY to your environment variables. The app cannot start without it."
        );
      }
      firebase.initializeApp(firebaseConfig);
    }
};

export default firebase;