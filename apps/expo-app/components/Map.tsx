import React from 'react';
import { Platform } from 'react-native';

let MapComponent: any;
let ProviderGoogle: any;
let MarkerComponent: any;

if (Platform.OS === 'web') {
  const WebMapModule = require('./Map.web');
  MapComponent = WebMapModule.default || WebMapModule.MapWeb;
  ProviderGoogle = WebMapModule.PROVIDER_GOOGLE || 'web';
  MarkerComponent = WebMapModule.Marker;
} else {
  try {
    const NativeMapModule = require('./Map.native');
    MapComponent = NativeMapModule.default;
    ProviderGoogle = NativeMapModule.PROVIDER_GOOGLE || 'google';
    MarkerComponent = NativeMapModule.Marker;
  } catch (error) {
    console.warn('Native Map component failed to load, using web fallback:', error);
    const WebMapModule = require('./Map.web');
    MapComponent = WebMapModule.default || WebMapModule.MapWeb;
    ProviderGoogle = 'web';
    MarkerComponent = WebMapModule.Marker;
  }
}

export default MapComponent;
export const PROVIDER_GOOGLE = ProviderGoogle;
export const Marker = MarkerComponent;
export const MapView = MapComponent;
