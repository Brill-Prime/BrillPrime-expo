
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
  rnAuth = require('@react-native-firebase/auth').default;
  rnFirestore = require('@react-native-firebase/firestore').default;
  rnStorage = require('@react-native-firebase/storage').default;
}

import { environment } from './environment';

const firebaseConfig = {
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
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} else {
  // React Native Firebase (Android/iOS) - auto-initialized from google-services.json
  auth = rnAuth();
  db = rnFirestore();
  storage = rnStorage();
  app = null; // Not needed for React Native Firebase
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
