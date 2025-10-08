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

## Recent Changes

### October 08, 2025 - Social Authentication Implementation
- Implemented full social authentication (Google, Apple, Facebook) using Firebase Auth
- Added `signInWithGoogle()`, `signInWithApple()`, and `signInWithFacebook()` methods to authService
- Updated sign-in and sign-up pages to use functional social auth buttons instead of "Coming Soon" placeholders
- Integrated social auth with backend API at `https://api.brillprime.com`
- Social auth automatically sends Firebase UID, email, provider info, and user role to backend `/api/auth/social-login` endpoint
- Maintained role-based authentication flow - users must select role before social login
- All social auth methods properly handle errors, validate roles, and store authentication tokens
- Type system updated to support both traditional and social authentication flows

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