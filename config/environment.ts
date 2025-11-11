// Environment Configuration
// Centralized configuration for different environments

// Type declarations for global variables
declare const __DEV__: boolean;

// Removed getEnvironmentConfig function and related configurations as per the intention.

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Determine API base URL based on environment
// Architecture: Firebase for Auth, Supabase for all backend logic
const getApiBaseUrl = () => {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    console.warn('⚠️ EXPO_PUBLIC_SUPABASE_URL not set, using fallback');
    return 'https://lkfprjjlqmtpamukoatl.supabase.co'; // Fallback to known Supabase URL
  }
  return supabaseUrl;
};

export const ENV = {
  isDevelopment,
  isProduction,
  apiBaseUrl: getApiBaseUrl(),
  apiTimeout: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000'), // 30s
  mapApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
  enableAnalytics: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true',
  enableCrashReporting: process.env.EXPO_PUBLIC_ENABLE_CRASH_REPORTING === 'true',
  maxRetries: parseInt(process.env.EXPO_PUBLIC_MAX_RETRIES || '3'),
  cacheTimeout: parseInt(process.env.EXPO_PUBLIC_CACHE_TIMEOUT || '300000'), // 5 minutes
};

// Supabase configuration
export const SUPABASE_CONFIG = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
};

// Firebase configuration
export const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || '',
};