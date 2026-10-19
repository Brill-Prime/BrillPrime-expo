import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { app, isFirebaseConfigured } from './firebaseApp';

let auth: Auth | null = null;
let db;
let storage;

if (app) {
  try {
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
  }
}

export { app, auth, db, storage, isFirebaseConfigured };

export const isFirebaseInitialized = () => !!app && !!auth;

export default app;
