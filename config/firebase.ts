
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

// Icon fallback configuration for web
if (typeof window !== 'undefined') {
  // Add Ionicons CSS fallback
  const ioniconsLink = document.createElement('link');
  ioniconsLink.rel = 'stylesheet';
  ioniconsLink.href = 'https://cdn.jsdelivr.net/npm/ionicons@7.1.0/dist/collection/components/ion-icon/ion-icon.css';
  document.head.appendChild(ioniconsLink);
  
  // Add Ionicons script
  const ioniconsScript = document.createElement('script');
  ioniconsScript.type = 'module';
  ioniconsScript.src = 'https://cdn.jsdelivr.net/npm/ionicons@7.1.0/dist/ionicons/ionicons.esm.js';
  document.head.appendChild(ioniconsScript);
  
  const ioniconsNoModule = document.createElement('script');
  ioniconsNoModule.setAttribute('nomodule', '');
  ioniconsNoModule.src = 'https://cdn.jsdelivr.net/npm/ionicons@7.1.0/dist/ionicons/ionicons.js';
  document.head.appendChild(ioniconsNoModule);
}

export default app;
