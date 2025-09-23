
// Environment Configuration
// Centralized configuration for different environments

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
  const isDevelopment = __DEV__;
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
    config.apiBaseUrl = config.apiBaseUrl || 'http://localhost:3000';
  } else {
    // Production - use your Render backend URL
    config.apiBaseUrl = config.apiBaseUrl || 'https://your-backend-app.onrender.com';
  }

  return config;
};

export const ENV = getEnvironmentConfig();
