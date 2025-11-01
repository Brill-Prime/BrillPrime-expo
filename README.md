
# BrillPrime - Expo Mobile Application

A cross-platform mobile marketplace application built with React Native and Expo, featuring multi-role support for Consumers, Merchants, and Drivers.

## 🚀 Quick Start

```bash
# Install dependencies
cd expo-app
yarn install

# Start development server
yarn web
```

The app runs on **port 5000** and will be accessible in your browser.

## 📁 Project Structure

```
expo-app/
├── app/              # Screen components (file-based routing)
├── components/       # Reusable UI components
├── services/         # API integration & backend services
├── contexts/         # React Context providers
├── hooks/           # Custom React hooks
├── utils/           # Helper functions
├── config/          # Configuration files (Firebase, theme)
├── assets/          # Images, fonts, icons
└── types/           # TypeScript definitions
```

## 🔧 Configuration

### Environment Variables

Create `.env` in `expo-app/` directory:

```env
# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

# API
EXPO_PUBLIC_API_BASE_URL=http://localhost:3001
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token
```

## 🎯 Key Features

### Multi-Role System
- **Consumer**: Browse products, place orders, track deliveries
- **Merchant**: Manage inventory, process orders, view analytics
- **Driver**: Accept deliveries, track routes, manage earnings

### Core Functionality
- Firebase Authentication (Email, Google, Apple, Facebook)
- Shopping cart & checkout
- Real-time order tracking
- In-app messaging
- Payment processing
- KYC verification
- Location-based merchant discovery

## 🔌 API Integration

All services connect to backend API:
- **Base URL**: Configured in `config/environment.ts`
- **Authentication**: JWT token-based
- **Services**: 15+ service modules in `services/` directory

### Available Services
- authService, cartService, orderService
- paymentService, merchantService, locationService
- notificationService, communicationService
- kycService, adminService, and more

## 🗺️ Maps Integration

- **Mobile**: Mapbox GL Native
- **Web**: Leaflet.js
- Platform-specific implementations in `components/Map.*`

## 📱 Available Scripts

```bash
yarn web        # Start web dev server (port 5000)
yarn android    # Start Android development
yarn ios        # Start iOS development
yarn start      # Start Expo dev server
yarn build      # Build for production
```

## 🏗️ Architecture

### State Management
- React Context API for global state
- AsyncStorage for local persistence
- No Redux/MobX - lightweight architecture

### Navigation
- Expo Router (file-based routing)
- Stack navigation for screens
- Role-based route protection

### Offline Support
- Network state detection
- Request queue for failed operations
- Automatic sync on reconnection

## 🔐 Authentication Flow

1. Onboarding screens for new users
2. Role selection (Consumer/Merchant/Driver)
3. Sign up/Sign in with email or social auth
4. OTP verification
5. Role-specific dashboard

## 📊 Backend Endpoints

### Critical Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/cart` - Get cart items
- `POST /api/orders` - Create order
- `POST /api/payments/process` - Process payment

See `expo-app/BACKEND_IMPLEMENTATION_GUIDE.md` for complete API documentation.

## 🐛 Troubleshooting

### Clear cache and restart
```bash
npx expo start --clear
```

### Reinstall dependencies
```bash
rm -rf node_modules
yarn install
```

### Firebase issues
- Verify credentials in `.env`
- Check Firebase Console for service status
- Ensure authorized domains are configured

## 📦 Dependencies

### Core
- expo (~53.0.23)
- react-native
- expo-router
- firebase

### UI/UX
- @expo/vector-icons
- expo-linear-gradient
- react-native-svg

### Features
- @rnmapbox/maps (mobile maps)
- expo-location
- expo-image-picker
- @react-native-async-storage/async-storage

## 🚢 Deployment

The app is configured to run on Replit:
- Development: Port 5000 (Expo web)
- Workflow: "Start Expo App" runs `cd expo-app && yarn web`

## 📝 Documentation

- **Main Docs**: `expo-app/docs/README.md`
- **API Guide**: `expo-app/BACKEND_IMPLEMENTATION_GUIDE.md`
- **Replit Guide**: `expo-app/docs/replit.md`

## 🔄 Current Status

✅ **Working:**
- Firebase authentication
- Frontend-only development
- Web interface on port 5000
- All UI screens implemented
- Service layer complete

⚠️ **In Progress:**
- Backend API integration
- Payment gateway setup
- Real-time features

## 📞 Support

For issues:
1. Check console logs in webview
2. Review error messages
3. Clear cache and restart
4. Check Firebase/API connectivity

## 🎨 UI Theme

- Primary: #4682B4 (Steel Blue)
- Font: Montserrat (9 weights)
- Gradients for role differentiation
- Responsive design for all screen sizes

---

**Built with**: React Native, Expo, TypeScript, Firebase
**Platform**: iOS, Android, Web
**Package Manager**: Yarn
