
// Firebase Configuration
// Centralized Firebase setup for the application

import { Platform } from 'react-native';

// Web Firebase imports
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// React Native Firebase imports (for mobile)
let rnAuth: any, rnFirestore: any, rnStorage: any;
if (Platform.OS !== 'web') {
  try {
    rnAuth = require('@react-native-firebase/auth').default;
    rnFirestore = require('@react-native-firebase/firestore').default;
    rnStorage = require('@react-native-firebase/storage').default;
  } catch (error) {
    console.warn('React Native Firebase not available, using web SDK');
  }
}

// Web Firebase configuration
const webFirebaseConfig = {
  apiKey: "AIzaSyDWy-NucthigIrHSNYo_nI-o2BY8Rwkod0",
  authDomain: "brillprime.firebaseapp.com",
  projectId: "brillprime",
  storageBucket: "brillprime.firebasestorage.app",
  messagingSenderId: "1064268711919",
  appId: "1:1064268711919:web:de8f36a25600d553a2581a"
};

// iOS Firebase configuration (for reference)
const iosFirebaseConfig = {
  apiKey: "AIzaSyADwNa-Tzmm-VIsk2jZXGfBjnzRfyRxgjs",
  authDomain: "brillprime.firebaseapp.com",
  projectId: "brillprime",
  storageBucket: "brillprime.firebasestorage.app",
  messagingSenderId: "1064268711919",
  appId: "1:1064268711919:ios:bec72ebb9ccbe0e5a2581a"
};

// Initialize Firebase based on platform
let app: any;
let auth: any;
let db: any;
let storage: any;

if (Platform.OS === 'web') {
  // Web Firebase initialization
  app = getApps().length === 0 ? initializeApp(webFirebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} else {
  // React Native Firebase (Android/iOS) - auto-initialized from google-services.json
  if (rnAuth && rnFirestore && rnStorage) {
    auth = rnAuth();
    db = rnFirestore();
    storage = rnStorage();
    app = null; // Not needed for React Native Firebase
  } else {
    // Fallback to web SDK if React Native Firebase is not available
    app = getApps().length === 0 ? initializeApp(webFirebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  }
}

export { auth, db, storage };

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
