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
    // API configuration - use external API or Firebase
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || "https://api.brillprime.com",
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
    // Use localhost for native development
    config.apiBaseUrl = config.apiBaseUrl || 'http://localhost:5000';
  } else {
    // Production - use your deployed backend URL
    config.apiBaseUrl = config.apiBaseUrl || 'https://api.brillprime.com';
  }

  return config;
};

const isDevelopment = process.env.NODE_ENV === 'development' || (typeof __DEV__ !== 'undefined' && __DEV__);
const isProduction = process.env.NODE_ENV === 'production';

// API Configuration - use Metro proxy in development, direct connection in production
export const API_CONFIG = {
  baseURL: isDevelopment ? 'http://localhost:5000' : (process.env.EXPO_PUBLIC_API_URL || 'https://api.brillprime.com'),
  timeout: 30000,
};

// Determine API base URL based on environment
const getApiBaseUrl = () => {
  return API_CONFIG.baseURL;
};

export const ENV = {
  isDevelopment,
  isProduction,
  apiBaseUrl: getApiBaseUrl(),
  apiTimeout: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000'), // 30s for local development
  mapApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
  enableAnalytics: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true',
  enableCrashReporting: process.env.EXPO_PUBLIC_ENABLE_CRASH_REPORTING === 'true',
  maxRetries: parseInt(process.env.EXPO_PUBLIC_MAX_RETRIES || '3'),
  cacheTimeout: parseInt(process.env.EXPO_PUBLIC_CACHE_TIMEOUT || '300000'), // 5 minutes
};