# Brill Prime - React Native Expo Application

## Overview
Brill Prime is a multi-role React Native application built with Expo for web deployment. It supports three user roles: Consumer, Merchant, and Driver, with comprehensive authentication and backend integration. The project aims to provide a robust, scalable platform for a service marketplace, featuring role-based access control, real-time tracking, and secure payment processing.

## User Preferences
- Backend URL: https://api.brillprime.com (Production)
- Uses Firebase for authentication
- Supports multi-role architecture (Consumer, Merchant, Driver)
- Web-optimized React Native application

## System Architecture

### UI/UX Decisions
The application uses a consistent design system with a centralized theme, applying specific colors (#4682B4 primary, #0B1A51 primaryDark) and the Montserrat font family. Standardized spacing, border radius, and shadows are used throughout for a consistent UI/UX.

### Technical Implementations
- **Frontend**: React Native with Expo (Web-optimized)
- **Navigation**: Expo Router
- **State Management**: React Query (@tanstack/react-query)
- **Authentication**: Hybrid architecture using Firebase Auth for initial authentication (email/password, Google, Facebook, Apple) and Supabase for all backend operations (database, edge functions, realtime). User data is synchronized between Firebase and Supabase.
- **Styling**: React Native with a custom theme.
- **Maps**: React Native Maps with Google Maps API. Web maps use Leaflet.
- **Payment**: Paystack integration.
- **Multi-Role Access Control**: Implemented with a `UserRoleStatus` interface and `RoleManagementService` for registration, verification, and switching. `withRoleAccess` HOC protects role-specific routes.
- **Driver Tracking System**: Client-side simulated real-time tracking with smooth animations, Haversine formula for distance/ETA, two-phase delivery, auto-zoom, live updates, and arrival notifications.
- **Profile Photo Upload**: Supports multipart/form-data uploads to the backend.

### Feature Specifications
- **Multi-Role Authentication & Access Control**: Consumer, Merchant, Driver roles with strict boundaries, verification requirements, social logins, OTP verification, password reset, and role switching.
- **Core Modules**: Location-based merchant discovery, order management, real-time communication (chat & calls), payment processing, KYC verification, and an admin dashboard.
- **Driver Tracking System**: Simulated real-time tracking, distance & ETA calculations, auto-zoom, live updates, and arrival notifications.

### System Design Choices
- **Hybrid Backend Architecture**: Firebase for authentication, Supabase for backend operations (database, edge functions, realtime).
- **Environment Variables**: Extensive use of environment variables for API configuration, Google Maps keys, and Firebase credentials for web, iOS, and Android platforms.
- **Workflow**: Configured for Replit environment, running web app on port 5000.

## External Dependencies

- **API Backend**: `https://api.brillprime.com` (Production API)
- **Authentication**:
    - Firebase Auth
    - Supabase (for database, edge functions, realtime features)
- **Mapping Services**:
    - Google Maps API (for native maps)
    - Leaflet (for web maps)
- **Payment Gateway**: Paystack
- **Package Manager**: npm
- **Core Libraries**:
    - React Native
    - Expo
    - Expo Router
    - @tanstack/react-query
    - @react-native-community/netinfo