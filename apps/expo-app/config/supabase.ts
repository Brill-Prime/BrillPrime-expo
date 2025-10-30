// Supabase Configuration for Expo App

import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Get Supabase configuration from environment variables
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validate that we have the required config
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required Supabase configuration');
  console.error('Supabase config:', { hasUrl: !!supabaseUrl, hasAnonKey: !!supabaseAnonKey });
  throw new Error('Supabase configuration is incomplete. Please check your environment variables.');
}

// Initialize Supabase client with Realtime configuration
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Enable realtime for the client
console.log('✅ Supabase Realtime initialized');

export { supabase };