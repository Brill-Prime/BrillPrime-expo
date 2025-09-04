# Overview

BrillPrime is a cross-platform mobile application built with Expo and React Native that serves as a multi-role marketplace ecosystem. The app supports three distinct user types: consumers (shoppers), merchants (sellers), and drivers (delivery partners). The application features a comprehensive onboarding flow, role-based authentication, and dedicated dashboards for each user type. Additionally, it includes a separate admin panel variant that can be deployed independently for administrative management.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The application uses Expo Router for file-based navigation and React Native for cross-platform mobile development. The project supports two deployment variants:
- Main app: Multi-platform (iOS, Android, Web) for end users
- Admin panel: Web-only deployment for administrative functions

## Navigation Structure
- **Splash Screen**: Initial loading screen with user status detection
- **Onboarding Flow**: Three-screen introduction for first-time users
- **Authentication System**: Role selection, sign up, sign in, OTP verification, and password reset
- **Role-based Dashboards**: Separate interfaces for consumers, merchants, and drivers
- **Admin Panel**: Standalone administrative interface

## State Management and Data Persistence
The app uses AsyncStorage for local data persistence, managing:
- User authentication tokens
- User profile information (email, role)
- Onboarding completion status
- Session management

## Authentication Flow
Multi-step authentication process:
1. Role selection (consumer/merchant/driver)
2. Registration with form validation
3. OTP verification (simulated for demo)
4. Dashboard access based on user role

The system includes password reset functionality with email-based recovery flow.

## UI/UX Design System
- Linear gradients for visual appeal and branding
- Role-specific color schemes and iconography
- Responsive design supporting multiple screen sizes
- Consistent styling patterns across components

## Cross-Platform Compatibility
Built with Expo SDK 53 and React Native 0.79, supporting:
- iOS native apps
- Android native apps  
- Web applications
- Development builds and Expo Go

# External Dependencies

## Core Framework
- **Expo SDK 53**: Cross-platform development framework
- **React Native 0.79**: Mobile app development framework
- **Expo Router 5**: File-based navigation system

## Navigation and UI
- **React Navigation**: Navigation components and stack management
- **Expo Linear Gradient**: Gradient backgrounds for visual design
- **Expo Vector Icons**: Icon library for UI elements

## Device and Platform APIs
- **AsyncStorage**: Local data persistence and session management
- **Expo Haptics**: Touch feedback for user interactions
- **Expo Status Bar**: Status bar customization
- **React Native Safe Area Context**: Safe area handling across devices

## Authentication and Security
- **React Native OTP Verify**: OTP verification functionality
- **React Native Get Random Values**: Secure random number generation

## Additional Utilities
- **Expo Constants**: App configuration and environment variables
- **Expo Linking**: Deep linking and URL handling
- **Expo Web Browser**: In-app browser functionality
- **React Native WebView**: Embedded web content display

## Development Tools
- **TypeScript**: Type safety and development experience
- **ESLint**: Code quality and consistency
- **Jest**: Testing framework setup