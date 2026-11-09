import { createClient } from '@supabase/supabase-js';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { SUPABASE_CONFIG } from './environment';

const supabaseUrl = SUPABASE_CONFIG.url.trim();
const supabaseAnonKey = SUPABASE_CONFIG.anonKey.trim();

const validateSupabaseUrl = (url: string): { isValid: boolean; error?: string } => {
  if (!url) {
    return { isValid: false, error: 'Supabase URL is missing' };
  }

  if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) {
    return { isValid: true };
  }

  if (!url.startsWith('https://')) {
    return { isValid: false, error: 'Supabase URL must use HTTPS (except for localhost)' };
  }

  if (!url.includes('.supabase.co') && !url.includes('.supabase.') && !url.includes('localhost')) {
    return { isValid: false, error: 'Invalid Supabase URL format' };
  }

  return { isValid: true };
};

const validateSupabaseKey = (key: string): { isValid: boolean; error?: string } => {
  if (!key) {
    return { isValid: false, error: 'Supabase anon key is missing' };
  }

  if (!key.startsWith('eyJ') && !key.startsWith('sb_')) {
    return { isValid: false, error: 'Supabase anon key does not look valid' };
  }

  return { isValid: true };
};

const urlValidation = validateSupabaseUrl(supabaseUrl);
const keyValidation = validateSupabaseKey(supabaseAnonKey);
export const isSupabaseConfigured = urlValidation.isValid && keyValidation.isValid;

const safeUrl = isSupabaseConfigured ? supabaseUrl : 'https://example.supabase.co';
const safeAnonKey = isSupabaseConfigured ? supabaseAnonKey : 'placeholder-key';

export const supabase = createClient(safeUrl, safeAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'x-client-info': 'brillprime-app',
      Accept: 'application/json',
      'Content-Type': 'application/json',
      apikey: safeAnonKey,
    },
  },
  accessToken: async () => {
    const firebaseUser = auth?.currentUser;
    if (!firebaseUser) {
      return isSupabaseConfigured ? safeAnonKey : null;
    }

    try {
      return await firebaseUser.getIdToken();
    } catch (error) {
      console.warn('Could not refresh Firebase token for Supabase:', error);
      return isSupabaseConfigured ? safeAnonKey : null;
    }
  },
});

if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase is not configured. Backend requests and realtime subscriptions are disabled until EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set.');
} else {
  console.log('✅ Supabase client initialized successfully');

  if (auth) {
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        supabase.realtime.setAuth(safeAnonKey);
        return;
      }

      void user.getIdToken()
        .then((token) => supabase.realtime.setAuth(token))
        .catch((error) => console.error('Could not update Supabase Realtime auth:', error));
    });
  }

  const originalBroadcast = supabase.channel.bind(supabase);
  supabase.channel = function (...args: any[]) {
    const channel = originalBroadcast(...args);
    const originalSubscribe = channel.subscribe;
    channel.subscribe = function (callback?: any) {
      return originalSubscribe.call(this, (status: string, err?: any) => {
        if (err?.message?.includes('no unique or exclusion constraint')) {
          console.debug('Supabase constraint info:', err.message);
        } else if (err) {
          console.warn('Supabase realtime warning:', err.message || err);
        }
        if (callback) {
          callback(status, err);
        }
      });
    };
    return channel;
  };
}