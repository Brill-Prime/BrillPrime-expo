
// Firebase Configuration
// Centralized Firebase setup for the application

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { environment } from './environment';

const firebaseConfig = {
  apiKey: "AIzaSyADwNa-Tzmm-VIsk2jZXGfBjnzRfyRxgjs",
  authDomain: "brillprime.firebaseapp.com",
  projectId: "brillprime",
  storageBucket: "brillprime.firebasestorage.app",
  messagingSenderId: "1064268711919",
  appId: "1:1064268711919:ios:bec72ebb9ccbe0e5a2581a"
};

// Initialize Firebase only if it hasn't been initialized yet
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
