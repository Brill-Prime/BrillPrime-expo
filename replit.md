# BrillPrime Expo Mobile Application - Replit Setup

## Overview
BrillPrime is a cross-platform mobile marketplace application built with React Native and Expo, featuring multi-role support for Consumers, Merchants, and Drivers.

**Last Updated**: November 1, 2025  
**Status**: ✅ Configured and Running on Replit

## Project Structure
- **Technology**: Expo ~54.0.21, React Native, TypeScript
- **Routing**: Expo Router (file-based routing)
- **Authentication**: Firebase Authentication
- **Database**: Firebase + Supabase (optional)
- **Maps**: Mapbox (mobile) / Leaflet (web)
- **Port**: 5000 (web development server)

## Quick Start

### Running the App
The app is configured to run automatically via the "Start Expo App" workflow.

```bash
# Automatically starts on Replit using the workflow
# Or manually:
cd apps && yarn web
```

### Key Configuration

#### Memory Optimization
The project has been optimized for Replit's environment:
- **Metro config**: Single worker (`maxWorkers: 1`)
- **Memory limit**: 2048MB (`NODE_OPTIONS='--max-old-space-size=2048'`)
- **Build optimization**: Excludes heavy native modules for web platform
- **Blocked modules**: @rnmapbox/maps, react-native-maps (web only)

#### Environment Variables
The app uses the following environment variables (set in `.env`):

**Firebase Configuration** (Frontend):
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_FIREBASE_DATABASE_URL`

**Backend API** (Optional):
- `EXPO_PUBLIC_API_BASE_URL` - Backend API URL (default: http://localhost:3000)

**Supabase** (Optional):
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

**Maps**:
- `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` - For Mapbox maps

## Architecture

### Frontend (Port 5000)
- **Framework**: Expo + React Native Web
- **Bundler**: Metro (optimized for Replit)
- **Dev Server**: Expo CLI with host binding to `0.0.0.0:5000`
- **Proxy Support**: Configured to allow Replit's proxy environment

### Backend (Not Included)
The app is frontend-only and connects to:
- Firebase for authentication and real-time data
- External API (configurable via `EXPO_PUBLIC_API_BASE_URL`)
- See `apps/BACKEND_IMPLEMENTATION_GUIDE.md` for API specifications

## Development

### Folder Structure
```
apps/
├── app/              # Screen components (file-based routing)
├── components/       # Reusable UI components
├── services/         # API integration & backend services
├── contexts/         # React Context providers
├── hooks/           # Custom React hooks
├── utils/           # Helper functions
├── config/          # Configuration files
├── assets/          # Images, fonts, icons
└── types/           # TypeScript definitions
```

### Key Features
- **Multi-Role System**: Consumer, Merchant, Driver
- **Authentication**: Email, Google, Apple, Facebook
- **Shopping**: Cart, checkout, order tracking
- **Real-time**: Order updates, messaging
- **KYC**: Document verification for merchants/drivers
- **Location**: Merchant discovery, delivery tracking

## Replit-Specific Configurations

### Metro Config Optimizations
Located in `apps/metro.config.js`:
- Single worker to prevent OOM errors
- Blocks heavy native-only modules for web
- URL rewriting for Replit proxy support

### Package Scripts
- `yarn web` - Start optimized dev server (port 5000)
- `yarn web-dev` - Lightweight dev mode (minified)
- `yarn build` - Production build with memory constraints

### Workflow Configuration
**Name**: Start Expo App  
**Command**: `cd apps && yarn web`  
**Port**: 5000  
**Output**: webview  

The workflow automatically:
1. Sets memory limits via NODE_OPTIONS
2. Configures Metro for single-worker mode
3. Binds to 0.0.0.0:5000 for Replit proxy
4. Enables LAN host mode for proper routing

## Deployment

The application is configured to run on Replit with optimized settings for the platform. For production deployment:

1. **Build the app**:
   ```bash
   cd apps && yarn build
   ```

2. **Deploy options**:
   - Replit Deployments (recommended for web version)
   - Expo EAS Build (for mobile apps)
   - Static hosting (for web-only)

### Deployment Configuration
The app uses:
- **Target**: autoscale (for web)
- **Run command**: `cd apps && yarn web`
- **Port**: 5000
- **Output**: Static web bundle

## Troubleshooting

### OOM Errors During Build
If you encounter "Killed" or exit code 137:
- The workflow is already optimized with `maxWorkers: 1`
- Ensure `NODE_OPTIONS='--max-old-space-size=2048'` is set
- Check `apps/metro.config.js` has proper module exclusions

### Web App Not Loading
1. Check workflow status in Replit
2. Verify port 5000 is bound correctly
3. Check browser console for errors
4. Ensure environment variables are set

### Firebase Errors
- Verify all `EXPO_PUBLIC_FIREBASE_*` variables are set
- Check Firebase Console for service status
- Ensure authorized domains include your Replit URL

### Supabase Warnings
Supabase is optional. The app falls back to Firebase-only mode if:
- `EXPO_PUBLIC_SUPABASE_URL` is not set
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` is not set

This is expected behavior and not an error.

## Known Issues

### CSS Import Warnings (Leaflet)
You may see warnings about "Importing local resources in CSS is not supported" for Leaflet images. These are non-fatal and don't affect functionality.

### Package Version Mismatches
The project shows package version warnings. These are informational and the app works correctly with the current versions.

## Performance

### Optimizations Applied
- Single Metro worker to prevent memory spikes
- Excluded heavy native modules (@rnmapbox, react-native-maps) on web
- Reduced memory allocation (2048MB vs 4096MB)
- Minification disabled in dev mode for faster builds
- Asset bundling optimized for web platform

### Build Times
- Initial build: ~90-120 seconds
- Hot reload: ~5-10 seconds
- Full rebuild: ~60-90 seconds

## Resources

- **Main Documentation**: `README.md`
- **API Guide**: `apps/BACKEND_IMPLEMENTATION_GUIDE.md`
- **Expo Docs**: https://docs.expo.dev
- **React Native Web**: https://necolas.github.io/react-native-web/

## Support

For issues with the Replit environment:
1. Check workflow logs for errors
2. Verify environment variables
3. Restart the workflow
4. Check memory usage during builds

---

**Project Type**: React Native / Expo Web Application  
**Primary Language**: TypeScript  
**Package Manager**: Yarn 1.22.22
