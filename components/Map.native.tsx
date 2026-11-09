import React, { forwardRef } from 'react';
import { View } from 'react-native';

let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = 'google';

try {
  const maps = require('react-native-maps');
  MapView = maps.default || maps;
  Marker = maps.Marker;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
} catch (error) {
  console.warn('[Map.native.tsx] react-native-maps unavailable:', error);
}

if (!Marker) {
  Marker = ({ children }: any) => <>{children}</>;
}

// Export for iOS and Android - uses Google Maps
export { Marker, PROVIDER_GOOGLE };

interface ExtendedMapViewProps {
  origin?: { latitude: number; longitude: number };
  destination?: { latitude: number; longitude: number };
  waypoints?: Array<{ latitude: number; longitude: number }>;
  showRoute?: boolean;
  eta?: string;
  userType?: 'consumer' | 'merchant' | 'driver';
  children?: React.ReactNode;
  [key: string]: any;
}

const ExtendedMapView = forwardRef<any, ExtendedMapViewProps>((props, ref) => {
  const {
    origin,
    destination,
    waypoints,
    showRoute,
    eta,
    userType,
    ...mapViewProps
  } = props;

  if (!MapView) {
    return <View {...mapViewProps} />;
  }

  return <MapView ref={ref} {...mapViewProps} />;
});

ExtendedMapView.displayName = 'ExtendedMapView';

export default ExtendedMapView;