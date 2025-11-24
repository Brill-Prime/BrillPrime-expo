// Firebase Configuration - Web Only
// Simplified Firebase setup for web platform compatibility

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import Constants from 'expo-constants';

const getEnvValue = (key: string) => {
  const extraKey = key
    .replace('EXPO_PUBLIC_', '')
    .toLowerCase()
    .replace(/_([a-z])/g, (_, char) => char.toUpperCase());

  const extras = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

  return extras[extraKey] || process.env[key] || '';
};

// Get Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: getEnvValue('EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: getEnvValue('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvValue('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvValue('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvValue('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvValue('EXPO_PUBLIC_FIREBASE_APP_ID'),
  databaseURL: getEnvValue('EXPO_PUBLIC_FIREBASE_DATABASE_URL'),
  measurementId: getEnvValue('EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID'),
};

const missingFields = Object.entries(firebaseConfig)
  .filter(([key, value]) => !value && key !== 'measurementId' && key !== 'databaseURL')
  .map(([key]) => key);

export const isFirebaseConfigured = missingFields.length === 0;

if (!isFirebaseConfigured) {
  console.warn('⚠️ Firebase configuration incomplete. Some features may be disabled. Missing:', missingFields);
} else {
  console.log('✅ Firebase environment variables resolved successfully');
}

// Initialize Firebase with error handling
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db;
let storage;

try {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase configuration incomplete');
  }

  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  // Create fallback empty objects to prevent crashes
  app = null;
  auth = null;
  db = null as any;
  storage = null as any;
}

// Icon fallback configuration for web
// Using @expo/vector-icons for icons; no CDN injection required to avoid ORB errors on web.
export { app, auth, db, storage };

export default app;