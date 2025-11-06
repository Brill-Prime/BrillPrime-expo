
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Retrieve Supabase configuration from environment
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Validation function for Supabase URL
function validateSupabaseUrl(url: string): { isValid: boolean; error?: string } {
  if (!url) {
    return { isValid: false, error: 'Supabase URL is missing' };
  }
  
  if (!url.startsWith('https://')) {
    return { isValid: false, error: 'Supabase URL must use HTTPS' };
  }
  
  if (!url.includes('.supabase.co')) {
    return { isValid: false, error: 'Invalid Supabase URL format (should contain .supabase.co)' };
  }
  
  return { isValid: true };
}

// Validation function for Supabase Anon Key
function validateSupabaseKey(key: string): { isValid: boolean; error?: string } {
  if (!key) {
    return { isValid: false, error: 'Supabase Anon Key is missing' };
  }
  
  // Supabase anon keys are typically JWT tokens that start with 'eyJ'
  if (!key.startsWith('eyJ')) {
    return { isValid: false, error: 'Supabase Anon Key appears to be invalid (should be a JWT token)' };
  }
  
  if (key.length < 100) {
    return { isValid: false, error: 'Supabase Anon Key is too short to be valid' };
  }
  
  return { isValid: true };
}

// Validate configuration
const urlValidation = validateSupabaseUrl(supabaseUrl);
const keyValidation = validateSupabaseKey(supabaseAnonKey);

// Log validation results
if (!urlValidation.isValid || !keyValidation.isValid) {
  console.error('❌ Supabase Configuration Error:');
  
  if (!urlValidation.isValid) {
    console.error(`  - URL: ${urlValidation.error}`);
  }
  
  if (!keyValidation.isValid) {
    console.error(`  - Anon Key: ${keyValidation.error}`);
  }
  
  console.error('\n📋 To fix this:');
  console.error('  1. Go to your Replit Secrets (Tools > Secrets)');
  console.error('  2. Add EXPO_PUBLIC_SUPABASE_URL with your Supabase project URL');
  console.error('  3. Add EXPO_PUBLIC_SUPABASE_ANON_KEY with your Supabase anon/public key');
  console.error('  4. Find these values in your Supabase project settings');
  console.error('\n🔗 Supabase Dashboard: https://supabase.com/dashboard/project/_/settings/api\n');
}

// Create Supabase client with validated configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'x-client-info': 'brillprime-app',
    },
  },
});

// Export validation status for use in app
export const isSupabaseConfigured = urlValidation.isValid && keyValidation.isValid;

// Log success or provide guidance
if (isSupabaseConfigured) {
  console.log('✅ Supabase client initialized successfully');
  console.log(`🔷 URL: ${supabaseUrl}`);
  console.log(`🔑 Key: ${supabaseAnonKey.substring(0, 20)}...`);
} else {
  console.warn('⚠️ Supabase client created with invalid configuration - features may not work correctly');
}
