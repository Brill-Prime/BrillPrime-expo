# BrillPrime Native Development Setup

## Architecture

This is a monorepo containing:
- **Frontend**: `apps/expo-app` (Expo/React Native) - Port 5000
- **Backend**: `apps/backend` (Express API) - Port 3000

## Prerequisites

Before starting development, ensure you have:
- Node.js 20.x or later
- Yarn package manager
- PostgreSQL database (local or cloud)
- Environment variables configured (see below)

## Environment Setup

### 1. Clone and Install Dependencies
```bash
git clone <repository-url>
cd brillprime-expo
yarn install:all
```

### 2. Configure Environment Variables

Create `.env` files in the root directory and `apps/backend/` directory:

**Root `.env`** (for Expo app):
```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
EXPO_PUBLIC_API_TIMEOUT=30000
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Backend `.env`** (in `apps/backend/`):
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/brillprime
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
PORT=3000
```

### 3. Database Setup

Set up PostgreSQL database and run migrations:
```bash
cd apps/backend
yarn db:push
```

## Development Workflow

### Starting the Application

**Full Stack Development:**
```bash
yarn dev
```
This starts both backend (port 3000) and frontend (port 5000) simultaneously.

**Individual Services:**

**Backend:**
```bash
cd apps/backend
yarn dev
```

**Frontend:**
```bash
cd apps/expo-app
yarn web
```

**Mobile Development:**
```bash
cd apps/expo-app
yarn android  # Android emulator
yarn ios      # iOS simulator
```

## API Configuration

The frontend automatically detects the environment:
- **Development**: Uses `http://localhost:3000`
- **Production**: Uses `https://api.brillprime.com`

## Port Configuration

- Port 3000: Backend API server
- Port 5000: Frontend Expo web app

## Health Checks

- Backend: `http://localhost:3000/health`
- Frontend: `http://localhost:5000`

## Troubleshooting

### API Connection Errors

If you see "Failed to fetch" errors:
1. Ensure backend is running on port 3000
2. Check console for API Base URL (should be `http://localhost:3000` in development)
3. Verify environment variables are set correctly

### Port Conflicts

If port 3000 or 5000 is already in use:
1. Stop the existing process
2. Check what's using the port: `lsof -i :3000` or `netstat -ano | findstr :3000`
3. Change ports in configuration if needed

### Database Issues

If database connection fails:
1. Ensure PostgreSQL is running
2. Check DATABASE_URL in backend .env
3. Run migrations: `yarn db:push`

### Expo Issues

If Expo fails to start:
1. Clear cache: `expo start -c`
2. Reinstall dependencies: `yarn install`
3. Check Expo CLI version: `expo --version`
