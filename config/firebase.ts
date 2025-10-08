// Firebase Configuration - Web Only
// Simplified Firebase setup for web platform compatibility

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
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

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

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