import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region, EdgePadding } from 'react-native-maps';

export { PROVIDER_GOOGLE, Marker } from 'react-native-maps';

// Add Google Maps types for web
declare global {
  interface Window {
    initMap: () => void;
    google: any;
  }
}

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
  const webMapRef = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  // Web-specific Google Maps initialization
  useEffect(() => {
    if (Platform.OS !== 'web' || !webMapRef.current || map) return;

    const initMap = () => {
      if (!webMapRef.current) return;

      const mapOptions: google.maps.MapOptions = {
        center: props.region || { lat: 0, lng: 0 },
        zoom: 12,
        disableDefaultUI: !props.showsMyLocationButton,
        zoomControl: props.zoomEnabled,
        mapTypeId: props.mapType || 'roadmap',
        styles: props.customMapStyle,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      };

      const newMap = new google.maps.Map(webMapRef.current, mapOptions);
      setMap(newMap);

      if (props.onMapReady) {
        props.onMapReady();
      }

      // Set up event listeners
      if (props.onRegionChange || props.onRegionChangeComplete) {
        newMap.addListener('drag', () => {
          const center = newMap.getCenter();
          const zoom = newMap.getZoom();
          const region = {
            latitude: center?.lat() || 0,
            longitude: center?.lng() || 0,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          };
          props.onRegionChange?.(region);
        });

        newMap.addListener('idle', () => {
          const center = newMap.getCenter();
          const zoom = newMap.getZoom();
          const region = {
            latitude: center?.lat() || 0,
            longitude: center?.lng() || 0,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          };
          props.onRegionChangeComplete?.(region);
        });
      }
    };

    // Load Google Maps script if not already loaded
    if (!window.google?.maps) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      script.onerror = (error) => {
        console.error('Error loading Google Maps:', error);
      };
      document.head.appendChild(script);

      return () => {
        if (script.parentNode) {
          document.head.removeChild(script);
        }
      };
    } else {
      initMap();
    }
  }, [
    map,
    props.region,
    props.mapType,
    props.customMapStyle,
    props.showsMyLocationButton,
    props.zoomEnabled,
    props.onMapReady,
    props.onRegionChange,
    props.onRegionChangeComplete
  ]);

  useImperativeHandle(ref, () => ({
    fitToCoordinates: (
      coordinates: { latitude: number; longitude: number }[] = [],
      options?: { edgePadding?: Partial<EdgePadding>; animated?: boolean }
    ) => {
      if (Platform.OS === 'web') {
        if (!map || !coordinates.length) return;
        
        const bounds = new google.maps.LatLngBounds();
        coordinates.forEach(coord => {
          bounds.extend(new google.maps.LatLng(coord.latitude, coord.longitude));
        });
        
        map.fitBounds(bounds, options?.edgePadding);
        return;
      }
      
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
      if (Platform.OS === 'web') {
        if (!map) return;
        map.panTo({ lat: region.latitude, lng: region.longitude });
        map.setZoom(region.longitudeDelta ? 15 : 12);
        return;
      }
      mapRef.current?.animateToRegion?.(region, duration);
    },
  }));

  if (Platform.OS === 'web') {
    return (
      <div 
        ref={webMapRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          minHeight: '400px',
          ...props.style 
        }} 
      />
    );
  }

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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#c3d4ff',
  },
  webPlaceholder: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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