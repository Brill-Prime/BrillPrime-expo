import Constants from 'expo-constants';

const getExtraValue = (key: string, fallback = ''): string => {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
  const value = extra[key];
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  const envValue = process.env[key];
  return typeof envValue === 'string' ? envValue : fallback;
};

const supabaseUrl = getExtraValue('supabaseUrl', process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim();
const supabaseAnonKey = getExtraValue('supabaseAnonKey', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').trim();

export const ENV = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  apiBaseUrl: supabaseUrl.replace(/\/+$/, ''),
  apiTimeout: Number(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000') || 30000,
  maxRetries: Number(process.env.EXPO_PUBLIC_MAX_RETRIES || '3') || 3,
  mapApiKey: getExtraValue('EXPO_PUBLIC_GOOGLE_MAPS_API_KEY', process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || ''),
  sentryDsn: getExtraValue('EXPO_PUBLIC_SENTRY_DSN', process.env.EXPO_PUBLIC_SENTRY_DSN || ''),
  enableAnalytics: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true',
  enableCrashReporting: process.env.EXPO_PUBLIC_ENABLE_CRASH_REPORTING === 'true',
  cacheTimeout: Number(process.env.EXPO_PUBLIC_CACHE_TIMEOUT || '300000') || 300000,
};

export const SUPABASE_CONFIG = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
};
