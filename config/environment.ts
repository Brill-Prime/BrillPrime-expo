// Environment Configuration
// Centralized configuration for different environments

// Type declarations for global variables
declare const __DEV__: boolean;

interface EnvironmentConfig {
  apiBaseUrl: string;
  environment: 'development' | 'staging' | 'production';
  enableLogging: boolean;
  googleMapsApiKey: string;
  features: {
    pushNotifications: boolean;
    analytics: boolean;
    crashReporting: boolean;
  };
}

const getEnvironmentConfig = (): EnvironmentConfig => {
  const isDevelopment = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV === 'development';
  const environment = process.env.NODE_ENV || 'development';

  // Base configuration
  const config: EnvironmentConfig = {
    apiBaseUrl: process.env.API_BASE_URL || '',
    environment: environment as any,
    enableLogging: isDevelopment,
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    features: {
      pushNotifications: true,
      analytics: !isDevelopment,
      crashReporting: !isDevelopment,
    }
  };

  // Environment-specific overrides
  if (isDevelopment) {
    // Use Replit's dynamic URL for development
    const replitUrl = process.env.REPLIT_DEV_DOMAIN;
    config.apiBaseUrl = config.apiBaseUrl || (replitUrl ? `https://${replitUrl}` : 'http://localhost:3000');
  } else {
    // Production - use your deployed backend URL
    config.apiBaseUrl = config.apiBaseUrl || 'https://api.brillprime.com';
  }

  return config;
};

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Determine API base URL based on environment
// Architecture: Firebase for Auth, Replit Postgres + Hono for all backend logic
const getApiBaseUrl = () => {
  // In Replit, use the environment domain for the API server
  const replitDomain = process.env.REPLIT_DEV_DOMAIN;
  if (replitDomain) {
    return `https://${replitDomain}`;
  }
  // Fallback to localhost for local development
  return 'http://localhost:3000';
};

export const ENV = {
  isDevelopment,
  isProduction,
  apiBaseUrl: getApiBaseUrl(),
  apiTimeout: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '60000'), // 60s for Render cold starts
  mapApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
  enableAnalytics: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true',
  enableCrashReporting: process.env.EXPO_PUBLIC_ENABLE_CRASH_REPORTING === 'true',
  maxRetries: parseInt(process.env.EXPO_PUBLIC_MAX_RETRIES || '3'),
  cacheTimeout: parseInt(process.env.EXPO_PUBLIC_CACHE_TIMEOUT || '300000'), // 5 minutes
};