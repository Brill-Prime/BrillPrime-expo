// Supabase Configuration for Expo App
// Firebase handles ALL authentication, Supabase is used for data storage and realtime features

import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { auth } from './firebase';

// Get Supabase configuration from environment variables
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validate that we have the required config
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required Supabase configuration');
  console.error('Supabase config:', { hasUrl: !!supabaseUrl, hasAnonKey: !!supabaseAnonKey });
  console.warn('⚠️ Supabase will not be available. Using Firebase-only mode.');
}

// Initialize Supabase client with Realtime configuration
// Note: Auth is disabled as Firebase handles all authentication
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  auth: {
    persistSession: false, // Firebase handles session persistence
    autoRefreshToken: false, // Firebase handles token refresh
    detectSessionInUrl: false, // Not using Supabase auth URLs
  },
  global: {
    headers: {
      'X-Auth-Provider': 'firebase', // Indicate Firebase is the auth provider
    },
  },
}) : null;

// Function to sync Firebase token with Supabase for RLS policies
export const setSupabaseAuthToken = async (firebaseToken: string | null) => {
  if (!supabase) return;
  
  try {
    if (firebaseToken) {
      // Set the auth token for both REST API and Realtime
      await supabase.auth.setSession({
        access_token: firebaseToken,
        refresh_token: firebaseToken,
      });
      
      // Also set for realtime subscriptions
      supabase.realtime.setAuth(firebaseToken);
      
      console.log('✅ Firebase token synced with Supabase for RLS');
    } else {
      // Clear session when logging out
      await supabase.auth.signOut();
      console.log('✅ Supabase session cleared');
    }
  } catch (error) {
    console.error('❌ Error syncing Firebase token with Supabase:', error);
  }
};

// Listen to Firebase auth changes and sync with Supabase
if (supabase) {
  auth.onAuthStateChanged((user) => {
    if (user) {
      user.getIdToken().then((token) => {
        setSupabaseAuthToken(token);
      });
    } else {
      setSupabaseAuthToken(null);
    }
  });
  
  console.log('✅ Supabase Realtime initialized (Firebase Auth)');

  // Initialize Firebase-Supabase sync service
  import('../services/firebaseSupabaseSync').then(({ firebaseSupabaseSync }) => {
    firebaseSupabaseSync.initialize().catch(err => 
      console.error('Failed to initialize sync service:', err)
    );
  });
} else {
  console.warn('⚠️ Supabase client not initialized');
}

export { supabase };