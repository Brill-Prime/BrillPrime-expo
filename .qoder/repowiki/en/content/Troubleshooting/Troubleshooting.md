# Troubleshooting

<cite>
**Referenced Files in This Document**   
- [ISSUES_FOUND.md](file://ISSUES_FOUND.md)
- [CRITICAL_ERRORS_REPORT.md](file://docs/CRITICAL_ERRORS_REPORT.md)
- [CROSS_PLATFORM_VERIFICATION.md](file://CROSS_PLATFORM_VERIFICATION.md)
- [ROUTING_VERIFICATION.md](file://ROUTING_VERIFICATION.md)
- [TYPESCRIPT_FIXES.md](file://TYPESCRIPT_FIXES.md)
- [MAP_MIGRATION_SUMMARY.md](file://MAP_MIGRATION_SUMMARY.md)
- [BLANK_SCREEN_FIX.md](file://BLANK_SCREEN_FIX.md)
- [bugfix-live-order-tracker-memory-leak.md](file://docs/bugfix-live-order-tracker-memory-leak.md)
- [components/LiveOrderTracker.tsx](file://components/LiveOrderTracker.tsx)
- [components/Map.tsx](file://components/Map.tsx)
- [components/Map.web.tsx](file://components/Map.web.tsx)
- [components/Map.native.tsx](file://components/Map.native.tsx)
- [services/authService.ts](file://services/authService.ts)
- [services/api.ts](file://services/api.ts)
- [contexts/AuthContext.tsx](file://contexts/AuthContext.tsx)
- [hooks/useAuth.ts](file://hooks/useAuth.ts)
- [services/apiEndpoints.ts](file://services/apiEndpoints.ts)
</cite>

## Table of Contents
1. [Authentication Issues](#authentication-issues)
2. [UI and Rendering Issues](#ui-and-rendering-issues)
3. [Performance Issues](#performance-issues)
4. [Connectivity and API Issues](#connectivity-and-api-issues)
5. [Platform-Specific Issues](#platform-specific-issues)
6. [TypeScript and Compilation Issues](#typescript-and-compilation-issues)
7. [Database and Backend Issues](#database-and-backend-issues)
8. [Recommended Debugging Tools and Methodologies](#recommended-debugging-tools-and-methodologies)

## Authentication Issues

This section addresses authentication failures and related issues in Brillprime-expo, including token authentication errors, endpoint mismatches, and social login problems.

### Token Authentication Failure

**Issue**: Users encounter "Invalid or expired token" (401) errors when accessing protected endpoints like `/api/cart`.

**Root Cause**: The authentication flow has incomplete token management, where tokens are not properly stored, refreshed, or passed to API calls.

**Reproduction Steps**:
1. Sign in to the application
2. Wait for the token to expire (24 hours by default)
3. Attempt to access cart or other protected resources
4. Observe 401 Unauthorized error

**Resolution Guidance**:
1. Verify token storage in `authService.ts` by checking AsyncStorage keys:
   - `userToken`: Stores the JWT token
   - `tokenExpiry`: Stores token expiration timestamp
2. Implement token refresh mechanism using Firebase's `getIdToken()` with force refresh:
```typescript
const freshToken = await this.currentUser.getIdToken(true);
```
3. Ensure API client includes authorization header for all requests:
```typescript
headers: {
  'Authorization': `Bearer ${token}`,
  'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
}
```
4. Add token expiry checking before API calls and refresh if necessary

**Diagnostic Procedures**:
- Check if token exists in AsyncStorage: `await AsyncStorage.getItem('userToken')`
- Verify token expiry: `await AsyncStorage.getItem('tokenExpiry')`
- Monitor network requests to confirm Authorization header is present
- Test token refresh by forcing refresh with `getIdToken(true)`

**Section sources**
- [services/authService.ts](file://services/authService.ts#L777-L800)
- [services/api.ts](file://services/api.ts#L40-L42)
- [contexts/AuthContext.tsx](file://contexts/AuthContext.tsx#L34-L35)

### Authentication Endpoint Mismatch

**Issue**: Authentication endpoints are incorrectly configured, with frontend expecting `POST /api/auth/login` but potentially calling incorrect methods.

**Root Cause**: Historical issues with HTTP method usage (GET vs POST) and endpoint structure mismatches between frontend and backend.

**Reproduction Steps**:
1. Attempt to sign in using email and password
2. Observe network request to `/api/auth/login`
3. Check if request method is POST and not GET
4. Verify response status code

**Resolution Guidance**:
1. Ensure all authentication requests use correct HTTP methods:
   - Login: POST `/api/auth/login`
   - Register: POST `/api/auth/register`
   - Password Reset: POST `/api/auth/forgot-password`
2. Verify endpoint consistency in `apiEndpoints.ts`:
```typescript
AUTH: {
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  VERIFY_OTP: '/api/auth/verify-otp'
}
```
3. Update API calls to use proper POST methods instead of GET
4. Implement proper error handling for authentication responses

**Diagnostic Procedures**:
- Monitor network tab for authentication requests
- Verify request method is POST for login/registration
- Check response payload for success/error fields
- Validate endpoint URLs match backend implementation

**Section sources**
- [CRITICAL_ERRORS_REPORT.md](file://docs/CRITICAL_ERRORS_REPORT.md#L17-L21)
- [services/apiEndpoints.ts](file://services/apiEndpoints.ts#L15-L24)
- [services/authService.ts](file://services/authService.ts#L154-L242)

### Social Login Configuration Issues

**Issue**: Social login providers (Google, Apple, Facebook) fail due to unauthorized domain errors or popup blocking.

**Root Cause**: Firebase authentication configuration issues where the current domain is not authorized for social sign-in.

**Reproduction Steps**:
1. Click on Google/Apple/Facebook sign-in button
2. Observe popup window or redirect
3. Check for "unauthorized-domain" errors
4. Verify if popup is blocked by browser

**Resolution Guidance**:
1. Add your domain to Firebase authorized domains:
   - Go to Firebase Console → Authentication → Sign-in method
   - Add your domain (e.g., gitpod.io, localhost) to authorized domains
2. Implement redirect fallback for popup blocking:
```typescript
try {
  await signInWithPopup(auth, provider);
} catch (error) {
  if (error.code === 'auth/popup-blocked') {
    await signInWithRedirect(auth, provider);
  }
}
```
3. Handle redirect results on app load:
```typescript
const result = await getRedirectResult(auth);
```

**Diagnostic Procedures**:
- Check browser console for "auth/unauthorized-domain" errors
- Verify popup blocker is disabled for the site
- Test on different browsers to rule out popup blocking
- Check Firebase console for authorized domains configuration

**Section sources**
- [services/authService.ts](file://services/authService.ts#L244-L364)
- [contexts/AuthContext.tsx](file://contexts/AuthContext.tsx#L30-L149)

## UI and Rendering Issues

This section addresses user interface problems including blank screens and map rendering issues across different platforms.

### Blank Screen Issue

**Issue**: The application displays a blank white screen when accessed via Gitpod preview URL instead of showing the complete UI.

**Root Cause**: CSS module dependency issue with `lightningcss` requiring native Node.js modules that aren't properly installed in cloud environments.

**Reproduction Steps**:
1. Deploy application in Gitpod or similar cloud environment
2. Access the application via preview URL
3. Observe blank white screen
4. Check browser console for TransformError

**Resolution Guidance**:
1. Remove CSS module files that require native dependencies:
```bash
rm app/merchant/add-commodity.module.css
```
2. Convert CSS modules to inline React Native Web styles:
```typescript
const webOnlyStyles = Platform.OS === 'web' ? {
  visuallyHidden: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0,
  },
} : {};
```
3. Update component to use style prop instead of className:
```typescript
<label style={webOnlyStyles.visuallyHidden}>...</label>
```

**Diagnostic Procedures**:
1. Check HTML output to verify it loads correctly with root div and script tag
2. Test JavaScript bundle URL directly for 500 errors
3. Look for TransformError in Metro bundler logs
4. Identify CSS module files in the project

**Prevention**:
- Avoid CSS modules in Expo projects
- Use StyleSheet.create() for React Native styles
- Use inline styles for web-specific styling
- Avoid .css files in Expo projects

**Section sources**
- [BLANK_SCREEN_FIX.md](file://BLANK_SCREEN_FIX.md)
- [components/Map.tsx](file://components/Map.tsx#L4)
- [app/merchant/add-commodity.tsx](file://app/merchant/add-commodity.tsx)

### Map Rendering Issues

**Issue**: Map components fail to render correctly across different platforms due to API incompatibilities between web and native implementations.

**Root Cause**: Mixed use of Map APIs where native-only patterns are used on web platform, and missing Google Maps API key configuration.

**Reproduction Steps**:
1. Load application on web platform
2. Navigate to any screen with a map component
3. Observe map rendering issues or error messages
4. Check console for API key warnings

**Resolution Guidance**:
1. Ensure Google Maps API key is configured in `.env` file:
```bash
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```
2. Implement platform-specific rendering in map components:
```typescript
{Platform.OS === 'web' ? (
  <MapView markers={[...]} />
) : (
  <MapView>
    <Marker coordinate={...} />
  </MapView>
)}
```
3. Verify all required Google Cloud APIs are enabled:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Maps JavaScript API
   - Places API (optional)
   - Directions API (optional)

**Diagnostic Procedures**:
- Check for "Google Maps API key is missing" warnings in console
- Verify API key is set in environment variables
- Test map rendering on web, iOS, and Android platforms
- Check network requests for Google Maps API calls

**Section sources**
- [MAP_MIGRATION_SUMMARY.md](file://MAP_MIGRATION_SUMMARY.md)
- [CROSS_PLATFORM_VERIFICATION.md](file://CROSS_PLATFORM_VERIFICATION.md#L34-L54)
- [components/Map.tsx](file://components/Map.tsx#L17-L21)
- [components/Map.web.tsx](file://components/Map.web.tsx#L29-L30)

## Performance Issues

This section addresses performance problems including memory leaks, slow rendering, and battery drain issues.

### Memory Leaks in Live Order Tracker

**Issue**: The LiveOrderTracker component has a critical memory leak causing performance degradation and potential app crashes.

**Root Cause**: The `trackDriverLocation()` function returns a cleanup function that is never stored or called, leading to accumulated intervals and subscriptions.

**Reproduction Steps**:
1. Open order tracking as a consumer
2. Navigate away and back multiple times
3. Monitor memory usage over time
4. Check for multiple active intervals

**Resolution Guidance**:
1. Use useRef to store cleanup function:
```typescript
const trackingCleanupRef = useRef<(() => void) | null>(null);
```
2. Store cleanup function when starting tracking:
```typescript
const cleanup = trackDriverLocation();
trackingCleanupRef.current = cleanup;
```
3. Call cleanup function when stopping tracking:
```typescript
if (trackingCleanupRef.current) {
  trackingCleanupRef.current();
  trackingCleanupRef.current = null;
}
```
4. Ensure cleanup is called on component unmount:
```typescript
useEffect(() => {
  return () => {
    stopTracking();
  };
}, [orderId]);
```

**Diagnostic Procedures**:
- Monitor memory usage over time for growth
- Check React DevTools for unmounted components with active intervals
- Verify console for warnings about setState on unmounted components
- Test with multiple mount/unmount cycles

**Prevention**:
- Always store cleanup functions returned from custom hooks
- Use useEffect cleanup for subscriptions and intervals
- Test component unmount behavior to catch memory leaks
- Use refs for cleanup functions that need to persist across renders

**Section sources**
- [bugfix-live-order-tracker-memory-leak.md](file://docs/bugfix-live-order-tracker-memory-leak.md)
- [CROSS_PLATFORM_VERIFICATION.md](file://CROSS_PLATFORM_VERIFICATION.md#L16-L24)
- [components/LiveOrderTracker.tsx](file://components/LiveOrderTracker.tsx#L26-L71)

### Slow Rendering and Battery Drain

**Issue**: Application experiences slow rendering and excessive battery drain, particularly in location tracking features.

**Root Cause**: Inefficient location tracking with multiple intervals running simultaneously and unnecessary background processes.

**Reproduction Steps**:
1. Enable live location tracking
2. Monitor device battery usage
3. Observe UI responsiveness during tracking
4. Check for multiple location update listeners

**Resolution Guidance**:
1. Optimize location update frequency based on use case:
```typescript
await locationService.startLiveTracking(3000); // Update every 3 seconds
```
2. Ensure proper cleanup of location listeners:
```typescript
const unsubscribe = locationService.onLocationUpdate((location) => {
  // location update logic
});
// Call unsubscribe() when no longer needed
```
3. Implement throttling for frequent updates:
```typescript
const debouncedUpdate = useCallback(debounce(handleLocationUpdate, 1000), []);
```
4. Use native driver for animations when possible:
```typescript
Animated.timing(animation, {
  useNativeDriver: true
});
```

**Diagnostic Procedures**:
- Monitor battery usage in device settings
- Check for multiple active intervals in code
- Profile rendering performance with React DevTools
- Test with location services enabled/disabled

**Section sources**
- [components/LiveOrderTracker.tsx](file://components/LiveOrderTracker.tsx#L48-L51)
- [services/locationService.ts](file://services/locationService.ts)
- [hooks/usePerformance.ts](file://hooks/usePerformance.ts)

## Connectivity and API Issues

This section addresses connectivity problems and API integration gaps in the application.

### API Connectivity Problems

**Issue**: API calls fail with various HTTP errors including 401 (Unauthorized), 404 (Not Found), and 500 (Internal Server Error).

**Root Cause**: Misconfigured API endpoints, missing authentication headers, and improper error handling in API client.

**Reproduction Steps**:
1. Make API call to protected endpoint
2. Observe network response status code
3. Check request headers for proper authorization
4. Verify endpoint URL is correct

**Resolution Guidance**:
1. Verify API client configuration in `api.ts`:
```typescript
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`
};
```
2. Ensure Supabase credentials are configured in `.env` file:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
3. Implement proper error handling with user-friendly messages:
```typescript
if (error.message.includes('HTTP 401')) {
  userFriendlyMessage = 'Your session has expired. Please sign in again.';
}
```
4. Add request timeout and retry logic:
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);
```

**Diagnostic Procedures**:
- Check network tab for request/response details
- Verify environment variables are set correctly
- Test API endpoints with curl commands:
```bash
curl https://api.brillprime.com/health
curl -X POST https://api.brillprime.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```
- Validate response structure matches expected format

**Section sources**
- [services/api.ts](file://services/api.ts#L6-L13)
- [CRITICAL_ERRORS_REPORT.md](file://docs/CRITICAL_ERRORS_REPORT.md#L18-L20)
- [config/environment.ts](file://config/environment.ts)

### CORS and Preflight Request Issues

**Issue**: API requests fail due to CORS (Cross-Origin Resource Sharing) policy violations.

**Root Cause**: Missing or incorrect CORS headers in API requests, particularly in browser environments.

**Reproduction Steps**:
1. Make API request from browser
2. Observe preflight OPTIONS request
3. Check for CORS-related error messages
4. Verify response headers include proper CORS configuration

**Resolution Guidance**:
1. Ensure API client includes proper CORS headers:
```typescript
const DEFAULT_HEADERS = {
  'Access-Control-Allow-Credentials': 'true'
};
```
2. Configure fetch options with proper mode and credentials:
```typescript
fetch(`${this.baseURL}${endpoint}`, {
  mode: 'cors',
  credentials: 'include',
});
```
3. Handle preflight requests in API client:
```typescript
if (options.method === 'OPTIONS') {
  return {
    success: true,
    message: 'Preflight request successful'
  };
}
```
4. Verify backend CORS configuration allows expected origins

**Diagnostic Procedures**:
- Check network tab for OPTIONS preflight requests
- Verify response includes Access-Control-Allow-Origin header
- Test API endpoints directly to isolate CORS issues
- Check browser console for CORS error messages

**Section sources**
- [services/api.ts](file://services/api.ts#L63-L69)
- [supabase/functions/_shared/cors.ts](file://supabase/functions/_shared/cors.ts)

## Platform-Specific Issues

This section addresses issues that are specific to certain platforms (web, iOS, Android) in the Brillprime-expo application.

### Cross-Platform Map Incompatibility

**Issue**: Map components fail on web platform due to use of native-only APIs and patterns.

**Root Cause**: Using react-native-maps specific components like `MapView.Marker` as nested children, which only works on iOS/Android but fails on web.

**Reproduction Steps**:
1. Load application on web platform
2. Navigate to screen with map component
3. Observe rendering errors or blank map
4. Check console for web-specific errors

**Resolution Guidance**:
1. Implement platform detection for map rendering:
```typescript
{Platform.OS === 'web' ? (
  <MapView markers={[...]} />
) : (
  <MapView>
    <Marker coordinate={...} />
  </MapView>
)}
```
2. Use the existing platform-specific map implementations:
```
components/
├── Map.tsx          # Native (iOS/Android) - react-native-maps
├── Map.native.tsx   # Native export wrapper
└── Map.web.tsx      # Web - Leaflet/Google Maps
```
3. Ensure proper imports for platform-specific components:
```typescript
import MapView, { PROVIDER_GOOGLE, Marker } from './Map';
```
4. Verify web map uses markers array prop while native uses nested Marker components

**Diagnostic Procedures**:
- Test map rendering on web, iOS, and Android platforms
- Check for platform-specific error messages
- Verify correct map implementation is loaded for each platform
- Inspect component structure in React DevTools

**Section sources**
- [CROSS_PLATFORM_VERIFICATION.md](file://CROSS_PLATFORM_VERIFICATION.md#L34-L62)
- [components/Map.tsx](file://components/Map.tsx)
- [components/Map.web.tsx](file://components/Map.web.tsx)
- [components/Map.native.tsx](file://components/Map.native.tsx)

### Web Platform Specific Issues

**Issue**: Various issues occur specifically on web platform including native driver warnings and styling problems.

**Root Cause**: Differences in React Native Web implementation compared to native platforms, particularly around animation drivers and styling.

**Reproduction Steps**:
1. Run application on web platform (`npm run web`)
2. Observe console warnings
3. Test animations and transitions
4. Check styling differences from native platforms

**Resolution Guidance**:
1. Address native driver warnings by acknowledging they are expected for web:
```javascript
// Warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
// Note: Expected for web platform
```
2. Handle web-specific styling requirements:
```typescript
const webOnlyStyles = Platform.OS === 'web' ? {
  visuallyHidden: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)'
  }
} : {};
```
3. Use platform-specific code where necessary:
```typescript
if (Platform.OS === 'web') {
  return await this.getWebLocation();
} else {
  return await this.getNativeLocation();
}
```

**Diagnostic Procedures**:
- Run application with `npm run web` command
- Check browser console for warnings and errors
- Compare UI with native platform implementations
- Test all interactive elements on web

**Section sources**
- [CROSS_PLATFORM_VERIFICATION.md](file://CROSS_PLATFORM_VERIFICATION.md#L85-L94)
- [components/Map.web.tsx](file://components/Map.web.tsx#L1-L330)
- [utils/platformStyles.ts](file://utils/platformStyles.ts)

## TypeScript and Compilation Issues

This section addresses TypeScript compilation errors and type safety issues in the application.

### TypeScript Compilation Errors

**Issue**: TypeScript errors occur in various components, particularly around method names, property access, and type mismatches.

**Root Cause**: Incorrect method calls, improper handling of API response structures, and type mismatches in component props.

**Reproduction Steps**:
1. Run TypeScript compiler (`npx tsc --noEmit`)
2. Observe compilation errors
3. Identify files with type errors
4. Check specific error locations

**Resolution Guidance**:
1. Fix method name errors by using correct method names:
```typescript
// Before: getConsumerOrders()
// After: getUserOrders()
const ordersResponse = await orderService.getUserOrders();
```
2. Properly handle API response structures:
```typescript
const favoritesResponse = await favoritesService.getFavorites();
const favoriteCount = favoritesResponse.success && favoritesResponse.data ? 
  favoritesResponse.data.length : 0;
```
3. Fix icon type errors with proper typing:
```typescript
type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];
const features: Array<{ icon: IoniconsName }> = [
  { icon: "bag-handle" as IoniconsName }
];
```
4. Add type guards for API responses:
```typescript
function isSuccessResponse<T>(response: ApiResponse<T>): response is { success: true; data: T } {
  return response.success === true && response.data !== undefined;
}
```

**Diagnostic Procedures**:
- Run TypeScript compiler to identify all type errors
- Check specific error locations in reported files
- Verify API response structures match expected types
- Test type fixes by recompiling

**Section sources**
- [TYPESCRIPT_FIXES.md](file://TYPESCRIPT_FIXES.md)
- [services/types.ts](file://services/types.ts)
- [app/dashboard/consumer.tsx](file://app/dashboard/consumer.tsx)

### Deprecated Props Warnings

**Issue**: Console warnings about deprecated props such as "shadow*" style props and Image resizeMode.

**Root Cause**: Using outdated React Native API patterns that have been deprecated in favor of newer alternatives.

**Reproduction Steps**:
1. Run application in development mode
2. Open browser console or React Native debugger
3. Observe warnings about deprecated props
4. Identify components generating warnings

**Resolution Guidance**:
1. Update deprecated style props:
```typescript
// Before: shadowColor, shadowOffset, etc.
// After: boxShadow
const styles = StyleSheet.create({
  container: {
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  }
});
```
2. Update Image component props:
```typescript
// Before: style.resizeMode
// After: props.resizeMode
<Image source={...} resizeMode="cover" />
```
3. Update pointerEvents prop:
```typescript
// Before: props.pointerEvents
// After: style.pointerEvents
<View style={{ pointerEvents: 'none' }} />
```

**Diagnostic Procedures**:
- Monitor console for deprecation warnings
- Identify components generating warnings
- Check React Native documentation for updated APIs
- Test UI after updating deprecated props

**Section sources**
- [CRITICAL_ERRORS_REPORT.md](file://docs/CRITICAL_ERRORS_REPORT.md#L36-L44)
- [components/**/*.tsx](file://components/)

## Database and Backend Issues

This section addresses database configuration and backend integration issues.

### Supabase Configuration Issues

**Issue**: Database operations fail due to missing or incorrect Supabase configuration.

**Root Cause**: Supabase credentials not configured in environment variables, preventing database access.

**Reproduction Steps**:
1. Attempt to perform database operation (e.g., fetch user data)
2. Observe API call failure
3. Check console for Supabase-related errors
4. Verify environment variables

**Resolution Guidance**:
1. Configure Supabase credentials in `.env` file:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
2. Verify configuration in `config/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```
3. Test database connection with verification script:
```bash
npm run verify-database.sh
```

**Diagnostic Procedures**:
- Check for Supabase configuration warnings in console
- Verify environment variables are set
- Test API calls to Supabase endpoints
- Check network requests for Supabase URL

**Section sources**
- [ISSUES_FOUND.md](file://ISSUES_FOUND.md#L106-L118)
- [config/supabase.ts](file://config/supabase.ts)
- [.env.example](file://.env.example)

### Missing Error Boundaries

**Issue**: Several components lack proper error boundaries, causing the entire app to crash when errors occur.

**Root Cause**: Critical components like cart, checkout, and merchant screens do not have error boundary protection.

**Reproduction Steps**:
1. Introduce error in component (e.g., null reference)
2. Observe app behavior
3. Check if error propagates to entire app
4. Verify error boundary presence

**Resolution Guidance**:
1. Add error boundaries to critical components:
```typescript
import { ErrorBoundary } from '../_components/ErrorBoundary';

<ErrorBoundary>
  <CartScreen />
</ErrorBoundary>
```
2. Implement comprehensive error handling in service calls:
```typescript
try {
  const response = await apiClient.get('/api/cart');
  if (response.success) {
    setCart(response.data);
  } else {
    setError(response.error);
  }
} catch (error) {
  setError('Failed to load cart');
  console.error('Cart load error:', error);
}
```
3. Use the existing error boundary components:
   - `app/_components/ErrorBoundary.tsx`
   - `components/ErrorBoundary.tsx`
   - `components/FormErrorBoundary.tsx`

**Diagnostic Procedures**:
- Review component tree for missing error boundaries
- Test error scenarios to verify containment
- Check for unhandled promise rejections
- Monitor console for uncaught errors

**Section sources**
- [CRITICAL_ERRORS_REPORT.md](file://docs/CRITICAL_ERRORS_REPORT.md#L68-L75)
- [app/_components/ErrorBoundary.tsx](file://app/_components/ErrorBoundary.tsx)
- [components/ErrorBoundary.tsx](file://components/ErrorBoundary.tsx)

## Recommended Debugging Tools and Methodologies

This section provides recommended tools and methodologies for debugging both frontend and backend components of the Brillprime-expo application.

### Frontend Debugging Tools

**React Native Debugger**: Standalone app for debugging React Native applications with React and Redux devtools integration.

**Usage**:
- Install from https://github.com/jhen0409/react-native-debugger
- Enable remote debugging in app
- Inspect components, state, and props
- Debug JavaScript code with breakpoints

**React DevTools**: Browser extension for inspecting React component hierarchy and state.

**Usage**:
- Install React DevTools extension for Chrome/Firefox
- Open developer tools in browser
- Navigate to React tab
- Inspect component tree and props

**Expo Dev Tools**: Built-in tools for Expo applications accessible via terminal.

**Usage**:
- Run `npx expo start`
- Press 'd' to open Dev Tools in browser
- Use features like:
  - QR code scanner
  - Device selection
  - Log viewing
  - Error reporting

**Browser Developer Tools**: Native browser tools for web platform debugging.

**Usage**:
- Open developer tools (F12 or Ctrl+Shift+I)
- Use Console tab for logs and errors
- Use Network tab for API calls
- Use Performance tab for rendering issues
- Use Memory tab for memory leaks

### Backend Debugging Methodologies

**API Testing with curl**: Command-line tool for testing API endpoints directly.

**Examples**:
```bash
# Test backend health
curl https://api.brillprime.com/health

# Test login
curl -X POST https://api.brillprime.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Test cart with token
curl https://api.brillprime.com/api/cart \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Supabase Dashboard**: Web interface for inspecting and managing Supabase database.

**Usage**:
- Navigate to your Supabase project
- Use SQL editor to run queries
- View table data and relationships
- Check authentication users
- Monitor API metrics

**Function Logs**: View logs for Supabase edge functions.

**Usage**:
- Go to Supabase dashboard
- Navigate to Functions section
- View logs for specific functions
- Identify errors and performance issues

### Performance Monitoring Tools

**Expo Performance**: Built-in performance monitoring for Expo applications.

**Usage**:
- Import Performance module:
```typescript
import { Performance } from 'expo';
```
- Measure critical operations:
```typescript
const start = Performance.now();
// operation to measure
const end = Performance.now();
console.log(`Operation took ${end - start}ms`);
```

**Chrome Performance Tab**: Browser tool for analyzing rendering performance.

**Usage**:
- Open Chrome Developer Tools
- Navigate to Performance tab
- Record page load or interaction
- Analyze flame chart for bottlenecks
- Identify long tasks and rendering issues

**Memory Profiling**: Tools for identifying memory leaks.

**Usage**:
- Use Chrome Memory tab to take heap snapshots
- Compare snapshots over time
- Identify objects that are not being garbage collected
- Track down references preventing cleanup

### Recommended Debugging Workflow

1. **Reproduce the Issue**: Consistently reproduce the problem with clear steps
2. **Check Console Logs**: Look for errors, warnings, and log messages
3. **Verify Configuration**: Ensure all environment variables and configuration files are correct
4. **Test API Endpoints**: Use curl or Postman to test backend APIs independently
5. **Inspect Network Requests**: Use browser dev tools to examine request/response details
6. **Check State and Props**: Use React DevTools to inspect component state
7. **Add Logging**: Temporarily add console.log statements to trace execution
8. **Isolate the Problem**: Create minimal reproduction case if possible
9. **Fix and Test**: Implement fix and verify it resolves the issue
10. **Document the Solution**: Update documentation with the resolution

**Section sources**
- [scripts/test-frontend-connection.sh](file://scripts/test-frontend-connection.sh)
- [scripts/test-supabase-functions.sh](file://scripts/test-supabase-functions.sh)
- [docs/api-test-report.md](file://docs/api-test-report.md)