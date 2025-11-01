
# BrillPrime Setup Guide

This guide will help you set up the BrillPrime Expo mobile application.

## Prerequisites

- Node.js >= 20.0.0
- Yarn package manager
- Expo CLI
- Firebase account (for backend services)

## Installation Steps

### 1. Clone and Install

```bash
# Navigate to the expo app directory
cd expo-app

# Install dependencies
yarn install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Configure the following environment variables in `.env`:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# API Configuration (if using external backend)
EXPO_PUBLIC_API_BASE_URL=https://api.brillprime.com
EXPO_PUBLIC_API_TIMEOUT=30000
```

### 3. Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable the following services:
   - Authentication (Email/Password, Google, Apple, Facebook)
   - Cloud Firestore
   - Cloud Storage
3. Add your Firebase credentials to `.env`
4. Configure authorized domains in Firebase Console

## Running the Application

### Web Development

```bash
cd expo-app
yarn web
```

The app will be available at `http://localhost:5000`

### Mobile Development

**Android:**
```bash
yarn android
```

**iOS:**
```bash
yarn ios
```

### Development Server

```bash
yarn start
```

This opens the Expo Dev Tools where you can:
- Run on iOS simulator
- Run on Android emulator
- Run on physical device via Expo Go app
- Open in web browser

## Port Configuration

- Port 5000: Expo web development server

## Troubleshooting

### Expo Issues

If Expo fails to start:
```bash
# Clear cache
npx expo start --clear

# Reinstall dependencies
rm -rf node_modules
yarn install

# Check Expo CLI version
npx expo --version
```

### Firebase Connection Issues

1. Verify all Firebase credentials in `.env`
2. Check Firebase Console for service status
3. Ensure authorized domains are configured
4. Review Firebase Console logs for errors

### Build Issues

```bash
# Clear Metro bundler cache
npx expo start --clear

# Reset project (careful - this modifies files)
yarn reset-project
```

## Available Scripts

- `yarn web` - Start web development server on port 5000
- `yarn android` - Start Android development
- `yarn ios` - Start iOS development
- `yarn start` - Start Expo development server
- `yarn build` - Build for web production
- `yarn test` - Run tests
- `yarn lint` - Run ESLint

## Next Steps

1. Configure Firebase services
2. Set up authentication providers
3. Review app configuration in `app.config.js`
4. Explore the codebase in `apps/expo-app/`

## Support

For issues and questions:
- Check `apps/expo-app/docs/` for detailed documentation
- Review troubleshooting guides
- Consult Expo documentation: https://docs.expo.dev
