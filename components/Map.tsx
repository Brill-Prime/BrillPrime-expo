import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Platform, View, StyleSheet, Text } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region, EdgePadding } from 'react-native-maps';

export { PROVIDER_GOOGLE, Marker } from 'react-native-maps';

interface MapProps {
  provider?: typeof PROVIDER_GOOGLE;
  style?: any;
  region?: Region;
  onRegionChange?: (region: Region) => void;
  onRegionChangeComplete?: (region: Region) => void;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  showsCompass?: boolean;
  rotateEnabled?: boolean;
  pitchEnabled?: boolean;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  mapType?: 'standard' | 'satellite' | 'hybrid';
  customMapStyle?: any[];
  onMapReady?: () => void;
  children?: React.ReactNode;
}

const Map = forwardRef<any, MapProps>((props, ref) => {
  const mapRef = useRef<MapView | null>(null);

  useImperativeHandle(ref, () => ({
    fitToCoordinates: (
      coordinates: { latitude: number; longitude: number }[] = [],
      options?: { edgePadding?: Partial<EdgePadding>; animated?: boolean }
    ) => {
      if (Platform.OS === 'web') return;
      const normalizedPadding: EdgePadding | undefined = options?.edgePadding
        ? {
            top: options.edgePadding.top ?? 0,
            right: options.edgePadding.right ?? 0,
            bottom: options.edgePadding.bottom ?? 0,
            left: options.edgePadding.left ?? 0,
          }
        : undefined;
      mapRef.current?.fitToCoordinates?.(coordinates, {
        edgePadding: normalizedPadding,
        animated: options?.animated,
      });
    },
    animateToRegion: (region: Region, duration?: number) => {
      if (Platform.OS === 'web') return;
      mapRef.current?.animateToRegion?.(region, duration);
    },
  }));

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, props.style]}>
        <View style={styles.webPlaceholder}>
          <Text style={styles.webPlaceholderText}>
            Map view is unavailable in the web preview. Please use the mobile app or native preview to see the live map.
          </Text>
        </View>
      </View>
    );
  }

  // Native platforms (iOS/Android) use Google Maps via react-native-maps
  return (
    <View style={[styles.container, props.style]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={props.region}
        onRegionChange={props.onRegionChange}
        onRegionChangeComplete={props.onRegionChangeComplete}
        showsUserLocation={props.showsUserLocation}
        showsMyLocationButton={props.showsMyLocationButton}
        showsCompass={props.showsCompass}
        rotateEnabled={props.rotateEnabled}
        pitchEnabled={props.pitchEnabled}
        scrollEnabled={props.scrollEnabled}
        zoomEnabled={props.zoomEnabled}
        mapType={props.mapType}
        customMapStyle={props.customMapStyle}
        onMapReady={props.onMapReady}
      >
        {props.children}
      </MapView>
    </View>
  );
});

Map.displayName = 'Map';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  webPlaceholder: {
    flex: 1,
    backgroundColor: '#e6f0ff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#c3d4ff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  webPlaceholderText: {
    color: '#0B1A51',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
  },
});

export default Map;