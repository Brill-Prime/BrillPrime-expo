
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
    config.apiBaseUrl = config.apiBaseUrl || 'https://your-backend-app.onrender.com';
  }

  return config;
};

export const ENV = getEnvironmentConfig();
