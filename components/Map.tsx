// Platform-specific Map exports
import { Platform } from 'react-native';

let MapComponent: any;
let ProviderGoogle: any;
let MarkerComponent: any;

if (Platform.OS === 'web') {
  // Web implementation
  const WebMap = require('./Map.web');
  MapComponent = WebMap.default;
  ProviderGoogle = WebMap.PROVIDER_GOOGLE;
  MarkerComponent = WebMap.Marker;
} else {
  // Native implementation (iOS/Android)
  const NativeMap = require('./Map.native');
  MapComponent = NativeMap.default;
  ProviderGoogle = NativeMap.PROVIDER_GOOGLE;
  MarkerComponent = NativeMap.Marker;
}

export default MapComponent;
export const PROVIDER_GOOGLE = ProviderGoogle;
export const Marker = MarkerComponent;