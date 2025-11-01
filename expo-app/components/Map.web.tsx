import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Map, { Marker as MapboxMarker, NavigationControl, GeolocateControl, FullscreenControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_CONFIG } from '../config/mapbox';

type DrawingMode = 'point' | 'polygon' | 'circle' | 'rectangle' | null;

interface MapProps {
  style?: ViewStyle;
  region?: any;
  onRegionChangeComplete?: (region: any) => void;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  showsCompass?: boolean;
  toolbarEnabled?: boolean;
  mapType?: string;
  pitchEnabled?: boolean;
  rotateEnabled?: boolean;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  children?: React.ReactNode;
  provider?: any;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  markers?: Array<{
    coordinate: { latitude: number; longitude: number };
    title?: string;
    description?: string;
  }>;
  enableStoreLocator?: boolean;
  storeLocations?: any[];
  onLocationSelect?: (location: any) => void;
  enableLiveTracking?: boolean;
  trackingUserId?: string;
  onLiveLocationUpdate?: (location: any) => void;
  showSearch?: boolean;
  showDrawingTools?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  onDrawingComplete?: (geojson: any) => void;
}

const MapWeb: React.FC<MapProps> = ({
  style,
  children,
  region,
  initialRegion,
  onRegionChangeComplete,
  enableStoreLocator,
  storeLocations = [],
  onLocationSelect,
  enableLiveTracking,
  trackingUserId,
  onLiveLocationUpdate,
  showSearch = true,
  showDrawingTools = false,
  onMapClick,
  onDrawingComplete,
  markers = [],
  showsUserLocation = false,
  ...props
}) => {
  const [mapError, setMapError] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Set to false as react-map-gl handles loading internally or displays errors directly
  const [searchQuery, setSearchQuery] = useState('');
  const [drawingMode, setDrawingMode] = useState<DrawingMode>(null);
  const mapRef = useRef<any>(null);

  const displayRegion = region || initialRegion || {
    latitude: 6.5244,
    longitude: 3.3792,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  const [viewport, setViewport] = useState({
    longitude: displayRegion.longitude,
    latitude: displayRegion.latitude,
    zoom: Math.round(Math.log(360 / displayRegion.latitudeDelta) / Math.LN2),
  });

  // Update viewport when region changes
  useEffect(() => {
    if (region) {
      setViewport({
        longitude: region.longitude,
        latitude: region.latitude,
        zoom: Math.round(Math.log(360 / region.latitudeDelta) / Math.LN2),
      });
    }
  }, [region]);

  const handleMoveEnd = useCallback((evt: any) => {
    const { viewState } = evt;
    const latitudeDelta = 360 / Math.pow(2, viewState.zoom);

    if (onRegionChangeComplete) {
      onRegionChangeComplete({
        latitude: viewState.latitude,
        longitude: viewState.longitude,
        latitudeDelta: latitudeDelta,
        longitudeDelta: latitudeDelta,
      });
    }
  }, [onRegionChangeComplete]);

  const handleMapClick = useCallback((evt: any) => {
    if (onMapClick) {
      onMapClick(evt.lngLat.lat, evt.lngLat.lng);
    }
  }, [onMapClick]);

  if (mapError) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={32} color="#e74c3c" />
          <Text style={styles.errorText}>Map failed to load</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => setMapError(false)}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // The loading state from the original component is not directly applicable with react-map-gl as it handles loading internally.
  // If a specific loading indicator is needed, it would require more complex logic, possibly watching map.isStyleLoaded().
  // For now, we omit the explicit loading state and rely on the map rendering itself.

  return (
    <View style={[styles.container, style]}>
      <Map
        ref={mapRef}
        {...viewport}
        onMove={(evt) => setViewport(evt.viewState)}
        onMoveEnd={handleMoveEnd}
        onClick={handleMapClick}
        mapboxAccessToken={MAPBOX_CONFIG.ACCESS_TOKEN}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAPBOX_CONFIG.STYLES.STREET}
        onError={() => setMapError(true)}
      >
        <NavigationControl position="top-right" />
        <GeolocateControl position="top-right" />
        <FullscreenControl position="top-right" />

        {/* Render markers */}
        {markers.map((marker, index) => (
          <MapboxMarker
            key={`marker-${index}`}
            longitude={marker.coordinate.longitude}
            latitude={marker.coordinate.latitude}
            anchor="bottom"
          >
            <View style={styles.markerContainer}>
              <Ionicons name="location" size={32} color="#007bff" />
            </View>
          </MapboxMarker>
        ))}

        {/* Render store locations */}
        {storeLocations.map((store, index) => (
          <MapboxMarker
            key={`store-${index}`}
            longitude={store.coords?.lng || store.longitude}
            latitude={store.coords?.lat || store.latitude}
            anchor="bottom"
          >
            <TouchableOpacity onPress={() => onLocationSelect?.(store)}>
              <View style={styles.storeMarkerContainer}>
                <Ionicons name="storefront" size={28} color="#ff4444" />
              </View>
            </TouchableOpacity>
          </MapboxMarker>
        ))}
      </Map>

      {showSearch && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search location..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchButton} activeOpacity={0.7}>
            <MaterialIcons name="search" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6f2ff',
    borderRadius: 15,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#cce0ff',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    zIndex: 1000,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    marginRight: 8,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    marginTop: 10,
    fontWeight: '600',
  },
  retryButton: {
    marginTop: 15,
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export const Marker: React.FC<any> = () => null;
export const PROVIDER_MAPBOX = 'mapbox';

export default MapWeb;
export { MapWeb };