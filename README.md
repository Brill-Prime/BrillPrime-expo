# BrillPrime Monorepo

A comprehensive marketplace platform built with React Native (Expo) and Node.js backend.

## Project Structure

```
brillprime-monorepo/
├── apps/
│   ├── expo-app/          # React Native mobile app (Expo)
│   └── backend/           # Node.js backend API server
├── docs/
│   └── assets/            # Shared documentation and assets
├── tools/
│   └── replit/            # Replit-specific configuration
├── package.json           # Monorepo configuration
├── yarn.lock              # Dependencies lockfile
└── README.md              # This file
```

## Apps

### Expo App (`apps/expo-app/`)

- **Framework**: React Native with Expo
- **Routing**: Expo Router (file-based routing)
- **Features**: Multi-role marketplace (Consumer, Merchant, Driver, Admin)
- **Platforms**: iOS, Android, Web

### Backend (`apps/backend/`)

- **Framework**: Node.js with Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT with Firebase integration
- **Real-time**: WebSocket support

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- Yarn package manager
- Expo CLI (for mobile development)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd brillprime-monorepo
   ```

2. **Install dependencies**

   ```bash
   yarn install
   ```

3. **Set up environment variables**
   - Copy `.env.example` files in each app
   - Configure your Firebase, Supabase, and other service credentials

### Development

**Start both apps simultaneously:**

```bash
yarn dev
```

**Start individual apps:**

**Expo App:**

```bash
yarn expo:start    # Start Expo development server
yarn expo:android  # Run on Android emulator
yarn expo:ios      # Run on iOS simulator
yarn expo:web      # Run on web browser
```

**Backend:**

```bash
yarn backend:dev   # Start backend development server
yarn backend:build # Build for production
yarn backend:start # Start production server
```

## Scripts

- `yarn dev` - Start both frontend and backend in development
- `yarn build` - Build all workspaces
- `yarn clean` - Clean build artifacts
- `yarn install:all` - Reinstall all dependencies

## Architecture

### Frontend (Expo App)

- **State Management**: React Query for server state, Context API for global state
- **Navigation**: Expo Router with nested layouts
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Maps**: Mapbox integration
- **Real-time**: Socket.io client

### Backend

- **API**: RESTful endpoints with Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT tokens with Firebase Auth
- **File Upload**: Multer for handling attachments
- **Real-time**: WebSocket server

## Contributing

1. Follow the existing code structure and naming conventions
2. Use TypeScript for all new code
3. Write tests for new features
4. Update documentation as needed

## License

See individual app licenses for details.
