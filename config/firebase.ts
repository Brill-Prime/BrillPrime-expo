// Firebase Configuration - Web Only
// Simplified Firebase setup for web platform compatibility

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Web Firebase configuration - requires environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Validate Firebase configuration
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);

if (missingFields.length > 0) {
  console.error('❌ Firebase configuration error: Missing required environment variables:', 
    missingFields.map(f => `EXPO_PUBLIC_FIREBASE_${f.toUpperCase().replace(/([A-Z])/g, '_$1')}`).join(', ')
  );
  throw new Error(`Firebase initialization failed: Missing environment variables. Please set: ${missingFields.join(', ')}`);
}

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