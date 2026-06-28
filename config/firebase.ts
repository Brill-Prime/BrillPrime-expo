// Firebase Configuration - Cross-platform safe
// Simplified Firebase setup for web/native compatibility

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Get Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey || process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain || process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: Constants.expoConfig?.extra?.firebaseProjectId || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket || process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId || process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: Constants.expoConfig?.extra?.firebaseAppId || process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  databaseURL: Constants.expoConfig?.extra?.firebaseDatabaseURL || process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  measurementId: Constants.expoConfig?.extra?.firebaseMeasurementId || process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
const isWebPlatform = Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined';

console.log('Firebase Config Status:', {
  hasApiKey: !!firebaseConfig.apiKey,
  hasAuthDomain: !!firebaseConfig.authDomain,
  hasProjectId: !!firebaseConfig.projectId,
  hasStorageBucket: !!firebaseConfig.storageBucket,
  hasMessagingSenderId: !!firebaseConfig.messagingSenderId,
  hasAppId: !!firebaseConfig.appId,
  projectId: firebaseConfig.projectId,
  platform: Platform.OS,
  isFirebaseConfigured,
});

// Initialize Firebase with error handling
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: any = null;
let storage: any = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    if (Platform.OS !== 'web') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { getReactNativePersistence } = require('firebase/auth/react-native');
        auth = initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage),
        });
      } catch (nativeAuthError) {
        console.warn('Firebase native persistence unavailable, falling back to default auth:', nativeAuthError);
        auth = getAuth(app);
      }
    } else {
      auth = getAuth(app);
    }
    db = getFirestore(app);
    storage = getStorage(app);

    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    app = null;
    auth = null;
    db = null;
    storage = null;
  }
} else {
  console.warn('⚠️ Firebase configuration is incomplete; continuing without Firebase initialization.');
}

// Icon fallback configuration for web only
if (isWebPlatform) {
  try {
    const ioniconsLink = document.createElement('link');
    ioniconsLink.rel = 'stylesheet';
    ioniconsLink.href = 'https://cdn.jsdelivr.net/npm/ionicons@7.1.0/dist/collection/components/ion-icon/ion-icon.css';
    document.head.appendChild(ioniconsLink);

    const ioniconsScript = document.createElement('script');
    ioniconsScript.type = 'module';
    ioniconsScript.src = 'https://cdn.jsdelivr.net/npm/ionicons@7.1.0/dist/ionicons/ionicons.esm.js';
    document.head.appendChild(ioniconsScript);

    const ioniconsNoModule = document.createElement('script');
    ioniconsNoModule.setAttribute('nomodule', '');
    ioniconsNoModule.src = 'https://cdn.jsdelivr.net/npm/ionicons@7.1.0/dist/ionicons/ionicons.js';
    document.head.appendChild(ioniconsNoModule);
  } catch (error) {
    console.warn('Unable to attach Ionicons web fallback:', error);
  }
}

export { auth, db, storage };
export default app;