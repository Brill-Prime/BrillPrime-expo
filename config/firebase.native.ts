import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import {
  getAuth,
  initializeAuth,
  type Auth,
  type Persistence,
} from 'firebase/auth';
import { app, isFirebaseConfigured } from './firebaseApp';

const { getReactNativePersistence } = require('firebase/auth') as {
  getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
};

let auth: Auth | null = null;
let db;
let storage;

if (app) {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
    console.log('✅ Firebase initialized successfully with native persistence');
  } catch (error) {
    console.error('❌ Firebase Auth persistence initialization failed:', error);
    try {
      auth = getAuth(app);
      console.warn('⚠️ Firebase Auth initialized with default persistence');
    } catch (authError) {
      console.error('❌ Firebase Auth fallback initialization failed:', authError);
    }
  }

  try {
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.error('❌ Firebase service initialization error:', error);
  }
}

export { app, auth, db, storage, isFirebaseConfigured };

export const isFirebaseInitialized = () => !!app && !!auth;

export default app;
