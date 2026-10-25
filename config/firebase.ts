// Firebase configuration and platform-specific Auth persistence.

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth, type Persistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

// Initialize Firebase only if config is complete
if (isFirebaseConfigured) {
  try {
    // Initialize Firebase if not already initialized
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    
    // Initialize services
    if (Platform.OS === 'web') {
      auth = getAuth(app);
    } else {
      try {
        // The React Native conditional export provides this helper; web typings do not.
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { getReactNativePersistence } = require('firebase/auth') as {
          getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
        };
        auth = initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage),
        });
      } catch (error) {
        if (error instanceof Error && (
          ('code' in error && error.code === 'auth/already-initialized') ||
          error.message.toLowerCase().includes('already initialized')
        )) {
          auth = getAuth(app);
        } else {
          throw error;
        }
      }
    }
    db = getFirestore(app);
    storage = getStorage(app);
    
    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
  }
} else {
  console.warn('⚠️ Firebase not initialized due to missing configuration');
}

// Export initialized services
export { app, auth, db, storage };

// Export initialization check
export const isFirebaseInitialized = () => {
  return !!app && !!auth;
};

export default app;