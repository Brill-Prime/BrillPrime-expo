
// app.config.js
export default ({ config }) => {
  const variant = process.env.APP_VARIANT || "main";

  return {
    ...config,
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
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/logo.png",
        backgroundColor: "#FFFFFF"
      }
    },
    web: {
      favicon: "./assets/images/logo.png",
      bundler: "webpack"
    },
    plugins: [
      "expo-router",
      "expo-web-browser"
    ],
    entryPoint:
      variant === "admin"
        ? "./app/admin-panel.tsx"
        : "./app/main-app.tsx",
    platforms: variant === "admin" ? ["web"] : ["ios", "android", "web"],
  };
};
