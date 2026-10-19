// app.config.js
// Load environment variables from .env file
import 'dotenv/config';

const easProjectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID || 'aa9abbbe-13a1-44d5-91b0-b65256603d1b';
const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';

export default {
  name: "BrillPrime",
  slug: "brillprime",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/logo.png",
  userInterfaceStyle: "light",
  scheme: "brillprime",
  // Removed newArchEnabled: false to resolve warning about React Native's New Architecture
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  runtimeVersion: {
    policy: 'appVersion'
  },
  updates: easProjectId ? {
    url: `https://u.expo.dev/${easProjectId}`
  } : undefined,
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.brillprime.app",
    config: {
      googleMapsApiKey
    }
    // Removed googleServicesFile to prevent prebuild failure when file is not present.
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/logo.png",
      backgroundColor: "#ffffff"
    },
    package: "com.brillprime.app",
    config: {
      googleMaps: {
        apiKey: googleMapsApiKey
      }
    }
    // Removed googleServicesFile to prevent prebuild failure when file is not present.
  },
  web: {
    bundler: "metro",
    favicon: "./assets/images/logo.png",
    config: {
      googleMaps: {
        apiKey: googleMapsApiKey
      }
    }
  },
  plugins: [
    "expo-router",
    "expo-asset",
    "expo-font",
    "expo-web-browser",
    [
      "expo-image-picker",
      {
        photosPermission: "Allow BrillPrime to access your photos so you can attach images.",
        cameraPermission: "Allow BrillPrime to use your camera to capture attachments.",
        microphonePermission: false
      }
    ],
    [
      "expo-location",
      {
        locationWhenInUsePermission: "Allow BrillPrime to use your location for nearby stores and deliveries."
      }
    ],
    [
      "expo-local-authentication",
      {
        faceIDPermission: "Allow BrillPrime to use Face ID to secure your account."
      }
    ],
    "expo-notifications",
    [
      "expo-build-properties",
      {
        android: {
          compileSdkVersion: 36,
          targetSdkVersion: 36,
          buildToolsVersion: "36.0.0"
          // Removed newArchEnabled: false to resolve warning
        },
        ios: {
          deploymentTarget: "15.1"
          // Removed newArchEnabled: false to resolve warning
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
      projectId: easProjectId || ""
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
    // Google Maps configuration
    googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || ''
  }
};