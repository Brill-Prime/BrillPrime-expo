# Brill Prime Mobile Application

## Overview

Brill Prime is a multi-role mobile application built with React Native and Expo. It serves as a financial service platform supporting three distinct user types: Consumers, Merchants, and Drivers. The application features a complete onboarding flow, role-based authentication, and dedicated dashboards for each user type. Additionally, it includes an admin panel variant that can be deployed separately for web-based administration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Mobile Framework
- **React Native with Expo**: Cross-platform mobile development framework enabling iOS, Android, and web deployment from a single codebase
- **Expo Router**: File-based routing system for navigation between screens
- **TypeScript Support**: Type-safe development environment

### Application Structure
- **Multi-variant Architecture**: Supports both main app and admin panel variants through environment-based configuration
- **File-based Routing**: Screen components organized in logical directories (`/auth`, `/onboarding`, `/dashboard`)
- **Role-based UI**: Dynamic interface adaptation based on user roles (consumer, merchant, driver)

### State Management
- **AsyncStorage**: Local data persistence for user preferences, authentication tokens, and onboarding status
- **React Hooks**: Component-level state management using useState and useEffect

### User Experience Flow
1. **Splash Screen**: Animated logo display with automatic navigation based on user status
2. **Onboarding**: Three-screen introduction sequence for new users
3. **Role Selection**: User type selection (Consumer, Merchant, Driver)
4. **Authentication**: Sign up/Sign in flows with validation
5. **Role-specific Dashboards**: Customized interfaces for each user type

### Authentication System
- **Token-based Authentication**: Mock authentication system with AsyncStorage token management
- **Password Reset Flow**: Complete forgot password, OTP verification, and password reset sequence
- **Role Persistence**: User role storage and retrieval for dashboard routing

### UI/UX Design Patterns
- **Gradient Backgrounds**: Linear gradients for visual appeal and role differentiation
- **Animated Transitions**: Smooth navigation between screens
- **Responsive Design**: Adaptive layouts for different screen sizes
- **Icon Integration**: Expo Vector Icons for consistent iconography

## External Dependencies

### Core Framework Dependencies
- **Expo SDK**: Complete development platform for React Native applications
- **React Native**: Mobile app development framework
- **Expo Router**: Navigation and routing solution
- **Expo Linear Gradient**: Gradient background support
- **Expo Vector Icons**: Icon library integration

### Storage Solutions
- **AsyncStorage**: Local key-value storage for user data, preferences, and authentication state

### Development Tools
- **ESLint**: Code quality and consistency enforcement
- **TypeScript**: Type checking and development enhancement

### Platform Support
- **iOS**: Native iOS application support
- **Android**: Native Android application support
- **Web**: Web browser compatibility for admin panel variant

### Configuration Management
- **Environment Variables**: APP_VARIANT for distinguishing between main app and admin panel builds
- **Dynamic App Configuration**: Role-based entry points and platform targeting

## Backend & Firebase Configuration

### Full-Stack Development Setup
- **Backend Server**: Node.js/Express running on port 3000 (`apps/backend/`)
- **Frontend Server**: Expo web running on port 5000 (`apps/expo-app/`)
- **Workflow**: Both servers start together via "Brill Prime Full Stack" workflow
- **API Connection**: Frontend configured to connect to `http://localhost:3000` in development
- **Configuration Files**:
  - Backend config: `apps/backend/.env` (PORT=3000)
  - Frontend API client: `apps/expo-app/services/api.ts`
  - OAuth service: `apps/expo-app/services/oauth.js`
  - Environment config: `apps/expo-app/config/environment.js`

### API Backend
- **Development URL**: `http://localhost:3000` (local Node.js backend)
- **Production URL**: `https://api.brillprime.com` (to be configured)
- **Configuration**: Configured in `config/environment.ts` and `services/api.ts`
- **API Timeout**: 60 seconds for development, 30 seconds for production
- **Authentication**: JWT token-based authentication with refresh token support

### Firebase Connection
- **Status**: ✅ Connected using vault credentials
- **Project**: Firebase project configured with web SDK
- **Services Used**:
  - Firebase Authentication (email/password, social providers)
  - Cloud Firestore (database)
  - Cloud Storage
- **Environment Variables**: All Firebase credentials stored securely in Replit secrets vault
  - EXPO_PUBLIC_FIREBASE_API_KEY
  - EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
  - EXPO_PUBLIC_FIREBASE_PROJECT_ID
  - EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
  - EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  - EXPO_PUBLIC_FIREBASE_APP_ID

## Recent Changes

### October 30, 2025 - Full-Stack Backend Integration
- **Backend Integration**: Connected Expo app to local Node.js backend server
- **Dual Server Setup**: Backend (port 3000) + Expo web (port 5000) running concurrently
- **Workflow Configuration**: Single "Brill Prime Full Stack" workflow runs both servers
- **API Service Updates**:
  - Signup screen now uses real backend API (`/api/auth/register`)
  - Sign-in screen uses real backend API (`/api/auth/login`)
  - JWT token storage with refresh token support
  - User data persistence (ID, role, email) in AsyncStorage
