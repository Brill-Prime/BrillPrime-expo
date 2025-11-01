// app.config.js
// Load environment variables from .env file
import 'dotenv/config';

export default {
  expo: {
    name: "BrillPrime",
    slug: "brillprime",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    scheme: "brillprime",
    owner: "brill-prime",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.brillprime.app",
      googleServicesFile: "./ios/GoogleService-Info.plist"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.brillprime.app",
      googleServicesFile: "./android/app/google-services.json"
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-build-properties",
        {
          android: {
            compileSdkVersion: 34,
            targetSdkVersion: 34,
            buildToolsVersion: "34.0.0"
          },
          ios: {
            deploymentTarget: "15.1"
          }
        }
      ],
      "expo-secure-store",
      "expo-local-authentication",
      [
        "expo-updates",
        {
          "requestHeaders": {
            "expo-channel-name": "production"
          }
        }
      ],
      [
        "expo-barcode-scanner",
        {
          cameraPermission: "Allow BrillPrime to access camera for QR code scanning"
        }
      ],
      [
        "expo-calendar",
        {
          calendarPermission: "Allow BrillPrime to access calendar for delivery scheduling"
        }
      ],
      [
        "expo-contacts",
        {
          contactsPermission: "Allow BrillPrime to access contacts for merchant/driver integration"
        }
      ],
      [
        "@rnmapbox/maps",
        {
          RNMapboxMapsDownloadToken: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN,
          RNMapboxMapsVersion: "11.0.0"
        }
      ],
      "expo-location"
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
      // Firebase configuration with proper environment variable access
      firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyBAe9x-nOCzn8VA1oAP23y2Sv2sIiVyP0s",
      firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "brillprimefirebase.firebaseapp.com",
      firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "brillprimefirebase",
      firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "brillprimefirebase.firebasestorage.app",
      firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "655201684400",
      firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:655201684400:web:ec3ac485a4f98a82fb2475",
      firebaseDatabaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || "https://brillprimefirebase-default-rtdb.firebaseio.com",
      firebaseMeasurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-XXXXXXXXXX",
      // API configuration - use external API or Firebase
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || "https://api.brillprime.com",
      apiTimeout: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || "30000", 10)
    }
  }
};