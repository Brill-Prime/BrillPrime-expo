
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  ...props
}) => {
  const [mapError, setMapError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [liveLocations, setLiveLocations] = useState<any[]>([]);
  const [clusteredStores, setClusteredStores] = useState<any[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<any>(null);
  const maxRetries = 3;
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const liveTrackingRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    // Check network status
    const checkNetwork = () => {
      setIsOffline(!navigator.onLine);
    };

    window.addEventListener('online', checkNetwork);
    window.addEventListener('offline', checkNetwork);
    checkNetwork();

    // Simulate map loading with error recovery
    const loadMap = async () => {
      try {
        setIsLoading(true);
        setMapError(false);
        
        // Simulate network request
        await new Promise<boolean>((resolve, reject) => {
          setTimeout(() => {
            if (isOffline && retryCount === 0) {
              reject(new Error('Network unavailable'));
            } else if (Math.random() > 0.7 && retryCount < 2) {
              reject(new Error('Map load failed'));
            } else {
              resolve(true);
            }
          }, 1000 + retryCount * 500);
        });

        setIsLoading(false);
        setRetryCount(0);
      } catch (error) {
        console.error('Map loading error:', error);
        if (retryCount < maxRetries) {
          setRetryCount(prev => prev + 1);
          retryTimeoutRef.current = setTimeout(loadMap, 2000 * (retryCount + 1));
        } else {
          setMapError(true);
          setIsLoading(false);
        }
      }
    };

    loadMap();

    return () => {
      window.removeEventListener('online', checkNetwork);
      window.removeEventListener('offline', checkNetwork);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (liveTrackingRef.current) clearInterval(liveTrackingRef.current);
    };
  }, [retryCount, isOffline]);

  // Live tracking effect
  useEffect(() => {
    if (enableLiveTracking && trackingUserId && !isOffline) {
      const startLiveTracking = () => {
        liveTrackingRef.current = setInterval(async () => {
          try {
            // Simulate live location fetch
            const mockLocation = {
              latitude: (region?.latitude || 6.5244) + (Math.random() - 0.5) * 0.01,
              longitude: (region?.longitude || 3.3792) + (Math.random() - 0.5) * 0.01,
              timestamp: Date.now(),
            };

            setLiveLocations(prev => {
              const updated = prev.filter(loc => loc.userId !== trackingUserId);
              return [...updated, { ...mockLocation, userId: trackingUserId }];
            });

            if (onLiveLocationUpdate) {
              onLiveLocationUpdate(mockLocation);
            }
          } catch (error) {
            console.error('Live tracking error:', error);
          }
        }, 5000);
      };

      startLiveTracking();
    }

    return () => {
      if (liveTrackingRef.current) {
        clearInterval(liveTrackingRef.current);
      }
    };
  }, [enableLiveTracking, trackingUserId, isOffline, region, onLiveLocationUpdate]);

  // Store clustering effect
  useEffect(() => {
    if (enableStoreLocator && storeLocations.length > 0) {
      // Performance optimization: cluster stores for large datasets
      if (storeLocations.length > 50) {
        const clustered = clusterLocations(storeLocations);
        setClusteredStores(clustered);
      } else {
        setClusteredStores(storeLocations);
      }
    }
  }, [enableStoreLocator, storeLocations]);

  const clusterLocations = (locations: any[]) => {
    const clusters: { [key: string]: any[] } = {};
    const gridSize = 0.01;

    locations.forEach(location => {
      const lat = location.coords?.lat || location.latitude;
      const lng = location.coords?.lng || location.longitude;
      const gridX = Math.floor(lat / gridSize);
      const gridY = Math.floor(lng / gridSize);
      const key = `${gridX},${gridY}`;

      if (!clusters[key]) {
        clusters[key] = [];
      }
      clusters[key].push(location);
    });

    return Object.values(clusters).map(clusterLocations => {
      if (clusterLocations.length === 1) {
        return clusterLocations[0];
      }

      const avgLat = clusterLocations.reduce((sum, loc) => 
        sum + (loc.coords?.lat || loc.latitude), 0) / clusterLocations.length;
      const avgLng = clusterLocations.reduce((sum, loc) => 
        sum + (loc.coords?.lng || loc.longitude), 0) / clusterLocations.length;

      return {
        title: `${clusterLocations.length} stores`,
        coords: { lat: avgLat, lng: avgLng },
        isCluster: true,
        clusterSize: clusterLocations.length,
        clusterItems: clusterLocations,
      };
    });
  };

  const handleRetry = () => {
    setRetryCount(0);
    setMapError(false);
    setIsLoading(true);
  };

  const handleMarkerPress = (item: any) => {
    setSelectedMarker(item);
    if (onLocationSelect) {
      onLocationSelect(item);
    }
  };

  const displayRegion = region || initialRegion;

  // Offline fallback
  if (isOffline) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.offlineContainer}>
          <Ionicons name="cloud-offline" size={32} color="#ff6b6b" />
          <Text style={styles.offlineText}>Map unavailable offline</Text>
          <Text style={styles.offlineSubtext}>Showing cached data</Text>
          {clusteredStores.length > 0 && (
            <View style={styles.offlineList}>
              <Text style={styles.offlineListTitle}>Nearby Stores:</Text>
              {clusteredStores.slice(0, 3).map((store, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.offlineStoreItem}
                  onPress={() => handleMarkerPress(store)}
                >
                  <Text style={styles.offlineStoreName}>{store.title}</Text>
                  <Text style={styles.offlineStoreAddress}>{store.address}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  }

  // Error state with retry
  if (mapError) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={32} color="#e74c3c" />
          <Text style={styles.errorText}>Map failed to load</Text>
          <Text style={styles.errorSubtext}>
            Tried {retryCount} time{retryCount !== 1 ? 's' : ''}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="map" size={32} color="#4682B4" />
          <Text style={styles.loadingText}>
            {retryCount > 0 ? `Retrying... (${retryCount}/${maxRetries})` : 'Loading map...'}
          </Text>
        </View>
      </View>
    );
  }

  // Main map view
  return (
    <View style={[styles.container, style]}>
      <View style={styles.mapContentContainer}>
        <View style={styles.mapHeader}>
          <Ionicons name="location" size={20} color="#006AFF" />
          <Text style={styles.locationText}>
            {enableLiveTracking ? 'Live Map' : 'Current Location'}
          </Text>
          {enableLiveTracking && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>

        <View style={[styles.mapContent, { backgroundColor: '#e8f4ff' }]}>
          <View style={styles.mapGrid}>
            {Array.from({ length: 20 }, (_, i) => (
              <View key={i} style={styles.gridLine} />
            ))}
          </View>

          {/* Center marker */}
          <View style={styles.centerMarker}>
            <Ionicons name="radio-button-on" size={16} color="#e74c3c" />
          </View>

          {/* Store markers */}
          {enableStoreLocator && clusteredStores.map((store, index) => (
            <TouchableOpacity
              key={`store-${index}`}
              style={[
                styles.storeMarker,
                {
                  top: `${20 + (index % 5) * 15}%`,
                  left: `${25 + (index % 4) * 18}%`,
                }
              ]}
              onPress={() => handleMarkerPress(store)}
            >
              {store.isCluster ? (
                <View style={styles.clusterMarker}>
                  <Text style={styles.clusterText}>{store.clusterSize}</Text>
                </View>
              ) : (
                <Ionicons name="storefront" size={20} color="#ff4444" />
              )}
            </TouchableOpacity>
          ))}

          {/* Live location markers */}
          {liveLocations.map((location, index) => (
            <View
              key={`live-${index}`}
              style={[
                styles.liveMarker,
                {
                  top: `${40 + index * 10}%`,
                  right: `${20 + index * 15}%`,
                }
              ]}
            >
              <View style={styles.liveMarkerInner}>
                <Ionicons name="person" size={12} color="white" />
              </View>
            </View>
          ))}

          <Text style={styles.coordinatesText}>
            {displayRegion ?
              `${displayRegion.latitude.toFixed(4)}, ${displayRegion.longitude.toFixed(4)}` :
              '6.5244, 3.3792'}
          </Text>
        </View>
        {children}
      </View>

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

// Marker component for web
export const Marker: React.FC<any> = ({ coordinate, title, children, onPress }) => {
  return (
    <TouchableOpacity style={styles.markerContainer} onPress={onPress}>
      <Ionicons name="location" size={20} color="#e74c3c" />
      {title && <Text style={styles.markerTitle}>{title}</Text>}
      {children}
    </TouchableOpacity>
  );
};

// Provider constant for web
export const PROVIDER_GOOGLE = 'web';

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
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
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
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  offlineText: {
    fontSize: 16,
    color: '#ff6b6b',
    marginTop: 10,
    fontWeight: '600',
  },
  offlineSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  offlineList: {
    marginTop: 20,
    width: '100%',
    maxWidth: 300,
  },
  offlineListTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  offlineStoreItem: {
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  offlineStoreName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  offlineStoreAddress: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
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
  mapContentContainer: {
    flex: 1,
    minHeight: 200,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(70, 130, 180, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  locationText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#4682B4',
    fontWeight: '600',
    flex: 1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00ff00',
    marginRight: 4,
  },
  liveText: {
    fontSize: 12,
    color: '#00aa00',
    fontWeight: '600',
  },
  mapContent: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  mapGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridLine: {
    width: '10%',
    height: '10%',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 106, 255, 0.15)',
  },
  centerMarker: {
    position: 'absolute',
    zIndex: 10,
  },
  storeMarker: {
    position: 'absolute',
    zIndex: 5,
  },
  clusterMarker: {
    backgroundColor: '#007bff',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clusterText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  liveMarker: {
    position: 'absolute',
    zIndex: 8,
  },
  liveMarkerInner: {
    backgroundColor: '#00ff00',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  coordinatesText: {
    position: 'absolute',
    bottom: 15,
    fontSize: 12,
    color: '#666',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  markerContainer: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 10,
  },
  markerTitle: {
    fontSize: 12,
    color: '#333',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
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

export default MapWeb;

// Also export as named export for compatibility
export { MapWeb };
