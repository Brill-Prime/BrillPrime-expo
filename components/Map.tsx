
import { Platform } from 'react-native';

// Platform-specific Map exports
let MapComponent: any;
let ProviderGoogle: any;
let MarkerComponent: any;

try {
  if (Platform.OS === 'web') {
    // Web implementation
    const WebMap = require('./Map.web');
    MapComponent = WebMap.default;
    ProviderGoogle = WebMap.PROVIDER_GOOGLE || 'web';
    MarkerComponent = WebMap.Marker;
  } else {
    // Native implementation (iOS/Android)
    const NativeMap = require('./Map.native');
    MapComponent = NativeMap.default;
    ProviderGoogle = NativeMap.PROVIDER_GOOGLE;
    MarkerComponent = NativeMap.Marker;
  }
} catch (error) {
  console.error('Error loading Map component:', error);
  // Fallback to web implementation
  const WebMap = require('./Map.web');
  MapComponent = WebMap.default;
  ProviderGoogle = 'web';
  MarkerComponent = WebMap.Marker;
}

export default MapComponent;
export const PROVIDER_GOOGLE = ProviderGoogle;
export const Marker = MarkerComponent;
