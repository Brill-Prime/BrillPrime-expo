# Google Maps Setup Guide

This app now uses **Google Maps for all platforms** (Web, iOS, Android).

## Required Configuration

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Maps JavaScript API
   - Places API (if using place search features)
   - Directions API (if using routing features)
4. Go to **Credentials** and create an API key
5. Restrict the API key (recommended):
   - For Android: Add your app's package name and SHA-1 certificate fingerprint
   - For iOS: Add your app's bundle identifier
   - For Web: Add your domain(s)

### 2. Add API Key to Environment Variables

Add the following to your `.env` file:

```bash
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
```

**Important:** The API key must be prefixed with `EXPO_PUBLIC_` to be accessible in the app.

### 3. Platform-Specific Configuration

#### Android
The API key is automatically configured in `AndroidManifest.xml` via the app.config.js.

#### iOS
The API key is automatically configured in Info.plist via the app.config.js.

#### Web
The API key is loaded from environment variables and used in the WebView-based Google Maps implementation.

## Verification

After adding your API key:

1. Restart the development server:
   ```bash
   npm start
   ```

2. Check the console for any Google Maps errors

3. Test on each platform:
   - Web: Should show Google Maps in browser
   - Android: Run `npm run android`
   - iOS: Run `npm run ios`

## Troubleshooting

### Map not loading on Web
- Verify `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` is set in `.env`
- Check browser console for API key errors
- Ensure JavaScript API is enabled in Google Cloud Console

### Map not loading on Android
- Verify API key in `.env`
- Ensure Maps SDK for Android is enabled
- Check that package name matches in Google Cloud Console restrictions

### Map not loading on iOS
- Verify API key in `.env`
- Ensure Maps SDK for iOS is enabled
- Check that bundle identifier matches in Google Cloud Console restrictions

## Migration from Leaflet

All Leaflet dependencies have been removed:
- ❌ `leaflet` package removed
- ❌ `react-leaflet` package removed
- ❌ `@types/leaflet` package removed
- ✅ Using `react-native-maps` for native platforms
- ✅ Using Google Maps JavaScript API for web

## Cost Considerations

Google Maps API has a free tier with monthly credits. Monitor your usage in the Google Cloud Console to avoid unexpected charges.

For development, consider:
- Setting daily quotas
- Using API key restrictions
- Monitoring usage in Google Cloud Console
