
// app.config.js
export default ({ config }) => {
  const variant = process.env.APP_VARIANT || "main";

  return {
    ...config,
    extra: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      googleMapsAndroidApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY,
      googleMapsIosApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY,
    },
    name: variant === "admin" ? "Brill Prime Admin" : "Brill Prime",
    slug: variant === "admin" ? "brill-prime-admin" : "brill-prime",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/logo.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/images/logo.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/logo.png",
        backgroundColor: "#FFFFFF"
      },
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY
        }
      }
    },
    web: {
      favicon: "./assets/images/logo.png",
      bundler: "metro",
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      }
    },
    plugins: [
      "expo-router",
      "expo-web-browser"
    ],
    entryPoint:
      variant === "admin"
        ? "./app/admin-panel/admin-panel.tsx"
        : "./app/main-app/main-app.tsx",
    platforms: variant === "admin" ? ["web"] : ["ios", "android", "web"],
  };
};
