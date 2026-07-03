import React, { forwardRef } from 'react';
import { Platform } from 'react-native';

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
};

type MapViewProps = {
  provider?: any;
  region?: Region;
  onRegionChange?: (region: Region) => void;
  onRegionChangeComplete?: (region: Region) => void;
  style?: any;
  webStyle?: React.CSSProperties;
  userType?: 'consumer' | 'merchant' | 'driver';
  origin?: { latitude: number; longitude: number };
  destination?: { latitude: number; longitude: number };
  waypoints?: Array<{ latitude: number; longitude: number }>;
  showRoute?: boolean;
  eta?: string;
  children?: React.ReactNode;
  [key: string]: any;
};

const PROVIDER_GOOGLE = 'google';
const Marker = ({ 
  children,
  coordinate,
  title,
  description,
  onPress,
  pinColor,
  rotation,
  ...props
}: any) => <>{children}</>;

export { PROVIDER_GOOGLE, Marker };

let MapImplementation: any;

if (Platform.OS === 'web') {
  console.warn('[Map.tsx] This file should not be used on web. Map.web.tsx should be loaded instead.');
  MapImplementation = require('./Map.web.tsx').default;
} else {
  MapImplementation = require('./Map.native.tsx').default;
}

interface MapProps extends Omit<MapViewProps, 'provider' | 'region' | 'onRegionChange' | 'onRegionChangeComplete'> {
  provider?: typeof PROVIDER_GOOGLE;
  region?: Region;
  onRegionChange?: (region: Region) => void;
  onRegionChangeComplete?: (region: Region) => void;
  style?: any;
  webStyle?: React.CSSProperties;
  userType?: 'consumer' | 'merchant' | 'driver';
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