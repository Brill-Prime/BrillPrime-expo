# Brill Prime - React Native Expo Application

## Overview
Brill Prime is a multi-role React Native application built with Expo for web deployment. The app supports three user roles: Consumer, Merchant, and Driver, with comprehensive authentication and backend integration.

## Recent Changes (October 9, 2025)
- ✅ Completed project migration to Replit environment
- ✅ Installed all required npm dependencies
- ✅ Configured Firebase authentication with environment variable support
- ✅ Verified backend API connectivity (https://api.brillprime.com)
- ✅ Authentication system fully integrated and operational

## Project Architecture

### Tech Stack
- **Frontend**: React Native with Expo (Web-optimized)
- **Navigation**: Expo Router
- **State Management**: React Query (@tanstack/react-query)
- **Authentication**: Firebase Auth + Custom Backend
- **Styling**: React Native with custom theme
- **Maps**: React Native Maps with Google Maps API
- **Payment**: Paystack integration

### Key Features
1. **Multi-Role Authentication**
   - Consumer, Merchant, and Driver roles
   - Email/Password authentication
   - Social logins (Google, Apple, Facebook)
   - OTP verification
   - Password reset flow

2. **Core Modules**
   - Location-based merchant discovery
   - Order management
   - Real-time communication (chat & calls)
   - Payment processing
   - KYC verification
   - Admin dashboard

## Authentication System

### Backend API Configuration
- **Base URL**: `https://api.brillprime.com` (Production)
- **Status**: ✅ Live and accessible
- **API Timeout**: 30 seconds

### Authentication Endpoints
```
POST /api/auth/signup - User registration
POST /api/auth/signin - User login
POST /api/auth/social-login - Social authentication
POST /api/auth/verify-otp - OTP verification
POST /api/auth/resend-otp - Resend OTP
POST /api/password-reset/request - Request password reset
POST /api/password-reset/verify-code - Verify reset code
POST /api/password-reset/complete - Complete password reset
GET  /api/auth/profile - Get user profile
POST /api/jwt-tokens/logout - User logout
```

### Authentication Flow
1. **Role Selection**: User selects role (Consumer/Merchant/Driver)
2. **Sign Up/Sign In**: 
   - Firebase authentication first
   - Backend API call with Firebase UID
   - Token and user data stored in AsyncStorage
3. **OTP Verification**: Email verification for new users
4. **Session Management**: JWT token with expiry tracking
5. **Auto-logout**: On token expiration

### Firebase Configuration

#### Web Platform
Firebase credentials are configured via environment variables (required):
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_DATABASE_URL`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID`

#### iOS Platform
- Config File: `ios/GoogleService-Info.plist` ✅
- Project ID: `brillprime`
- Bundle ID: `com.brillprime`

#### Android Platform
- Config File: `android/app/google-services.json` ✅
- Project ID: `brillprime`
- Package: `com.brillprime`

**Note**: Currently using different Firebase projects for web vs mobile. For seamless auth across platforms, consider using the same Firebase project for all platforms.

## Environment Setup

### Required Environment Variables
```bash
# API Configuration
API_BASE_URL=https://api.brillprime.com
EXPO_PUBLIC_API_TIMEOUT=30000

# Google Maps
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here

# Firebase Web (REQUIRED - No fallbacks)
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Feature Flags
EXPO_PUBLIC_ENABLE_ANALYTICS=true
EXPO_PUBLIC_ENABLE_CRASH_REPORTING=true
```

**Important**: All Firebase environment variables are required for web platform. The app will fail to start if any are missing.

## Development Workflow

### Running the Application

#### Web (Current)
```bash
npm install          # Install dependencies
npm run web          # Start development server on port 5000
```

#### iOS (Requires Mac + Xcode)
```bash
npm run ios          # Run on iOS simulator
```

#### Android (Requires Android Studio/Emulator)
```bash
npm run android      # Run on Android emulator
```

#### Development Mode (All Platforms)
```bash
npm start            # Start Expo dev server
# Scan QR code with Expo Go app on your phone
```

The web app is configured to run on port 5000 for browser access.

### Workflow Configuration
- **Name**: Frontend
- **Command**: `npm run web`
- **Port**: 5000
- **Output**: Webview

## Project Structure
```
/
├── app/                    # Expo Router pages
│   ├── auth/              # Authentication screens
│   ├── home/              # Role-based home screens
│   ├── admin/             # Admin dashboard
│   └── ...
├── components/            # Reusable components
├── services/             # API services
│   ├── authService.ts    # Authentication logic
│   ├── api.ts            # API client
│   ├── orderService.ts   # Order management
│   └── ...
├── config/               # Configuration files
│   ├── environment.ts    # Environment config
│   ├── firebase.ts       # Firebase setup
│   └── theme.ts          # App theme
├── hooks/                # Custom React hooks
│   ├── useAuth.ts        # Authentication hook
│   └── ...
└── utils/                # Utility functions
```

## User Preferences
- Backend URL: https://api.brillprime.com (Production)
- Uses Firebase for authentication
- Supports multi-role architecture (Consumer, Merchant, Driver)
- Web-optimized React Native application

## Testing Authentication

### Test the Auth Flow
1. Navigate to the app (running on port 5000)
2. Select a role (Consumer/Merchant/Driver)
3. Try signing up with email/password
4. Verify OTP if required
5. Test sign-in with existing credentials
6. Test password reset flow
7. Optionally test social logins

### Backend Health Check
```bash
curl https://api.brillprime.com/health
# Expected: {"message":"Brill Backend API is running!","status":"success"}
```

## Next Steps
1. ✅ Authentication system is ready
2. Test social login integrations if needed
3. Configure additional features (payments, maps, etc.)
4. Set up production deployment
5. Test all user flows end-to-end

## Troubleshooting

### Common Issues
1. **Port 5000 not accessible**: Ensure workflow is running and restart if needed
2. **Backend API errors**: Verify https://api.brillprime.com is accessible
3. **Firebase auth errors**: Check Firebase configuration in config/firebase.ts
4. **Token expiry**: Implement token refresh logic if needed

## Support & Documentation
- Backend API Status: https://api.brillprime.com/health
- Firebase Console: https://console.firebase.google.com
- Expo Documentation: https://docs.expo.dev
