import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import Constants from 'expo-constants';

const getEnvValue = (key: string) => {
  const extraKey = key
    .replace('EXPO_PUBLIC_', '')
    .toLowerCase()
    .replace(/_([a-z])/g, (_, char) => char.toUpperCase());

  const extras = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

  return extras[extraKey] || process.env[key] || '';
};

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

let app: FirebaseApp | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
  }
} else {
  console.warn('⚠️ Firebase not initialized due to missing configuration');
}

export { app };
