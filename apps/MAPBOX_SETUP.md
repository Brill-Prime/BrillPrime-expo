
# Mapbox Setup Guide

This app uses Mapbox for map rendering on native platforms and can fallback to OpenStreetMap (via Leaflet) on web.

## Getting a Mapbox Token

1. Go to [https://account.mapbox.com/](https://account.mapbox.com/)
2. Sign up for a free account (or log in if you already have one)
3. Navigate to [https://account.mapbox.com/access-tokens/](https://account.mapbox.com/access-tokens/)
4. Click "Create a token"
5. Give it a name (e.g., "BrillPrime Development")
6. Keep the default scopes selected
7. Click "Create token"
8. Copy the token (starts with `pk.`)

## Configuration

1. Create a `.env` file in the `apps` directory (if it doesn't exist)
2. Add your Mapbox token:

```env
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_actual_token_here
```

3. Restart your development server

## Fallback Behavior

- **Web**: If no valid Mapbox token is found, the app automatically falls back to OpenStreetMap via Leaflet
- **Native (iOS/Android)**: Requires a valid Mapbox token to function

## Free Tier Limits

Mapbox's free tier includes:
- 50,000 map loads per month
- 100,000 requests to other APIs
- Perfect for development and small-scale production

## Troubleshooting

### "Failed to load map" error
- Check that your token is correctly set in `.env`
- Ensure the token starts with `pk.`
- Verify the token is active in your Mapbox account
- Check browser console for specific error messages

### Web map shows OpenStreetMap instead of Mapbox
- This is normal fallback behavior when no token is configured
- Add a valid Mapbox token to use Mapbox tiles on web

### Native apps crash on map screen
- Ensure `@rnmapbox/maps` is properly installed
- Check that your Mapbox token is configured
- Run `npx expo prebuild` to regenerate native projects
