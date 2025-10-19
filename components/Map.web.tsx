import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as locationService from '../services/locationService'; // Assuming locationService is available

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
  markers = [],
  showsUserLocation = false,
  ...props
}) => {
  const [mapError, setMapError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [liveLocations, setLiveLocations] = useState<any[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<any>(null);
  const [MapComponents, setMapComponents] = useState<any>(null);
  const mapRef = useRef<any>(null);

  const displayRegion = region || initialRegion || {
    latitude: 6.5244,
    longitude: 3.3792,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  // Convert latitudeDelta to zoom level
  const getZoomLevel = (latitudeDelta: number): number => {
    return Math.round(Math.log(360 / latitudeDelta) / Math.LN2);
  };

  const center: [number, number] = [displayRegion.latitude, displayRegion.longitude];
  const zoom = getZoomLevel(displayRegion.latitudeDelta);

  useEffect(() => {
    // Dynamically import Leaflet components only in browser environment
    if (typeof window !== 'undefined') {
      Promise.all([
        import('react-leaflet'),
        import('leaflet'),
        import('leaflet/dist/leaflet.css')
      ])
        .then(([reactLeaflet, L]) => {
          // Fix default marker icon issue in Leaflet
          delete (L.default.Icon.Default.prototype as any)._getIconUrl;
          L.default.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          });

          setMapComponents({
            MapContainer: reactLeaflet.MapContainer,
            TileLayer: reactLeaflet.TileLayer,
            Marker: reactLeaflet.Marker,
            Popup: reactLeaflet.Popup,
            useMap: reactLeaflet.useMap,
            Circle: reactLeaflet.Circle,
            L: L.default,
          });
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Failed to load map components:', error);
          setMapError(true);
          setIsLoading(false);
        });
    }
  }, []);

  // Live tracking effect
  useEffect(() => {
    if (enableLiveTracking && trackingUserId && !isLoading) {
      const interval = setInterval(async () => {
        try {
          // Fetch real driver location from backend
          const driverLocation = await locationService.getDriverLocation(trackingUserId); // Use trackingUserId as driverId

          setLiveLocations(prev => {
            const updated = prev.filter(loc => loc.userId !== trackingUserId);
            return [...updated, { ...driverLocation, userId: trackingUserId }];
          });

          if (onLiveLocationUpdate) {
            onLiveLocationUpdate(driverLocation);
          }
        } catch (error) {
          console.error('Live tracking error:', error);
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [enableLiveTracking, trackingUserId, displayRegion, onLiveLocationUpdate, isLoading]);

  const handleMarkerPress = (item: any) => {
    setSelectedMarker(item);
    if (onLocationSelect) {
      onLocationSelect(item);
    }
  };

  const handleMapMove = () => {
    if (mapRef.current && onRegionChangeComplete) {
      const map = mapRef.current;
      const center = map.getCenter();
      const bounds = map.getBounds();
      const latitudeDelta = bounds.getNorth() - bounds.getSouth();
      const longitudeDelta = bounds.getEast() - bounds.getWest();

      onRegionChangeComplete({
        latitude: center.lat,
        longitude: center.lng,
        latitudeDelta,
        longitudeDelta,
      });
    }
  };

  if (isLoading || !MapComponents) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="map" size={32} color="#4682B4" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      </View>
    );
  }

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

  const { MapContainer, TileLayer, Marker, Popup, Circle, L } = MapComponents;

  // Component to update map view when region changes
  const MapUpdater = ({ region: mapRegion }: { region: any }) => {
    const map = MapComponents.useMap();

    React.useEffect(() => {
      if (mapRegion && map) {
        try {
          map.setView([mapRegion.latitude, mapRegion.longitude], getZoomLevel(mapRegion.latitudeDelta));
        } catch (error) {
          console.error('Error updating map view:', error);
        }
      }
    }, [mapRegion, map]);

    return null;
  };

  return (
    <View style={[styles.container, style]}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={props.zoomEnabled !== false}
        dragging={props.scrollEnabled !== false}
        ref={mapRef}
        onMoveEnd={handleMapMove}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapUpdater region={region} />

        {/* User location marker */}
        {showsUserLocation && (
          <Circle
            center={center}
            radius={50}
            pathOptions={{ color: '#4682B4', fillColor: '#4682B4', fillOpacity: 0.3 }}
          />
        )}

        {/* Regular markers */}
        {markers.map((marker, index) => (
          <Marker
            key={`marker-${index}`}
            position={[marker.coordinate.latitude, marker.coordinate.longitude]}
            eventHandlers={{
              click: () => handleMarkerPress(marker),
            }}
          >
            {(marker.title || marker.description) && (
              <Popup>
                {marker.title && <strong>{marker.title}</strong>}
                {marker.description && <p>{marker.description}</p>}
              </Popup>
            )}
          </Marker>
        ))}

        {/* Store locations */}
        {enableStoreLocator && storeLocations.map((store, index) => (
          <Marker
            key={`store-${index}`}
            position={[store.coords?.lat || store.latitude, store.coords?.lng || store.longitude]}
            eventHandlers={{
              click: () => handleMarkerPress(store),
            }}
          >
            <Popup>
              <strong>{store.title}</strong>
              {store.address && <p>{store.address}</p>}
            </Popup>
          </Marker>
        ))}

        {/* Live tracking markers */}
        {liveLocations.map((location, index) => (
          <Marker
            key={`live-${index}`}
            position={[location.latitude, location.longitude]}
            icon={L.divIcon({
              className: 'live-marker',
              html: `<div style="background: #00ff00; border: 2px solid white; border-radius: 50%; width: 20px; height: 20px;"></div>`,
            })}
          />
        ))}

        {children}
      </MapContainer>

      {/* Selected marker info */}
      {selectedMarker && (
        <View style={styles.markerInfo}>
          <Text style={styles.markerTitle}>{selectedMarker.title}</Text>
          {selectedMarker.address && (
            <Text style={styles.markerAddress}>{selectedMarker.address}</Text>
          )}
          <TouchableOpacity
            style={styles.closeInfo}
            onPress={() => setSelectedMarker(null)}
          >
            <Ionicons name="close" size={16} color="#666" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f8ff',
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#4682B4',
    marginTop: 10,
    fontWeight: '500',
  },
  markerInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  markerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  markerAddress: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  closeInfo: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
});

// Web-compatible Marker component (placeholder for compatibility)
// Note: For web, markers are handled internally by MapWeb component
export const Marker: React.FC<any> = () => null;

// Provider constant for web
export const PROVIDER_GOOGLE = 'leaflet';

export default MapWeb;
export { MapWeb };