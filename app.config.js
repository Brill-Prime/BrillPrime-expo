// app.config.js
const easProjectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID || "";
const googleMapsApiKey =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || "";

export default {
  name: "BrillPrime",
  slug: "brillprime",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/logo.png",
  userInterfaceStyle: "light",
  scheme: "brillprime",
  updates: easProjectId
    ? { url: `https://u.expo.dev/${easProjectId}` }
    : undefined,
  runtimeVersion: {
    policy: "appVersion"
  },
  // Removed newArchEnabled: false to resolve warning about React Native's New Architecture
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
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
    // Keep the package ID used by the existing Android native project.
    package: "com.brillprime",
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
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || ''
      }
    }
  },
  plugins: [
    "expo-router",
    "expo-font",
    "expo-web-browser",
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "Allow BrillPrime to use your location for nearby services and delivery tracking."
      }
    ],
    [
      "expo-local-authentication",
      {
        faceIDPermission: "Allow BrillPrime to use Face ID to secure your account."
      }
    ],
    [
      "expo-image-picker",
      {
        photosPermission: "Allow BrillPrime to access photos when you choose an image.",
        cameraPermission: "Allow BrillPrime to use the camera when you take a photo."
      }
    ],
    "expo-notifications",
    [
      "expo-build-properties",
      {
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
      projectId: easProjectId
    },
    // Firebase configuration pulled strictly from environment variables
    firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
    firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
    firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    firebaseMessagingSenderId:
      process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
      process.env.FIREBASE_MESSAGING_SENDER_ID ||
      '',
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