# Brill Prime

Brill Prime is an Expo / React Native application with web support for consumer, merchant, and driver workflows.

## Getting started
1. Install the Node.js version expected by the repository/CI.
2. Run npm ci to install dependencies from the lockfile.
3. Copy .env.example to a local environment file and add only public client configuration needed for development. Never put service-account private keys, database passwords, admin credentials, or other privileged secrets in the mobile app environment.
4. Start with npm start, or use the scripts below.

## Useful commands
- npm start — start Expo.
- npm run web — start the web target on port 5000 using the repository launcher.
- npm run start:android — start the Android development workflow.
- npm run typecheck — run TypeScript checks.
- npm test -- --runInBand — run Jest tests serially.
- npx expo-doctor — inspect Expo configuration and dependency compatibility.

Use an Expo development build for native modules not available in Expo Go. Review EAS configuration before development, preview, or production builds.

## Architecture notes
- app/ — Expo Router routes and screens.
- contexts/ — shared app, authentication, merchant, notification, and theme state.
- services/ — API and domain service modules.
- components/ — shared UI components.
- config/ — client configuration.
- docs/ — project documentation and operational notes.

This is a living overview; verify route/service ownership in source before architectural changes.

## Quality and release safety
- Keep visual/UI changes out of stability-only patches.
- Do not commit populated environment files or credentials.
- Validate auth/session behavior for consumer, merchant, and driver roles.
- Run typecheck, tests, and Expo Doctor before promoting a build.
- Test checkout and order lifecycle against a non-production backend before production.

See docs/STABILITY_REMEDIATION_PLAN.md for phased fixes and exit criteria.
