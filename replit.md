# BrillPrime Native - Mobile & Backend Platform

## Overview

BrillPrime is a cross-platform mobile application with a comprehensive backend API, built as a monorepo using Expo (React Native) for the frontend and Express.js for the backend. The platform serves as a multi-role marketplace and service delivery system supporting Consumers, Merchants, and Drivers across Nigeria. The application enables commodity ordering, fuel delivery, toll payments, and real-time order tracking with live location services.

**Technology Stack:**
- **Frontend**: Expo (React Native), TypeScript, React Navigation, Expo Router
- **Backend**: Express.js, Node.js (Port 3000)
- **Mobile Platforms**: iOS, Android, Web
- **Package Management**: Yarn Workspaces monorepo structure

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Monorepo Structure
The application uses a Yarn Workspaces monorepo with two main applications:
- **Frontend**: `apps/expo-app` - Expo/React Native mobile application (Port 5000)
- **Backend**: `apps/backend` - Express API server (Port 3000)

This architecture enables shared dependencies while maintaining separate concerns for mobile client and API server.

### Frontend Architecture (Expo App)

**Navigation System:**
- File-based routing using Expo Router for declarative navigation structure
- Stack navigation for authentication flows and screen hierarchies
- Role-based routing that adapts UI based on user type (Consumer/Merchant/Driver)
- Deep linking support with custom URL scheme (`brillprime://`)

**State Management:**
- Context API for global state (AppContext, AuthContext, MerchantContext, NotificationContext)
- React Hooks (useState, useEffect, useCallback) for component-level state
- AsyncStorage for persistent local data (auth tokens, user preferences, cache)
- No external state management library (Redux/MobX) - keeps architecture lightweight

**Component Architecture:**
- Reusable UI components with consistent theming system
- Custom icon components using react-native-svg for cross-platform compatibility
- Error boundaries for graceful error handling at component and screen levels
- Optimized image loading with fallbacks and loading states
- Web-specific and native-specific implementations for platform-dependent features (maps)

**Authentication Flow:**
- Firebase Authentication integration for user identity management
- JWT token-based API authentication with automatic token refresh
- Multi-factor authentication (MFA) support with OTP verification
- Social login integration (Google, Apple, Facebook)
- Role-based access control with permission checking

**Multi-Role System:**
- Dynamic UI rendering based on active user role
- Role switching capability for users with multiple roles
- Separate verification workflows for Merchant and Driver roles
- Role-specific feature access and navigation menus

### Backend Architecture

**API Design:**
- RESTful API endpoints following resource-based URL patterns
- JWT authentication middleware for protected routes
- Health check endpoints for monitoring (`/health`, `/api/health/detailed`)
- CORS configuration for cross-origin requests from mobile clients

**Database Integration:**
- PostgreSQL as primary database
- Drizzle ORM for type-safe database queries and schema management
- Schema push/migration system for database updates
- Connection pooling for optimized database performance

**Authentication & Authorization:**
- JWT token generation and validation
- Session management with token refresh mechanism
- Password reset flow with temporary codes
- MFA token creation and verification
- User account locking/unlocking for security

**API Endpoint Categories:**
- Authentication & User Management
- Merchants & Commodities
- Orders & Order Tracking
- Payments & Transactions
- Cart Management
- Notifications
- Location Services
- KYC/Verification
- Communication (Chat, Calls)
- Admin Services

### Mapping & Location Services

**Platform-Specific Implementations:**
- **Mobile (iOS/Android)**: Mapbox GL Native (`@rnmapbox/maps`) for high-performance native maps
- **Web**: Leaflet.js with custom WebView wrapper for map rendering
- Platform detection with conditional imports for seamless cross-platform experience

**Location Features:**
- Real-time GPS tracking for drivers during deliveries
- Geofencing for delivery zone validation
- Route calculation and ETA estimation
- Store locator with marker clustering
- Live location sharing between drivers and consumers
- Drawing tools for delivery zone management (polygon, circle, point)

**Map Configuration:**
- Mapbox access token management through environment variables
- Multiple map styles (street, satellite, navigation, dark mode)
- Nigeria-specific default bounds and center coordinates
- Custom marker icons for different entity types (merchants, drivers, delivery points)

### Service Layer Architecture

**API Client Service:**
- Centralized HTTP client with axios
- Automatic authentication header injection
- Request/response interceptors for error handling
- Timeout configuration (30 seconds default)
- Retry logic for failed requests
- Offline request queueing

**Feature Services:**
- **authService**: User authentication and profile management
- **cartService**: Shopping cart operations
- **orderService**: Order placement and tracking
- **paymentService**: Payment initialization and verification
- **merchantService**: Merchant data and commodity browsing
- **locationService**: GPS tracking and geolocation
- **notificationService**: Push notifications and in-app alerts
- **communicationService**: Chat and calling features
- **analyticsService**: User behavior tracking
- **errorService**: Centralized error logging

