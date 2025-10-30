
import React from 'react';
import { Platform } from 'react-native';

let MapComponent: any;
let ProviderMapbox: any;
let MarkerComponent: any;

if (Platform.OS === 'web') {
  const WebMapModule = require('./Map.web');
  MapComponent = WebMapModule.default || WebMapModule.MapWeb;
  ProviderMapbox = WebMapModule.PROVIDER_MAPBOX || 'mapbox';
  MarkerComponent = WebMapModule.Marker;
} else {
  try {
    const NativeMapModule = require('./Map.native');
    MapComponent = NativeMapModule.default;
    ProviderMapbox = NativeMapModule.PROVIDER_MAPBOX || 'mapbox';
    MarkerComponent = NativeMapModule.Marker;
  } catch (error) {
    console.warn('Native Mapbox component failed to load, using web fallback:', error);
    const WebMapModule = require('./Map.web');
    MapComponent = WebMapModule.default || WebMapModule.MapWeb;
    ProviderMapbox = 'mapbox';
    MarkerComponent = WebMapModule.Marker;
  }
}

export default MapComponent;
export const PROVIDER_MAPBOX = ProviderMapbox;
export const PROVIDER_GOOGLE = ProviderMapbox; // Keep for backward compatibility
export const Marker = MarkerComponent;
export const MapView = MapComponent;
