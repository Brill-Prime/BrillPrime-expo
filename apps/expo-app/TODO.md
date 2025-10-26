
# Consumer Home Screen Implementation - Critical Path Testing

## Completed Tasks
- [x] Implement complete UI with MapContainer, markers, header, search, location setup, delivery tracking, sidebar, modals
- [x] Add all necessary components and styling
- [x] Create missing components: LocationSetupCard, Header, SearchBar, Sidebar, MerchantDetailsModal
- [x] Fix MapContainer import to use react-native-maps
- [x] Start Expo development server

## 🔴 CRITICAL ISSUE - Backend Connectivity
**Status:** Frontend cannot connect to backend API
**Error:** `TypeError: Failed to fetch` on all API endpoints

### Immediate Action Required:
1. [ ] **Check backend CORS configuration** - Add Replit frontend URL to allowed origins
   - Backend must allow: `https://42528567-18bd-486e-a214-4eb773585554-00-89o2c6ar9mns.janeway.replit.dev`
   - CORS setup needed in backend Express/Node.js app

2. [ ] **Verify backend is running on Render**
   - Check Render.com dashboard
   - Confirm backend service is active (not sleeping)
   - Review backend logs for errors

3. [ ] **Test backend endpoints manually**
   ```bash
   curl https://brill-backend-wjyl.onrender.com/health
   curl https://brill-backend-wjyl.onrender.com/api/merchants
   ```

4. [ ] **Create initial merchant data**
   - No merchants exist in database yet
   - Need to register merchants through backend API
   - Or seed database with sample merchants

### Backend CORS Fix (Required)
Add to your backend (Express.js):
```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'https://42528567-18bd-486e-a214-4eb773585554-00-89o2c6ar9mns.janeway.replit.dev',
    'http://localhost:5000',
    'exp://172.31.72.130:5000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## Critical Path Testing Tasks

### 1. App Launch and Basic Rendering
- [x] Start Expo development server
- [x] Launch app in browser
- [x] Verify app loads without critical errors
- [x] Check that map renders with blue styling
- [ ] **FIX: Backend connectivity blocking all features**

### 2. Location Setup Flow
- [ ] Test location permission request
- [ ] Verify automatic location setting works
- [ ] Check "Set Later" button functionality
- [ ] Confirm location setup card disappears after setting location

### 3. Map and Markers
- [ ] Verify merchant markers appear on map (blocked by no merchants)
- [ ] Test merchant marker press opens details modal
- [ ] Check driver markers display correctly
- [ ] Verify user location marker shows when location is set

### 4. Sidebar Navigation
- [ ] Test sidebar opens/closes with menu button
- [ ] Verify menu items are clickable
- [ ] Test navigation to different screens (Dashboard, Profile, etc.)
- [ ] Check sign out functionality

### 5. Delivery Simulation
- [ ] Test "Test Delivery" button appears when location set and merchants loaded
- [ ] Verify delivery simulation starts with driver movement
- [ ] Check delivery card shows with driver info
- [ ] Confirm delivery completion notification

### 6. Search and Merchant Details
- [ ] Test search container appears when location is set
- [ ] Verify search navigation works
- [ ] Check merchant details modal opens and displays info
- [ ] Test "Order Now" and "Get Directions" buttons

## Next Steps After Critical Path
- Resolve backend connectivity issue FIRST
- Seed database with sample merchants
- Test error handling and loading states
- Verify responsive design and animations
- Manual testing of all edge cases

## API Endpoints Failing (All returning "Failed to fetch")
- `/api/merchants` - Get all merchants
- `/api/merchants/nearby?lat=X&lng=Y` - Get nearby merchants
- `/api/notifications/unread-count?role=consumer` - Get notification count
- `/api/cart` - Get cart items

**Root Cause:** CORS policy blocking requests from Replit frontend domain