**Offline Mode Support:**
- Network state detection with `@react-native-community/netinfo`
- Offline data caching using AsyncStorage
- Request queue for failed operations
- Automatic sync when connection restored
- Offline indicator banner in UI

### UI/UX Design System

**Theming:**
- Centralized theme configuration (`config/theme.ts`)
- Color palette with primary (#4682B4), secondary, and semantic colors
- Typography system using Montserrat font family (9 weights)
- Consistent spacing, border radius, and shadow values

**Design Patterns:**
- Gradient backgrounds for visual hierarchy and role differentiation
- Animated transitions using React Native Animated API
- Pull-to-refresh for data updates
- Loading states with skeleton screens and activity indicators
- Toast notifications for user feedback
- Modal dialogs for confirmations and alerts

**Accessibility:**
- Accessibility wrapper components with proper ARIA labels
- Screen reader support for visually impaired users
- Sufficient color contrast ratios
- Touch target size optimization (minimum 44x44 points)

### Asset Management

**Font Loading:**
- Custom Montserrat font family with expo-font
- Font preloading during app startup with SplashScreen API
- Fallback to system fonts if custom fonts fail to load

**Image Optimization:**
- expo-image for optimized image rendering
- Lazy loading with placeholder images
- Image caching for performance
- Fallback UI for broken images

**Icon Systems:**
- Expo Vector Icons (Ionicons, MaterialIcons)
- Custom SVG icons for brand-specific elements
- Platform-specific icon rendering

## External Dependencies

### Mobile Development
- **expo**: Core framework for React Native development (~53.0.23)
- **react-native**: Mobile app framework
- **expo-router**: File-based navigation system
- **@react-navigation/native**: Navigation library foundation
- **expo-splash-screen**: Native splash screen control
- **expo-font**: Custom font loading
- **expo-constants**: Access to app configuration

### UI Components & Styling
- **@expo/vector-icons**: Icon library (Ionicons, MaterialIcons)
- **expo-linear-gradient**: Gradient backgrounds
- **expo-blur**: Blur effects for modals and overlays
- **react-native-svg**: SVG rendering for custom icons

### Authentication & Storage
- **Firebase**: User authentication and identity management
  - firebase/app, firebase/auth, firebase/firestore, firebase/storage
- **@react-native-async-storage/async-storage**: Local data persistence
- **expo-crypto**: Cryptographic operations

### Location & Maps
- **@rnmapbox/maps**: Mapbox GL Native for iOS/Android
- **Leaflet**: Web mapping library
- **react-native-webview**: WebView wrapper for web maps
- **expo-location**: Device location services
- **react-native-maps-directions**: Route calculation

### Communication
- **expo-contacts**: Contact list access
- **expo-calendar**: Calendar integration
- **@sendgrid/mail**: Email service integration

### Media & Files
- **expo-image-picker**: Image selection from gallery/camera
- **expo-document-picker**: File selection
- **expo-image**: Optimized image component
- **expo-barcode-scanner**: QR code scanning
- **react-native-view-shot**: Screen capture for receipts

### Network & API
- **axios**: HTTP client for API requests
- **@tanstack/react-query**: Server state management and caching
- **@react-native-community/netinfo**: Network connectivity detection
- **cors**: CORS middleware for backend

### Backend Services
- **Express.js**: Web server framework (apps/backend)
- **Drizzle ORM**: Database ORM and query builder
- **PostgreSQL**: Relational database (DATABASE_URL configuration)
- **dotenv**: Environment variable management

### Development Tools
- **TypeScript**: Type-safe development
- **concurrently**: Run multiple npm scripts simultaneously
- **expo-build-properties**: Native build configuration
- **jest-expo**: Testing framework

### Environment Configuration
- **Firebase**: API keys, auth domain, project ID, storage bucket, messaging sender ID, app ID
- **Google Maps**: API key for location services (EXPO_PUBLIC_GOOGLE_MAPS_API_KEY)
- **Mapbox**: Access token for map rendering (EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN)
- **Backend API**: Base URL configuration (EXPO_PUBLIC_API_BASE_URL)
- **Database**: PostgreSQL connection string (DATABASE_URL)
- **JWT**: Secret keys for token generation (JWT_SECRET, SESSION_SECRET)

### Third-Party Integrations
- **SendGrid**: Email delivery service for transactional emails
- **Payment Gateway**: Payment initialization and verification (implementation pending)
- **Push Notifications**: Expo Push Notification service
- **Analytics**: Custom analytics service for user behavior tracking
- **EAS (Expo Application Services)**: Build and deployment platform (Project ID: 09953d4e-9d37-4353-b91d-1df3e0acc789)