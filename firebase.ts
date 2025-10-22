// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
