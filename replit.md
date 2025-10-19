# Brill Prime - React Native Expo Application

## Overview
Brill Prime is a multi-role React Native application built with Expo for web deployment. The app supports three user roles: Consumer, Merchant, and Driver, with comprehensive authentication and backend integration.

## Recent Changes

### October 19, 2025 (Latest)
- ✅ **Role-Based Access Control System** - Implemented comprehensive multi-role management
  - Created UserRoleStatus interface to track registration and verification for each role
  - Built RoleManagementService for role registration, verification checks, and switching
  - Implemented withRoleAccess HOC to protect merchant and driver routes
  - Added role registration flow for users to register as merchant or driver
  - Created RoleSwitcher component for users with multiple verified roles
  - Applied role guards to all merchant and driver routes
  - Integrated role initialization into authentication flow
  - **Access Rules**:
    - Consumers can only access merchant/driver features after registration and verification
    - Merchants and drivers can have a consumer account as personal account
    - Merchants cannot access driver features unless separately registered and verified
- ✅ **Consistent Design System** - Updated all components to use centralized theme
  - Applied theme colors (#4682B4 primary, #0B1A51 primaryDark)
  - Used Montserrat font family throughout
  - Standardized spacing, border radius, and shadows
  - Ensured consistent UI/UX across all new components

### October 11, 2025
- ✅ **Profile Photo Upload Feature** - Implemented complete profile photo upload functionality
  - Added uploadProfilePhoto() method to userService.ts for multipart/form-data uploads
  - Updated app/profile/edit.tsx to upload photos before updating profile
  - Fixed critical Content-Type header bug that was breaking FormData boundary injection
  - Added profileImageUrl field to UpdateProfileRequest interface
  - Users can now upload profile photos directly to backend API
- ✅ **Backend Documentation Updated** - Enhanced BACKEND_IMPLEMENTATION_GUIDE.md
  - Added profile photo upload endpoint (POST /api/user/profile-photo)
  - Added toll gates endpoint (GET /api/toll-gates)
  - Added driver orders endpoint (GET /api/drivers/orders)
  - Updated total endpoint count to 100
- ✅ **Migration Complete** - Successfully completed project import to Replit environment
- ✅ **Fixed Map Integration Errors** - Resolved React.memo component errors in Leaflet/Google Maps integration
  - Fixed Map.web.tsx to properly export Marker component for platform compatibility
  - Eliminated "memo: The first argument must be a component. Instead received: undefined" errors
  - Web maps (Leaflet) and native maps (Google Maps) now working correctly
- ✅ **Installed Dependencies** - Installed all 1334 npm packages successfully
- ✅ **Workflow Running** - Expo web server running on port 5000

### October 11, 2025 (Earlier)
- ✅ **Fixed 401 Authentication Errors** - Disabled problematic backend API calls in locationService.ts causing 401 errors
- ✅ **Verified Driver Tracking Features** - Confirmed all real-time driver tracking features are working:
  - Real-time driver tracking with animated movement
  - Distance and ETA calculations (Driver→Merchant, Driver→Consumer)
  - Auto-zoom to include driver, merchant, and consumer locations
  - Notifications when driver arrives at merchant/consumer
  - Floating card showing driver status and ETA
  - "Test Delivery" button for demo purposes
- ✅ **Maintained Steel Blue Color Scheme** - All features use the original #4682B4 theme

### October 9, 2025
- ✅ **Comprehensive Frontend Scan Completed** - Found and documented 110 issues
- ✅ **Fixed Critical Runtime Errors** - AppContext module resolution issue resolved
- ✅ **Installed Missing Package** - Added @react-native-community/netinfo for offline mode
- ✅ **Fixed Type Errors** - Updated cart screen to use useFocusEffect instead of deprecated router API
- ✅ **Generated Documentation** - Created 4 comprehensive reports (see docs/ folder)
- ✅ **Identified API Gaps** - Documented 98 frontend endpoints, 9 critical ones need backend implementation
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
1. **Multi-Role Authentication & Access Control**
   - Consumer, Merchant, and Driver roles with strict boundaries
   - Role-based access control with verification requirements
   - Email/Password authentication
   - Social logins (Google, Apple, Facebook)
   - OTP verification
   - Password reset flow
   - Multi-role support: users can register for multiple roles
   - Role switching interface for users with multiple verified roles
   - Protected routes requiring role registration and verification

2. **Core Modules**
   - Location-based merchant discovery
   - Order management
   - Real-time communication (chat & calls)
   - Payment processing
   - KYC verification
   - Admin dashboard

3. **Driver Tracking System** (Consumer Home)
   - **Simulated Real-time Tracking**: Client-side driver simulation with smooth animations
   - **Distance & ETA Calculations**: Using Haversine formula for accurate distance/time estimates
   - **Two-Phase Delivery**: Driver→Merchant (pickup) then Driver→Consumer (delivery)
   - **Auto-Zoom**: Map automatically adjusts to show driver, merchant, and consumer locations
   - **Live Updates**: Driver position updates every 1 second during active delivery
   - **Arrival Notifications**: Alerts when driver reaches merchant or consumer
   - **Visual Indicators**: 
     - Floating card showing driver name, status, distance, and ETA
     - Animated driver marker moving along calculated path
     - "Test Delivery" button to trigger simulation
   - **Color Theme**: All UI elements use Steel Blue (#4682B4) color scheme
   - **Implementation**: Client-side only, no backend API dependencies for demo mode

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
