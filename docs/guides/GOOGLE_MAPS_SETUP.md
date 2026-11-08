# Mobile Mapbox and Google Maps Services

BrillPrime uses **Mapbox for Android and iOS maps**. The web map remains Google Maps, and Google Places/directions integrations may still use the Google Maps API key.

## Configure the Mapbox token

1. In your Mapbox account, create a **public** access token beginning with `pk.`.
2. Add it to your local `.env` file:

   ```dotenv
   EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.ey...
   ```

   Do not use a secret `sk.` token in the app or in an `EXPO_PUBLIC_` variable. The public token is bundled into the mobile app; restrict it in Mapbox to the scopes and application usage your project needs.
3. Rebuild and reinstall the Android or iOS development app:

   ```powershell
   npx expo run:android
   # or
   npx expo run:ios
   ```

   Start Metro for that build with `npx expo start --dev-client`. Mapbox includes native code and cannot be added to Expo Go or an already-installed development build by hot reload alone.

   If the app is opened in Expo Go or an older development build, native Mapbox is unavailable. The app keeps its routes usable by temporarily rendering the native Google Maps fallback; install a newly built app to use Mapbox.

## Google Maps API key

Keep `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` configured if the app uses the Google Maps web view, Places search, or Google directions services. It is not the native Android/iOS map renderer.

## Troubleshooting

- **Mapbox configuration error:** confirm `.env` has the `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` variable and that its value starts with `pk.`; restart Expo and rebuild the native app.
- **Mapbox native code not available:** install the newly rebuilt development app, not Expo Go or an older APK. Until then, the app uses the native Google Maps fallback.
- **Map tiles do not load:** check that the token is active, has the required public scopes, and has not been restricted in a way that blocks the app.
- **Google Places or web maps fail:** separately check the Google API key and enable the required Google APIs for those features.
