
# Brill Prime Architecture

## Overview
Brill Prime uses a **serverless architecture** with three main components:
1. **Expo** - Cross-platform mobile app framework
2. **Firebase** - Authentication only
3. **Supabase** - Backend database, edge functions, and real-time features

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Expo App                             │
│  (React Native - iOS, Android, Web)                     │
└─────────────────────────────────────────────────────────┘
                        │
         ┌──────────────┼──────────────┐
         │                             │
         ▼                             ▼
┌─────────────────┐          ┌─────────────────┐
│    Firebase     │          │    Supabase     │
│  Authentication │          │    Backend      │
│                 │          │                 │
│  • Email/Pass   │          │  • PostgreSQL   │
│  • Google       │          │  • Edge Funcs   │
│  • Facebook     │          │  • Realtime     │
│  • Apple        │          │  • Storage      │
└─────────────────┘          └─────────────────┘
         │                             │
         └──────────────┬──────────────┘
                        │
                        ▼
              User gets synced data
```

## Key Components

### 1. Firebase (Authentication Only)
- Handles user authentication
- Supports multiple providers (Email, Google, Facebook, Apple)
- Returns Firebase UID and auth token
- **No database operations**

### 2. Supabase (Backend)
- PostgreSQL database for all data
- Edge functions for business logic
- Real-time subscriptions for live updates
- Row-level security (RLS) for data protection
- File storage for images/documents

### 3. Expo (Frontend)
- React Native for cross-platform development
- File-based routing with Expo Router
- Local state management with React Context
- Offline support with AsyncStorage

## Data Flow

### User Registration
1. User signs up via Firebase
2. Firebase creates auth account
3. App receives Firebase UID
4. App calls Supabase to create user profile
5. User data stored in Supabase with `firebase_uid` reference

### User Login
1. User signs in via Firebase
2. Firebase validates credentials
3. App receives Firebase UID and token
4. App queries Supabase for user profile using `firebase_uid`
5. User data loaded from Supabase

### Backend Operations
All CRUD operations go through Supabase:
- REST API: `https://[project].supabase.co/rest/v1/...`
- Edge Functions: `https://[project].supabase.co/functions/v1/...`
- Real-time: Supabase client subscriptions

## Environment Variables

### Required Variables
```bash
# Firebase (Authentication)
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=

# Supabase (Backend)
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

# Optional
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
```

## No Server Required

This architecture is **completely serverless**:
- ✅ No Express server needed
- ✅ No custom backend to maintain
- ✅ No deployment complexity
- ✅ Scales automatically
- ✅ Free tier available for both Firebase and Supabase

## Benefits

1. **Separation of Concerns**: Auth (Firebase) and Data (Supabase) are separate
2. **Scalability**: Both platforms auto-scale
3. **Security**: Firebase handles OAuth, Supabase handles RLS
4. **Cost-Effective**: Free tiers for development
5. **Real-time**: Built-in subscriptions via Supabase
6. **Simplicity**: No server management required

## Development Workflow

1. **Authentication**: Handled by Firebase Auth
2. **Data Operations**: Use Supabase client or edge functions
3. **Real-time Updates**: Subscribe to Supabase tables
4. **File Storage**: Use Supabase Storage
5. **Business Logic**: Write edge functions in TypeScript

## Next Steps

1. Set up Firebase project and get credentials
2. Set up Supabase project and get credentials
3. Add credentials to Replit Secrets
4. Run the app with `npm run dev`
