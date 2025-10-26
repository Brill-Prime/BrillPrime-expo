
# BrillPrime Full Stack Setup

## Architecture

This is a monorepo containing:
- **Frontend**: `apps/expo-app` (Expo/React Native) - Port 5000
- **Backend**: `apps/backend` (Express API) - Port 3000

## Development Workflow

### Starting the Application

Click the **Run** button to start both servers simultaneously:
- Backend API will start on `http://localhost:3000`
- Frontend will start on `http://localhost:5000`

### Manual Start

If you need to start services individually:

**Backend:**
```bash
cd apps/backend
npm install
npm start
```

**Frontend:**
```bash
cd apps/expo-app
npm install
npm run web
```

## API Configuration

The frontend automatically detects the environment:
- **Development (Replit)**: Uses `http://localhost:3000`
- **Production**: Uses `https://api.brillprime.com`

## Port Configuration

- Port 3000: Backend API server
- Port 5000: Frontend Expo web app (forwarded to port 80/443 in production)

## Health Checks

- Backend: `http://localhost:3000/health`
- Frontend: `http://localhost:5000`

## Troubleshooting

### API Connection Errors

If you see "Failed to fetch" errors:
1. Ensure backend is running on port 3000
2. Check console for API Base URL (should be `http://localhost:3000` in development)
3. Verify both servers are running in the Workflows pane

### Port Conflicts

If port 3000 or 5000 is already in use:
1. Stop the existing process
2. Restart using the Run button
