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

let MapImplementation: any;
let Marker: any;
let PROVIDER_GOOGLE: any;

if (Platform.OS === 'web') {
  MapImplementation = require('./Map.web').default;
  const webMap = require('./Map.web');
  Marker = webMap.Marker || (({ children }: any) => <>{children}</>);
  PROVIDER_GOOGLE = webMap.PROVIDER_GOOGLE || 'google';
} else {
  MapImplementation = require('./Map.native').default;
  const nativeMap = require('./Map.native');
  Marker = nativeMap.Marker || (({ children }: any) => <>{children}</>);
  PROVIDER_GOOGLE = nativeMap.PROVIDER_GOOGLE || 'google';
}

export { PROVIDER_GOOGLE, Marker };

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