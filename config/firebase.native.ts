import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import {
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
    db = getFirestore(app);
    storage = getStorage(app);
    console.log('✅ Firebase initialized successfully with native persistence');
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
  }
}

export { app, auth, db, storage, isFirebaseConfigured };

export const isFirebaseInitialized = () => !!app && !!auth;

export default app;
