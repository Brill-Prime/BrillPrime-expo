
import React from 'react';
import { Platform } from 'react-native';

// Default fallback component
const FallbackMap = ({ children, style, ...props }: any) => {
  const { View, Text } = require('react-native');
  const { Ionicons } = require('@expo/vector-icons');
  
  return React.createElement(
    View, 
    { 
      style: [
        { 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center',
          backgroundColor: '#f0f8ff',
          borderRadius: 15,
          minHeight: 200
        }, 
        style
      ] 
    },
    React.createElement(Ionicons, { name: 'map', size: 32, color: '#4682B4' }),
    React.createElement(Text, { style: { marginTop: 10, color: '#666' } }, 'Map loading...'),
    children
  );
};

const FallbackMarker = ({ children }: any) => children;

// Platform-specific Map exports
let MapComponent: any = FallbackMap;
let ProviderGoogle: any = 'web';
let MarkerComponent: any = FallbackMarker;

if (Platform.OS === 'web') {
  try {
    const WebMapModule = require('./Map.web');
    MapComponent = WebMapModule.default || WebMapModule.MapWeb || FallbackMap;
    ProviderGoogle = WebMapModule.PROVIDER_GOOGLE || 'web';
    MarkerComponent = WebMapModule.Marker || FallbackMarker;
  } catch (error) {
    console.warn('Web Map component failed to load, using fallback:', error);
  }
} else {
  try {
    const NativeMapModule = require('./Map.native');
    MapComponent = NativeMapModule.default || FallbackMap;
    ProviderGoogle = NativeMapModule.PROVIDER_GOOGLE || 'google';
    MarkerComponent = NativeMapModule.Marker || FallbackMarker;
  } catch (error) {
    console.warn('Native Map component failed to load, using web fallback:', error);
    try {
      const WebMapModule = require('./Map.web');
      MapComponent = WebMapModule.default || WebMapModule.MapWeb || FallbackMap;
      ProviderGoogle = 'web';
      MarkerComponent = WebMapModule.Marker || FallbackMarker;
    } catch (webError) {
      console.warn('Fallback to web map also failed:', webError);
    }
  }
}

// Ensure we always export valid components
const SafeMapComponent = React.memo(MapComponent);
const SafeMarkerComponent = React.memo(MarkerComponent);

export default SafeMapComponent;
export const PROVIDER_GOOGLE = ProviderGoogle;
export const Marker = SafeMarkerComponent;
