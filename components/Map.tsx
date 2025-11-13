import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker as RNMarker, Region } from 'react-native-maps';

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
  onError?: () => void;
  children?: React.ReactNode;
}

const Map = forwardRef<MapView, MapProps>((props, ref) => {
  const mapRef = useRef<MapView>(null);

  useImperativeHandle(ref, () => mapRef.current as MapView);

  return (
    <View style={[styles.container, props.style]}>
      <MapView
        ref={mapRef}
        provider={props.provider || PROVIDER_GOOGLE}
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
        onError={props.onError}
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
});

export default Map;