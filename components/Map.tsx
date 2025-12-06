import React, { forwardRef } from 'react';
import { Platform } from 'react-native';
import { PROVIDER_GOOGLE, Region, EdgePadding, MapViewProps } from 'react-native-maps';

export { PROVIDER_GOOGLE, Marker } from 'react-native-maps';

// Platform-specific map implementations
let MapImplementation: any;

if (Platform.OS === 'web') {
  // On web, this file should NOT be used - Map.web.tsx should be used instead
  // This is a fallback in case platform resolution fails
  console.warn('[Map.tsx] This file should not be used on web. Map.web.tsx should be loaded instead.');
  MapImplementation = require('./Map.web.tsx').default;
} else {
  // On native platforms, use Map.native.tsx
  MapImplementation = require('./Map.native.tsx').default;
}

interface MapProps extends Omit<MapViewProps, 'provider' | 'region' | 'onRegionChange' | 'onRegionChangeComplete'> {
  provider?: typeof PROVIDER_GOOGLE;
  region?: Region;
  onRegionChange?: (region: Region) => void;
  onRegionChangeComplete?: (region: Region) => void;
  style?: any;
  webStyle?: React.CSSProperties;
  userType?: 'consumer' | 'merchant' | 'driver'; // User role for distinct markers
  // Route directions props
  origin?: { latitude: number; longitude: number };
  destination?: { latitude: number; longitude: number };
  waypoints?: Array<{ latitude: number; longitude: number }>;
  showRoute?: boolean;
  eta?: string;
}

const Map = forwardRef<any, MapProps>(({ userType, ...props }, ref) => {
  return <MapImplementation {...props} ref={ref} />;
});

Map.displayName = 'Map';

export default Map;