- **OAuth Service Created**: Complete OAuth integration layer for Google, Apple, Facebook
- **Environment Configuration**: Centralized config for dev/production API URLs
- **Dependencies Installed**:
  - Backend: 1663 packages (Express, TypeScript, Drizzle ORM, etc.)
  - Frontend: 1764 packages (Expo, React Native, etc.)
- **Node.js Module**: nodejs-20 installed for workflow environment
- **Database**: PostgreSQL (Supabase) configured for backend

### October 09, 2025 - Complete API Integration
- **Firebase Integration**: Connected app to Firebase using secure vault credentials
- **Backend API**: All services now integrated with api.brillprime.com
- **Merchant Service**: Migrated from axios to apiClient for consistency
- **Communication Service**: Updated WebSocket URL from localhost to wss://api.brillprime.com/ws
- **Service Verification**: Confirmed all 11 services are properly connected with authentication
- **Dependencies**: Installed all npm dependencies (1324 packages)
- **Status**: Development server running successfully on port 5000

### Services Connected to Backend:
1. ✅ Authentication Service - Firebase + Backend API
2. ✅ User Service - Profile and settings management
3. ✅ Merchant Service - Merchant and commodity management
4. ✅ Order Service - Order creation and tracking
5. ✅ Payment Service - Payment processing and transactions
6. ✅ Cart Service - Shopping cart management
7. ✅ Location Service - Location tracking and nearby merchants
8. ✅ Notification Service - Push notifications and preferences
9. ✅ KYC Service - Know Your Customer verification
10. ✅ Communication Service - Real-time chat and calls (WebSocket)
11. ✅ Admin Service - Admin operations and analytics

**Documentation**: See `docs/api-integration-summary.md` for complete API endpoint reference

### October 08, 2025 - Social Authentication Implementation
- Implemented full social authentication (Google, Apple, Facebook) using Firebase Auth
- Added `signInWithGoogle()`, `signInWithApple()`, and `signInWithFacebook()` methods to authService
- Updated sign-in and sign-up pages to use functional social auth buttons instead of "Coming Soon" placeholders
- Integrated social auth with backend API at `https://api.brillprime.com`
- Social auth automatically sends Firebase UID, email, provider info, and user role to backend `/api/auth/social-login` endpoint
- Maintained role-based authentication flow - users must select role before social login
- All social auth methods properly handle errors, validate roles, and store authentication tokens
- Type system updated to support both traditional and social authentication flows
- **API Endpoints Fixed**: Updated to match backend expectations (`/api/auth/signup` and `/api/auth/signin`)
- **Firebase Config**: Using brillprimefirebase project with valid credentials

### Firebase Configuration Requirements
**Important**: To enable social authentication, configure Firebase Console:
1. Add authorized domain in Firebase Console → Authentication → Settings → Authorized domains:
   - Replit domain: `8ccdf747-ee96-4994-a1c9-a4efe9a653ef-00-3isb1t4b1rif8.janeway.replit.dev`
   - Production domain (when deployed)
2. Enable social auth providers in Firebase Console → Authentication → Sign-in method:
   - Google Sign-In
   - Apple Sign-In (requires Apple Developer setup)
   - Facebook Sign-In (requires Facebook App credentials)
3. Configure OAuth consent screen and app credentials for each provider

### October 01, 2025 - Fresh GitHub Clone Setup
- Successfully set up fresh GitHub clone in Replit environment
- Installed all npm dependencies (1321 packages)
- Updated Metro config with CORS middleware to support Replit's proxy environment
- Configured development server to run on port 5000 with proper host settings (0.0.0.0:5000)
- Created .gitignore file for proper git repository management
- Verified frontend workflow runs successfully with proper onboarding flow
- Tested build process successfully (expo export generates dist folder)
- Configured deployment with autoscale target for production
- Application fully functional and ready for development

### Replit Integration Status
- **Development Server**: Running on port 5000 with Expo dev server
- **Host Configuration**: 0.0.0.0 binding with CORS headers for Replit proxy
- **Build Command**: `npm run build` (expo export --platform web)
- **Deployment**: Configured for autoscale with serve static files from dist folder (port 5000)
- **Dependencies**: All packages installed and compatible (1321 packages)
- **Workflow**: Frontend workflow running successfully
- **Production Command**: `npx serve dist -s -l 5000` for static file serving

### Development Environment
- **Metro Bundler**: Configured with enhanced middleware and CORS support for Replit proxy
- **Asset Support**: Full support for images, fonts, SVG, and other static assets
- **Console Logging**: Browser console logs available for debugging
- **Hot Reload**: Development server supports real-time updates