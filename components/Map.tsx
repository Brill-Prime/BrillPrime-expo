import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState, useCallback } from 'react';
import { Platform, View, StyleSheet, Text, ActivityIndicator, ViewStyle } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region, EdgePadding, MapViewProps } from 'react-native-maps';
import './Map.css';

export { PROVIDER_GOOGLE, Marker } from 'react-native-maps';

// Add Google Maps types for web
declare global {
  interface Window {
    initMap: () => void;
    google: any;
  }
}

// Ensure the API key is available
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

if (!GOOGLE_MAPS_API_KEY) {
  console.warn('Google Maps API key is missing. Please set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in your .env file');
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  webMap: {
    width: '100%',
    height: '100%',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    padding: 20,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
});

interface MapProps extends Omit<MapViewProps, 'provider' | 'region' | 'onRegionChange' | 'onRegionChangeComplete'> {
  provider?: typeof PROVIDER_GOOGLE;
  region?: Region;
  onRegionChange?: (region: Region) => void;
  onRegionChangeComplete?: (region: Region) => void;
  style?: ViewStyle;
  webStyle?: React.CSSProperties;
}

const Map = forwardRef<any, MapProps>(({
  provider = PROVIDER_GOOGLE,
  style,
  webStyle,
  region,
  onRegionChange,
  onRegionChangeComplete,
  showsMyLocationButton,
  zoomEnabled,
  mapType,
  customMapStyle,
  onMapReady,
  children,
  ...restProps
}, ref) => {
  const mapRef = useRef<MapView | null>(null);
  const webMapRef = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Show error if API key is missing
  const hasApiKey = !!GOOGLE_MAPS_API_KEY;

  const initMap = useCallback(() => {
    if (!webMapRef.current) return;

    try {
      const mapOptions: google.maps.MapOptions = {
        center: region ? { 
          lat: region.latitude, 
          lng: region.longitude 
        } : { lat: 0, lng: 0 },
        zoom: 12,
        disableDefaultUI: !showsMyLocationButton,
        zoomControl: zoomEnabled,
        mapTypeId: mapType || 'roadmap',
        styles: customMapStyle,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      };

      const newMap = new google.maps.Map(webMapRef.current, mapOptions);
      setMap(newMap);
      onMapReady?.();

      // Set up event listeners
      if (onRegionChange || onRegionChangeComplete) {
        newMap.addListener('drag', () => {
          const center = newMap.getCenter();
          if (onRegionChange && center) {
            onRegionChange({
              latitude: center.lat(),
              longitude: center.lng(),
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            });
          }
        });

        newMap.addListener('idle', () => {
          const center = newMap.getCenter();
          if (onRegionChangeComplete && center) {
            onRegionChangeComplete({
              latitude: center.lat(),
              longitude: center.lng(),
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            });
          }
        });
      }
      
      setIsLoaded(true);
    } catch (err) {
      const errorMsg = 'Failed to initialize map';
      console.error(errorMsg, err);
      setError(errorMsg);
    }
  }, [
    region,
    showsMyLocationButton,
    zoomEnabled,
    mapType,
    customMapStyle,
    onMapReady,
    onRegionChange,
    onRegionChangeComplete
  ]);

  // Web-specific Google Maps initialization
  useEffect(() => {
    if (Platform.OS !== 'web' || !webMapRef.current || map || isLoaded || error) {
      return;
    }

    // Load Google Maps script if not already loaded
    if (!window.google?.maps) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      script.onerror = (error) => {
        const errorMsg = 'Failed to load Google Maps API';
        console.error(errorMsg, error);
        setError(errorMsg);
        setIsLoaded(false);
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
  }, [initMap, map, isLoaded, error]);

  const fitToCoordinates = useCallback((
    coordinates: { latitude: number; longitude: number }[] = [],
    options?: { edgePadding?: Partial<EdgePadding>; animated?: boolean }
  ) => {
    if (Platform.OS === 'web') {
      if (!map || !coordinates.length) return;

      const bounds = new google.maps.LatLngBounds();
      coordinates.forEach((coord) => {
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
  }, [map]);

  const animateToRegion = useCallback((region: Region, duration?: number) => {
    if (Platform.OS === 'web') {
      if (!map) return;
      map.panTo({ lat: region.latitude, lng: region.longitude });
      map.setZoom(region.longitudeDelta ? 15 : 12);
      return;
    }
    mapRef.current?.animateToRegion?.(region, duration);
  }, [map]);

  useImperativeHandle(ref, () => ({
    fitToCoordinates,
    animateToRegion,
  }), [fitToCoordinates, animateToRegion]);

  // Early return for missing API key
  if (!hasApiKey) {
    return (
      <View className="map-error" style={style}>
        <Text className="map-error-text">
          Error: Google Maps API key is missing. Please check your .env file.
        </Text>
      </View>
    );
  }

  // Web rendering
  if (Platform.OS === 'web') {
    if (error) {
      return (
        <View style={[styles.container, style]}>
          <Text style={styles.errorText}>
            {error || 'Failed to load map'}
          </Text>
        </View>
      );
    }

    if (!isLoaded) {
      return (
        <View style={[styles.container, style, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      );
    }

    return (
      <div
        ref={webMapRef}
        className={`map-container ${webStyle}`}
        data-testid="web-map"
      />
    );
  }

  // Native rendering
  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        provider={provider}
        style={StyleSheet.absoluteFillObject}
        region={region}
        onRegionChange={onRegionChange}
        onRegionChangeComplete={onRegionChangeComplete}
        showsMyLocationButton={showsMyLocationButton}
        zoomEnabled={zoomEnabled}
        mapType={mapType}
        customMapStyle={customMapStyle}
        onMapReady={onMapReady}
        {...restProps}
      >
        {children}
      </MapView>
    </View>
  );
});

Map.displayName = 'Map';

export default Map;