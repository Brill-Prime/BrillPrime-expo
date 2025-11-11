import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as locationService from '../services/locationService';

// Types for drawing tools
type DrawingMode = 'marker' | 'polygon' | 'circle' | 'rectangle' | null;

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
  // New props for search and drawing
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
  showDrawingTools = true,
  onMapClick,
  onDrawingComplete,
  markers = [],
  showsUserLocation = false,
  ...props
}) => {
  const [mapError, setMapError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [drawingMode, setDrawingMode] = useState<DrawingMode>(null);
  const webViewRef = useRef<WebView>(null);
  const [mapComponents, setMapComponents] = useState<{
    MapContainer: React.ComponentType<any>;
    TileLayer: React.ComponentType<any>;
    Marker: React.ComponentType<any>;
    Popup: React.ComponentType<any>;
    Circle: React.ComponentType<any>;
    useMap: React.ComponentType<any>;
    L: any;
  } | null>(null);
  const mapRef = useRef<any>(null);
  const [selectedMarker, setSelectedMarker] = useState<any>(null);
  const [liveLocations, setLiveLocations] = useState<any[]>([]);

  // For Leaflet fallback
  const [useLeafletFallback, setUseLeafletFallback] = useState(false);
  const [hasGoogleMapsKey, setHasGoogleMapsKey] = useState(false);

  const displayRegion = region || initialRegion || {
    latitude: 6.5244,
    longitude: 3.3792,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  // Get user's current location if showsUserLocation is true
  useEffect(() => {
    if (showsUserLocation && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting user location:', error);
          // Use region/initialRegion as fallback
          setUserLocation({
            latitude: displayRegion.latitude,
            longitude: displayRegion.longitude,
          });
        }
      );
    }
  }, [showsUserLocation, displayRegion.latitude, displayRegion.longitude]);

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
          // Check for Google Maps API key
          const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY; // Assuming API key is in environment variables
          setHasGoogleMapsKey(!!googleMapsApiKey);

          if (!googleMapsApiKey) {
            setUseLeafletFallback(true);
          }

          // Fix default marker icon issue in Leaflet
          delete (L.default.Icon.Default.prototype as any)._getIconUrl;
          L.default.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          });

          setMapComponents({
            MapContainer: reactLeaflet.MapContainer,
            TileLayer: reactLeaflet.TileLayer,
            Marker: reactLeaflet.Marker,
            Popup: reactLeaflet.Popup,
            Circle: reactLeaflet.Circle,
            useMap: reactLeaflet.useMap,
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

  // Handle map click
  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (onMapClick) {
      onMapClick(lat, lng);
    }

    if (drawingMode === 'marker' && webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        const marker = L.marker([${lat}, ${lng}], {
          draggable: true
        }).addTo(map);

        marker.on('click', () => {
          map.removeLayer(marker);
        });

        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'drawingComplete',
          data: {
            type: 'Point',
            coordinates: [${lng}, ${lat}]
          }
        }));
      `);
    }
  }, [drawingMode, onMapClick]);

  // Handle map move
  const handleMapMove = useCallback((region: any) => {
    if (onRegionChangeComplete) {
      onRegionChangeComplete(region);
    }
  }, [onRegionChangeComplete]);

  // Handle search
  const handleSearch = useCallback(() => {
    if (webViewRef.current && searchQuery.trim()) {
      webViewRef.current.injectJavaScript(`
        const searchControl = document.querySelector('.geosearch');
        if (searchControl) {
          const input = searchControl.querySelector('input[type="text"]');
          const button = searchControl.querySelector('button');

          if (input && button) {
            input.value = ${JSON.stringify(searchQuery)};
            const event = new Event('input', { bubbles: true });
            input.dispatchEvent(event);

            setTimeout(() => {
              button.click();
            }, 100);
          }
        }
        true;
      `);
    }
  }, [searchQuery]);

  // Handle drawing tools
  const handleDrawingTool = useCallback((tool: DrawingMode) => {
    setDrawingMode(tool);

    if (webViewRef.current) {
      if (tool) {
        webViewRef.current.injectJavaScript(`
          window.leafletMap.enableDrawing('${tool}');
          true;
        `);
      } else {
        webViewRef.current.injectJavaScript(`
          window.leafletMap.disableDrawing();
          true;
        `);
      }
    }
  }, []);

  // Clear drawings
  const clearDrawings = useCallback(() => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        window.leafletMap.clearDrawings();
        true;
      `);
    }
  }, []);

  // Handle marker press
  const handleMarkerPress = useCallback((marker: any) => {
    setSelectedMarker(marker);
    if (onLocationSelect) {
      onLocationSelect(marker);
    }
  }, [onLocationSelect]);

  // Handle WebView messages
  const handleWebViewMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        case 'mapClick':
          if (onMapClick) onMapClick(data.lat, data.lng);
          break;
        case 'drawingComplete':
          if (onDrawingComplete) onDrawingComplete(data.data);
          break;
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  }, [onMapClick, onDrawingComplete]);

  // Initialize map with Leaflet
  useEffect(() => {
    const initMap = () => {
      // Your existing map initialization code
      if (webViewRef.current) {
        // Add any additional initialization for search and drawing
        webViewRef.current.injectJavaScript(`
          // Initialize search control
          const searchControl = new GeoSearch.GeoSearchControl({
            provider: new GeoSearch.OpenStreetMapProvider(),
            style: 'bar',
            showMarker: true,
            showPopup: false,
            autoClose: true,
            retainZoomLevel: false,
            animateZoom: true,
            keepResult: true,
            searchLabel: 'Search location',
          });

          // Add search control to map
          map.addControl(searchControl);

          // Initialize drawing control
          const drawnItems = new L.FeatureGroup();
          map.addLayer(drawnItems);

          const drawControl = new L.Control.Draw({
            position: 'topleft',
            draw: {
              polygon: true,
              polyline: false,
              rectangle: true,
              circle: true,
              marker: true,
              circlemarker: false
            },
            edit: {
              featureGroup: drawnItems,
              remove: true
            }
          });

          map.addControl(drawControl);

          // Handle drawing events
          map.on(L.Draw.Event.CREATED, function (e) {
            const type = e.layerType;
            const layer = e.layer;

            // Add the drawn item to the map
            drawnItems.addLayer(layer);

            // Send the GeoJSON back to React Native
            const geoJson = layer.toGeoJSON();
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'drawingComplete',
              data: geoJson
            }));
          });

          // Handle map click
          map.on('click', (e) => {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'mapClick',
              lat: e.latlng.lat,
              lng: e.latlng.lng
            }));
          });

          // Expose functions to window for React Native to call
          window.leafletMap = {
            setView: (lat, lng, zoom) => map.setView([lat, lng], zoom),
            enableDrawing: (type) => {
              // Enable drawing mode
              const drawControl = new L.Draw[type.charAt(0).toUpperCase() + type.slice(1)](map, {
                shapeOptions: {
                  color: '#0066ff',
                  weight: 2,
                  opacity: 1,
                  fillColor: '#0066ff',
                  fillOpacity: 0.2
                }
              });
              drawControl.enable();
            },
            disableDrawing: () => {
              // Disable drawing mode
              if (map._drawToolbar) {
                map._drawToolbar.disable();
              }
            },
            clearDrawings: () => {
              drawnItems.clearLayers();
            }
          };
        `);
      }
    };

    initMap();
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066FF" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      </View>
    );
  }

  if (mapError || !mapComponents) {
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

  const { MapContainer, TileLayer, Marker, Popup, Circle, L } = mapComponents;

  // Component to update map view when region changes
  const MapUpdater = ({ region: mapRegion }: { region: any }) => {
    const map = mapComponents.useMap();

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
      {useLeafletFallback && !hasGoogleMapsKey && (
        <View style={styles.mapNotice}>
          <Ionicons name="information-circle" size={16} color="#4682B4" />
          <Text style={styles.mapNoticeText}>Using OpenStreetMap</Text>
        </View>
      )}

      {!hasGoogleMapsKey ? (
        // Simple placeholder - no OpenStreetMap
        <View style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#f0f8ff',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {children}
        </View>
      ) : (
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
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            maxZoom={20}
          />

          <MapUpdater region={region} />

          {/* User location marker */}
          {showsUserLocation && userLocation && (
            <>
              <Marker
                position={[userLocation.latitude || center[0], userLocation.longitude || center[1]]}
                icon={L.divIcon({
                  className: 'user-location-marker',
                  html: `
                  <div style="position: relative; width: 50px; height: 60px; display: flex; flex-direction: column; align-items: center;">
                    <div style="width: 36px; height: 36px; border-radius: 18px; background-color: #4682B4; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 8px rgba(70, 130, 180, 0.4);">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                      </svg>
                    </div>
                    <div style="width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 12px solid #4682B4; margin-top: -2px;"></div>
                    <div style="width: 20px; height: 8px; border-radius: 10px; background-color: rgba(0, 0, 0, 0.2); margin-top: 2px;"></div>
                  </div>
                `,
                  iconSize: [50, 60],
                  iconAnchor: [25, 60],
                })}
              >
                <Popup>
                  <strong>Your Location</strong>
                </Popup>
              </Marker>
              <Circle
                center={[userLocation.latitude || center[0], userLocation.longitude || center[1]]}
                radius={50}
                pathOptions={{ color: '#4682B4', fillColor: '#4682B4', fillOpacity: 0.2 }}
              />
            </>
          )}

          {/* Fallback marker if showsUserLocation is true but no userLocation */}
          {showsUserLocation && !userLocation && (
            <>
              <Marker
                position={center}
                icon={L.divIcon({
                  className: 'user-location-marker',
                  html: `
                  <div style="position: relative; width: 50px; height: 60px; display: flex; flex-direction: column; align-items: center;">
                    <div style="width: 36px; height: 36px; border-radius: 18px; background-color: #4682B4; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 8px rgba(70, 130, 180, 0.4);">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                      </svg>
                    </div>
                    <div style="width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 12px solid #4682B4; margin-top: -2px;"></div>
                    <div style="width: 20px; height: 8px; border-radius: 10px; background-color: rgba(0, 0, 0, 0.2); margin-top: 2px;"></div>
                  </div>
                `,
                  iconSize: [50, 60],
                  iconAnchor: [25, 60],
                })}
              >
                <Popup>
                  <strong>Your Location</strong>
                </Popup>
              </Marker>
              <Circle
                center={center}
                radius={50}
                pathOptions={{ color: '#4682B4', fillColor: '#4682B4', fillOpacity: 0.2 }}
              />
            </>
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
          {mapComponents && stores.map((store, index) => (
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
      )}


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
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
    width: '100%',
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
  },
  searchButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawingTools: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    padding: 8,
  },
  toolButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  activeToolButton: {
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#007bff',
  },
  clearButton: {
    backgroundColor: '#ff4444',
  },
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
    borderRadius: 15,
    position: 'relative',
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
  mapNotice: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: '#e3f2fd',
    padding: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1001,
    justifyContent: 'center',
  },
  mapNoticeText: {
    color: '#4682B4',
    marginLeft: 8,
    fontSize: 12,
  },
});

// Web-compatible Marker component (placeholder for compatibility)
// Note: For web, markers are handled internally by MapWeb component
export const Marker: React.FC<any> = () => null;

// Provider constant for web
export const PROVIDER_GOOGLE = 'leaflet';

export default MapWeb;
export { MapWeb };