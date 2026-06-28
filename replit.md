# Brill Prime - React Native Expo Application

## Overview
Brill Prime is a multi-role React Native application built with Expo for web deployment, supporting Consumer, Merchant, and Driver roles. It features comprehensive authentication, real-time capabilities, and robust backend integration. The project aims to provide a scalable and efficient platform for various user interactions in a service-oriented ecosystem.

## User Preferences
- Backend URL: https://api.brillprime.com (Production)
- Uses Firebase for authentication
- Supports multi-role architecture (Consumer, Merchant, Driver)
- Web-optimized React Native application

## System Architecture

### UI/UX Decisions
The application uses a consistent design system with a primary color of `#4682B4` (Steel Blue) and `#0B1A51` (primaryDark), Montserrat font family, standardized spacing, border radius, and shadows for a unified user experience.

### Technical Implementations
- **Frontend**: React Native with Expo, optimized for web.
- **Navigation**: Expo Router for declarative routing.
- **State Management**: React Query (`@tanstack/react-query`) for data fetching, caching, and state synchronization.
- **Authentication**: Hybrid approach using Firebase Auth for initial authentication (email/password, social logins) and Supabase for backend user data management and synchronization.
- **Styling**: Custom theme implementation with React Native styling.
- **Maps**: React Native Maps with Google Maps API for native, and Leaflet for web, ensuring platform compatibility.
- **Payment**: Paystack integration.
- **Role-Based Access Control**: Comprehensive system using `UserRoleStatus` and `RoleManagementService` with `withRoleAccess` HOC to protect routes and manage user permissions across Consumer, Merchant, and Driver roles.
- **Driver Tracking System**: Client-side simulated real-time tracking with animated movement, distance/ETA calculations (Haversine formula), auto-zoom, and arrival notifications.

### Feature Specifications
- **Multi-Role Support**: Consumer, Merchant, and Driver roles with granular access control and verification. Users can register for multiple roles and switch between them.
- **Core Modules**: Location-based merchant discovery, order management, real-time communication (chat & calls), payment processing, and KYC verification.
- **Authentication Flow**: Role selection, Firebase-first signup/signin, backend API call with Firebase UID, OTP verification, JWT-based session management with auto-logout.
- **Merchant Analytics Dashboard**: Real-time analytics powered by `merchantAnalyticsService.ts` with direct Supabase queries for sales metrics, top products, customer insights, inventory tracking, and payment method breakdowns. Uses batch queries for optimal performance.
- **In-app Chat System**: Real-time messaging using Supabase Realtime in `communicationService.ts`. Features optimized batch queries to avoid N+1 performance issues, user caching for realtime messages, and support for customer-merchant and customer-driver conversations.

### System Design Choices
- **Hybrid Backend Architecture**: Leverages Firebase for robust authentication and Supabase for database, edge functions, and real-time features, providing scalability and flexibility. User data is synchronized between both platforms.
- **Environment Configuration**: Extensive use of environment variables for API keys, Firebase credentials, and feature flags to ensure secure and flexible deployment.
- **Project Structure**: Organized into `app/` (Expo Router pages), `components/`, `services/`, `config/`, `hooks/`, and `utils/` for modularity and maintainability.

## External Dependencies
- **Firebase**: Used for authentication services (email/password, Google, Facebook, Apple sign-in).
- **Supabase**: Backend-as-a-Service providing database, edge functions, and real-time capabilities.
- **Google Maps API**: For map functionalities and location services.
- **Paystack**: Payment gateway integration.
- **Expo**: Development framework for React Native.
- **`@tanstack/react-query`**: For state management and data fetching.
- **`@react-native-community/netinfo`**: For network connectivity detection (offline mode).

## Recent Changes (Migration Cleanup)
- **Removed Neon Database Setup**: The project uses Supabase as the database backend, not Neon. Removed incorrect `server/db.ts` and `drizzle.config.ts` files.
- **Cleaned up Dependencies**: Removed `@neondatabase/serverless`, `drizzle-kit`, and `drizzle-orm` packages.
- **Workflow Configuration**: Configured Frontend workflow to run Expo web on port 5000.
- **Project Structure**: Clarified that this is an Expo + Supabase + Firebase project without a separate Node.js backend server.