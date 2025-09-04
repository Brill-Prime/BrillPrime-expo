
// app.config.js
export default ({ config }) => {
  const variant = process.env.APP_VARIANT || "main";

  return {
    ...config,
    name: variant === "admin" ? "Brill Prime Admin" : "Brill Prime",
    slug: variant === "admin" ? "brill-prime-admin" : "brill-prime",
    entryPoint:
      variant === "admin"
        ? "./apps/admin-panel/App.tsx"
        : "./apps/main-app/App.tsx",
    platforms: variant === "admin" ? ["web"] : ["ios", "android", "web"],
  };
};
