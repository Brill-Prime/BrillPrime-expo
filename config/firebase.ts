// Firebase Configuration - Web Only
// Simplified Firebase setup for web platform compatibility

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Web Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBAe9x-nOCzn8VA1oAP23y2Sv2sIiVyP0s",
  authDomain: "brillprimefirebase.firebaseapp.com",
  databaseURL: "https://brillprimefirebase-default-rtdb.firebaseio.com",
  projectId: "brillprimefirebase",
  storageBucket: "brillprimefirebase.firebasestorage.app",
  messagingSenderId: "655201684400",
  appId: "1:655201684400:web:ec3ac485a4f98a82fb2475",
  measurementId: "G-7T5QKZPDWW"
};

// Initialize Firebase with error handling
let app;
let auth: Auth;
let db;
let storage;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Create fallback empty objects to prevent crashes
  app = null as any;
  auth = null as any;
  db = null as any;
  storage = null as any;
}

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

export { auth, db, storage };
export default app;