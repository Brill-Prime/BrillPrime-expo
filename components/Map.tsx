
import { Platform } from 'react-native';

// Platform-specific Map exports
let MapComponent: any;
let ProviderGoogle: any;
let MarkerComponent: any;

if (Platform.OS === 'web') {
  // Web implementation
  try {
    const WebMap = require('./Map.web');
    MapComponent = WebMap.default || WebMap;
    ProviderGoogle = WebMap.PROVIDER_GOOGLE || 'web';
    MarkerComponent = WebMap.Marker;
  } catch (error) {
    console.error('Error loading web Map component:', error);
    // Create a fallback component
    MapComponent = ({ children, ...props }: any) => {
      const React = require('react');
      const { View, Text } = require('react-native');
      return React.createElement(View, { style: { flex: 1, justifyContent: 'center', alignItems: 'center' } }, 
        React.createElement(Text, null, 'Map loading...'),
        children
      );
    };
    ProviderGoogle = 'web';
    MarkerComponent = ({ children }: any) => children;
  }
} else {
  // Native implementation (iOS/Android)
  try {
    const NativeMap = require('./Map.native');
    MapComponent = NativeMap.default;
    ProviderGoogle = NativeMap.PROVIDER_GOOGLE;
    MarkerComponent = NativeMap.Marker;
  } catch (error) {
    console.error('Error loading native Map component:', error);
    // Fallback to web implementation
    const WebMap = require('./Map.web');
    MapComponent = WebMap.default || WebMap;
    ProviderGoogle = 'web';
    MarkerComponent = WebMap.Marker;
  }
}

// Ensure we always export valid components
const SafeMapComponent = MapComponent || (() => null);
const SafeMarkerComponent = MarkerComponent || (() => null);
const SafeProviderGoogle = ProviderGoogle || 'web';

export default SafeMapComponent;
export const PROVIDER_GOOGLE = SafeProviderGoogle;
export const Marker = SafeMarkerComponent;
