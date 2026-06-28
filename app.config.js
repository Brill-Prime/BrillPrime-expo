// app.config.js
// Load environment variables from .env file
import 'dotenv/config';

export default {
  name: "BrillPrime",
  slug: "brillprime",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/logo.png",
  userInterfaceStyle: "light",
  scheme: "brillprime",
  newArchEnabled: false,
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.brillprime.app"
    // Removed googleServicesFile to prevent prebuild failure when file is not present.
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/logo.png",
      backgroundColor: "#ffffff"
    },
    package: "com.brillprime.app"
    // Removed googleServicesFile to prevent prebuild failure when file is not present.
  },
  web: {
    bundler: "metro",
    favicon: "./assets/images/logo.png",
    // Performance optimization: preconnect to Google Maps
    meta: {
      preconnect: [
        { href: 'https://maps.googleapis.com', crossorigin: true },
        { href: 'https://maps.gstatic.com', crossorigin: true }
      ]
    }
  },
  plugins: [
    "expo-router",
    "expo-font",
    "expo-web-browser",
    [
      "expo-build-properties",
      {
        android: {
          compileSdkVersion: 34,
          targetSdkVersion: 34,
          buildToolsVersion: "34.0.0",
          newArchEnabled: false
        },
        ios: {
          deploymentTarget: "15.1",
          newArchEnabled: false
        }
      }
    ]
  ],
  experiments: {
    typedRoutes: true,
    tsconfigPaths: true
  },
  extra: {
    router: {
      origin: false
    },
    eas: {
      projectId: "your-project-id"
    },
    // Firebase configuration pulled strictly from environment variables
    firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
    firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
    firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
    firebaseDatabaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || '',
    firebaseMeasurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
    // Database / Supabase configuration (client-safe only)
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    supabasePublishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
    // API configuration
    apiTimeout: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000', 10),
    // Mapping / location services
    googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '',
    mapboxAccessToken: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || ''
  }
};