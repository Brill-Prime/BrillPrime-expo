# Map and Location Improvements

## Overview

Enhanced the consumer home screen map to automatically detect user location, display custom markers for users/merchants/drivers, and work seamlessly across web, iOS, and Android platforms.

## Issues Fixed

### 1. **No Automatic Location Detection**
**Problem:** Users had to manually click "Set Location Automatically" to enable location tracking.

**Solution:** Added automatic location permission request and detection on component mount:
- Checks for saved location first
- If no saved location, automatically requests permission
- Gets current location and centers map
- Saves location for future sessions
- Loads nearby merchants automatically

### 2. **Custom Markers Not Rendering on Web**
**Problem:** The Map.web.tsx component only created basic Google Maps markers, losing all custom styling from React components.

**Solution:** Implemented custom Google Maps Overlay class:
- Extracts custom React marker content from children
- Renders React components as HTML overlays on the map
- Preserves all styling, z-index, and interactions
- Supports rotation for directional markers (user heading)
- Maintains click handlers and custom designs

### 3. **Marker Z-Index Conflicts**
**Problem:** Markers could overlap incorrectly, with merchants appearing above user location.

**Solution:** Implemented proper z-index layering:
- User marker: z-index 200 (highest - always visible)
- Driver markers: z-index 100 (middle layer)
- Merchant markers: z-index 50 (lowest layer)
- Added position: 'relative' to enable z-index on all platforms

### 4. **Inconsistent Marker Designs Across Platforms**
**Problem:** Marker styles were defined inline, making them hard to maintain and inconsistent.

**Solution:** Created reusable marker components:
- `UserMarker`: 3D pin design with person icon
- `MerchantMarker`: Store icon with category support
- `DriverMarker`: Car icon with status indicator
- All components work identically on web, iOS, and Android

## Changes Made

### Files Modified

#### 1. `components/Map.web.tsx`
- Added custom overlay class for rendering React components as map markers
- Enhanced marker extraction to preserve custom content
- Implemented z-index handling from React styles
- Added support for marker rotation
- Improved click handler preservation

#### 2. `app/home/consumer.tsx`
- Added automatic location permission request on mount
- Integrated auto-detection of user location
- Updated marker rendering to use new marker components
- Added z-index to marker styles
- Improved location initialization flow

#### 3. `components/MapMarkers.tsx` (New File)
- Created `UserMarker` component with 3D pin design
- Created `MerchantMarker` component with store icon
- Created `DriverMarker` component with status indicator
- Implemented consistent styling across all platforms
- Added proper z-index layering

## Features

### Automatic Location Detection
```typescript
// On mount, automatically:
1. Check for saved location
2. Request location permission if needed
3. Get current GPS coordinates
4. Center map on user location
5. Load nearby merchants
6. Save location for future use
```

### Custom Marker Rendering (Web)
```typescript
// Custom overlay class renders React components:
- Extracts marker content from children
- Creates HTML overlay on Google Maps
- Preserves all React styling
- Supports click handlers
- Handles rotation for directional markers
```

### Cross-Platform Marker Components
```typescript
// Consistent markers across all platforms:
<UserMarker isMoving={true} heading={45} />
<MerchantMarker category="restaurant" />
<DriverMarker status="available" />
```

### Z-Index Layering
```
User Location (200) ← Always on top
    ↓
Driver Markers (100) ← Middle layer
    ↓
Merchant Markers (50) ← Bottom layer
```

## Usage

### Consumer Home Screen

The map now automatically:
1. Requests location permission on first load
2. Detects and displays user's current location
3. Shows nearby merchants with custom markers
4. Displays available drivers with status indicators
5. Updates user location in real-time when moving

### Marker Types

