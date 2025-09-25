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

### September 25, 2025 - Replit Environment Setup Completed
- Successfully imported GitHub project into Replit environment
- Installed all required dependencies using npm install
- Configured Expo development server to run on port 5000 with proper host settings for Replit proxy
- Set up production deployment configuration with autoscale target
- Verified application runs successfully in development mode
- Build system tested and working (expo export generates dist folder)
- Application successfully loads with onboarding flow for new users

### Replit Integration Status
- **Development Server**: Running on port 5000 with Expo dev server
- **Build Command**: `npm run build` (expo export --platform web)
- **Deployment**: Configured for autoscale with serve static files
- **Dependencies**: All packages installed and compatible
- **Workflow**: Frontend workflow running successfully