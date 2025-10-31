# BrillPrime - Expo Mobile App

A comprehensive marketplace platform built with React Native and Expo.

## Project Structure

```
brillprime/
├── apps/
│   └── expo-app/          # React Native mobile app (Expo)
├── docs/
│   └── assets/            # Shared documentation and assets
├── package.json           # Root package configuration
├── yarn.lock              # Dependencies lockfile
└── README.md              # This file
```

## Expo App (`apps/expo-app/`)

- **Framework**: React Native with Expo
- **Routing**: Expo Router (file-based routing)
- **Features**: Multi-role marketplace (Consumer, Merchant, Driver, Admin)
- **Platforms**: iOS, Android, Web

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- Yarn package manager
- Expo CLI (for mobile development)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd brillprime
   ```

2. **Install dependencies**

   ```bash
   cd apps/expo-app
   yarn install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env` in `apps/expo-app/`
   - Configure Firebase credentials
   - Set API endpoints for backend services

### Starting the Application

**Web Development:**
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

## Configuration

The app uses Firebase for backend services:
- **Authentication**: Firebase Auth
- **Database**: Cloud Firestore
- **Storage**: Cloud Storage

API endpoints are configured in `apps/expo-app/config/environment.ts`

## Development

- Start development server: `yarn web` (runs on port 5000)
- Run tests: `yarn test`
- Lint code: `yarn lint`

## Deployment

Deploy to Replit using the Deployments tool or configure production environment in `app.config.js`

## Documentation

See `apps/expo-app/docs/` for detailed documentation:
- Setup guides
- API integration
- Feature documentation
- Troubleshooting

## License

Private project - All rights reserved