**User Location Marker:**
- 3D pin design with person icon
- Blue color (#4682B4)
- Rotates based on movement direction
- Always visible on top (z-index: 200)

**Merchant Markers:**
- Store icon with orange background
- White circular container
- Clickable to show merchant details
- Z-index: 50

**Driver Markers:**
- Car icon with blue background
- Status indicator (green/orange/red)
- Shows availability status
- Z-index: 100

## Cross-Platform Compatibility

### Web
- Uses Google Maps JavaScript API
- Custom overlays for React marker rendering
- Supports all marker interactions
- Proper z-index layering

### iOS
- Uses react-native-maps with Google Maps
- Native marker rendering
- Full gesture support
- Hardware-accelerated animations

### Android
- Uses react-native-maps with Google Maps
- Native marker rendering
- Full gesture support
- Material Design elevation

## Technical Details

### Custom Overlay Implementation

```typescript
class CustomOverlay extends google.maps.OverlayView {
  // Renders React components as HTML overlays
  // Preserves styling, z-index, and interactions
  // Supports rotation and custom positioning
}
```

### Location Permission Flow

```
1. Component mounts
2. Check for saved location
3. If no saved location:
   a. Request permission
   b. Get current location
   c. Center map
   d. Load merchants
   e. Save location
4. If saved location:
   a. Load from storage
   b. Center map
   c. Load merchants
```

### Marker Rendering Flow

```
1. Extract markers from children
2. Validate coordinates
3. For each marker:
   a. Check for custom content
   b. If custom: Create overlay
   c. If standard: Create marker
   d. Apply z-index
   e. Add click handlers
```

## Performance Optimizations

1. **Memoized Marker Extraction**: Uses React.useMemo to prevent unnecessary re-renders
2. **Significant Movement Threshold**: Only updates location when user moves >50 meters
3. **Debounced Region Changes**: Prevents feedback loops from map updates
4. **Lazy Merchant Loading**: Loads merchants only when location is set
5. **Cleanup on Unmount**: Properly removes all markers and overlays

## Testing

### Manual Testing Checklist

- [ ] Web: Map loads with Google Maps
- [ ] Web: Location permission prompt appears
- [ ] Web: User location marker displays correctly
- [ ] Web: Merchant markers display with custom design
- [ ] Web: Driver markers display with status indicator
- [ ] Web: Markers have correct z-index layering
- [ ] Web: Clicking merchant marker shows details
- [ ] iOS: Map loads with native rendering
- [ ] iOS: Location permission prompt appears
- [ ] iOS: All markers display correctly
- [ ] Android: Map loads with native rendering
- [ ] Android: Location permission prompt appears
- [ ] Android: All markers display correctly

### Automated Testing

Test file: `components/__tests__/MapMarkers.test.tsx` (to be created)

```typescript
describe('MapMarkers', () => {
  it('renders UserMarker with correct styling');
  it('renders MerchantMarker with category');
  it('renders DriverMarker with status indicator');
  it('applies correct z-index to markers');
  it('rotates UserMarker based on heading');
});
```

## Known Limitations

1. **ReactDOM Dependency**: Custom overlays on web require ReactDOM to be available
2. **Fallback Markers**: If ReactDOM is not available, falls back to basic circular markers
3. **Z-Index on Web**: Requires CSS z-index support in browser
4. **Permission Timing**: Some browsers may delay permission prompts

## Future Enhancements

1. **Marker Clustering**: Group nearby merchants when zoomed out
2. **Animated Transitions**: Smooth marker animations when appearing/disappearing
3. **Custom Info Windows**: Rich popups with merchant details
4. **Route Visualization**: Show directions from user to merchant
5. **Real-Time Updates**: WebSocket connection for live driver locations
6. **Offline Support**: Cache map tiles for offline viewing

## Migration Guide

### For Developers

If you're using the Map component elsewhere:

**Before:**
```typescript
<Map>
  <Marker coordinate={coords}>
    <View style={customStyle}>
      <Icon name="pin" />
    </View>
  </Marker>
</Map>
```

**After (Recommended):**
```typescript
import { UserMarker, MerchantMarker, DriverMarker } from '@/components/MapMarkers';

<Map>
  <Marker coordinate={coords}>
    <UserMarker isMoving={true} heading={45} />
  </Marker>
</Map>
```

### Benefits of Using MapMarkers Components

1. Consistent design across all screens
2. Automatic z-index handling
3. Cross-platform compatibility guaranteed
4. Easier to maintain and update
5. Type-safe props with TypeScript

## Troubleshooting

### Map Not Loading on Web

**Issue:** Map shows loading spinner indefinitely

**Solutions:**
1. Check `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` in .env
2. Verify API key has Maps JavaScript API enabled
3. Check browser console for errors
4. Ensure internet connection is available

### Location Permission Denied

**Issue:** User location not showing

**Solutions:**
1. Check browser/device location settings
2. Ensure HTTPS connection (required for geolocation)
3. Clear browser cache and reload
4. Check for permission prompt blockers

### Markers Not Displaying

**Issue:** Markers don't appear on map

**Solutions:**
1. Verify coordinates are valid (not NaN or Infinity)
2. Check marker is within map bounds
3. Ensure map is fully initialized (mapReady === true)
4. Check z-index conflicts with other UI elements

### Custom Markers Not Rendering on Web

**Issue:** Markers show as basic pins instead of custom design

**Solutions:**
1. Ensure ReactDOM is loaded
2. Check browser console for rendering errors
3. Verify marker children are valid React elements
4. Check CSS styles are being applied

## References

- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [react-native-maps Documentation](https://github.com/react-native-maps/react-native-maps)
- [Expo Location API](https://docs.expo.dev/versions/latest/sdk/location/)
- [Google Maps Overlays](https://developers.google.com/maps/documentation/javascript/customoverlays)

## Support

For issues or questions:
1. Check this documentation first
2. Review the code comments in Map.web.tsx
3. Test on multiple platforms (web, iOS, Android)
4. Check browser/device console for errors
5. Verify API keys and permissions are configured correctly
