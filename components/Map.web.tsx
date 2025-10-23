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
    Map: React.ComponentType<any>;
    Marker: React.ComponentType<any>;
  } | null>(null);
  const mapRef = useRef<any>(null);
  const [selectedMarker, setSelectedMarker] = useState<any>(null);
  const [liveLocations, setLiveLocations] = useState<any[]>([]);

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

  if (isLoading || !mapComponents) {
    return (
      <View style={[styles.container, style]}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0066FF" />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        ) : (
          <View style={styles.mapContainer}>
            <WebView
              ref={webViewRef}
              source={{ 
                html: `
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <meta charset="utf-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <link 
                      rel="stylesheet" 
                      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
                      integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
                      crossorigin=""
                    />
                    <link 
                      rel="stylesheet" 
                      href="https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css"
                    />
                    <style>
                      body, #map { 
                        margin: 0; 
                        padding: 0; 
                        width: 100%; 
                        height: 100%; 
                        overflow: hidden;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                      }
                      .geosearch {
                        position: absolute !important;
                        top: 20px !important;
                        left: 20px !important;
                        right: 20px !important;
                        z-index: 1000 !important;
                        max-width: 500px !important;
                      }
                      .leaflet-draw-toolbar {
                        margin-top: 60px !important;
                      }
                    </style>
                  </head>
                  <body>
                    <div id="map"></div>
                    
                    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
                      integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
                      crossorigin=""></script>
                    <script src="https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.js"></script>
                    <script src="https://unpkg.com/leaflet-geosearch@3.0.0/dist/geosearch.umd.js"></script>
                    
                    <script>
                      // Initialize map
                      const map = L.map('map').setView([${initialRegion?.latitude || 0}, ${initialRegion?.longitude || 0}], ${initialRegion?.zoom || 13});
                      
                      // Add tile layer (OpenStreetMap)
                      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      }).addTo(map);

                      // Add user location marker if available
                      ${userLocation ? `
                      L.circleMarker([${userLocation.latitude}, ${userLocation.longitude}], {
                        radius: 8,
                        fillColor: "#0066ff",
                        color: "#fff",
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.8
                      }).addTo(map);
                      ` : ''}

                      // Add store markers if available
                      ${storeLocations.length > 0 ? `
                      const stores = ${JSON.stringify(storeLocations)};
                      stores.forEach(store => {
                        L.marker([store.latitude, store.longitude], {
                          icon: L.divIcon({
                            html: '<div style="background: #ff4444; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">S</div>',
                            className: 'store-marker',
                            iconSize: [30, 30],
                            iconAnchor: [15, 30]
                          })
                        }).addTo(map);
                      });
                      ` : ''}

                      // Handle map click
                      map.on('click', (e) => {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                          type: 'mapClick',
                          lat: e.latlng.lat,
                          lng: e.latlng.lng
                        }));
                      });

                      // Expose map to window
                      window.map = map;
                    </script>
                  </body>
                  </html>
                `
              }}
              style={styles.webview}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              onMessage={handleWebViewMessage}
              originWhitelist={['*']}
              scrollEnabled={false}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.warn('WebView error: ', nativeEvent);
              }}
              onLoadEnd={() => {
                setIsLoading(false);
              }}
            />
            
            {/* Search Bar */}
            {showSearch && (
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search location..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                />
                <TouchableOpacity 
                  style={styles.searchButton} 
                  onPress={handleSearch}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="search" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {/* Drawing Tools */}
            {showDrawingTools && (
              <View style={styles.drawingTools}>
                <TouchableOpacity
                  style={[
                    styles.toolButton,
                    drawingMode === 'marker' && styles.activeToolButton
                  ]}
                  onPress={() => handleDrawingTool(drawingMode === 'marker' ? null : 'marker')}
                >
                  <MaterialIcons 
                    name="location-on" 
                    size={24} 
                    color={drawingMode === 'marker' ? '#fff' : '#0066ff'} 
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.toolButton,
                    drawingMode === 'polygon' && styles.activeToolButton
                  ]}
                  onPress={() => handleDrawingTool(drawingMode === 'polygon' ? null : 'polygon')}
                >
                  <MaterialIcons 
                    name="polyline" 
                    size={24} 
                    color={drawingMode === 'polygon' ? '#fff' : '#0066ff'} 
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.toolButton,
                    drawingMode === 'rectangle' && styles.activeToolButton
                  ]}
                  onPress={() => handleDrawingTool(drawingMode === 'rectangle' ? null : 'rectangle')}
                >
                  <MaterialIcons 
                    name="crop-square" 
                    size={24} 
                    color={drawingMode === 'rectangle' ? '#fff' : '#0066ff'} 
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.toolButton,
                    drawingMode === 'circle' && styles.activeToolButton
                  ]}
                  onPress={() => handleDrawingTool(drawingMode === 'circle' ? null : 'circle')}
                >
                  <MaterialIcons 
                    name="panorama-fish-eye" 
                    size={24} 
                    color={drawingMode === 'circle' ? '#fff' : '#0066ff'} 
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.toolButton, styles.clearButton]}
                  onPress={clearDrawings}
                >
                  <MaterialIcons name="clear" size={24} color="#ff4444" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
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
});

// Web-compatible Marker component (placeholder for compatibility)
// Note: For web, markers are handled internally by MapWeb component
export const Marker: React.FC<any> = () => null;

// Provider constant for web
export const PROVIDER_GOOGLE = 'leaflet';

export default MapWeb;
export { MapWeb };