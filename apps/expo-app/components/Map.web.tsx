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
type DrawingMode = 'point' | 'polygon' | 'circle' | 'rectangle' | null; // Changed 'marker' to 'point' and added 'rectangle' based on Mapbox Draw controls

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
    // This calculation is an approximation and might not be precise for Mapbox.
    // Mapbox uses zoom levels directly, so this function might be less relevant.
    // However, keeping it for potential future use or compatibility.
    return Math.round(Math.log(360 / latitudeDelta) / Math.LN2);
  };

  // Mapbox uses [lng, lat] for coordinates
  const center: [number, number] = [displayRegion.longitude, displayRegion.latitude]; 
  const zoom = getZoomLevel(displayRegion.latitudeDelta);

  // Handle WebView messages
  const handleWebViewMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        case 'mapClick':
          // Mapbox GL JS event provides lngLat, which is [lng, lat]
          if (onMapClick) onMapClick(data.lat, data.lng);
          break;
        case 'drawingComplete':
          if (onDrawingComplete) onDrawingComplete(data.data);
          break;
        case 'regionChange':
          // Mapbox moveend event provides new center and zoom.
          // We calculate latitudeDelta based on zoom for consistency with props.
          if (onRegionChangeComplete) {
            const latitudeDelta = 360 / Math.pow(2, data.region.zoom);
            onRegionChangeComplete({
              latitude: data.region.latitude,
              longitude: data.region.longitude,
              latitudeDelta: latitudeDelta,
              longitudeDelta: latitudeDelta
            });
          }
          break;
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  }, [onMapClick, onDrawingComplete, onRegionChangeComplete]);

  // Handle search
  const handleSearch = useCallback(() => {
    if (webViewRef.current && searchQuery.trim()) {
      // Use Mapbox Geocoder's query method
      webViewRef.current.injectJavaScript(`
        if (window.geocoder) {
          window.geocoder.query(${JSON.stringify(searchQuery)});
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
        // Mapbox Draw uses modes like 'draw_point', 'draw_polygon', etc.
        webViewRef.current.injectJavaScript(`
          if (window.mapboxDraw) {
            window.mapboxDraw.changeMode('draw_${tool}');
          }
          true;
        `);
      } else {
        // 'simple_select' mode to disable drawing and allow selection
        webViewRef.current.injectJavaScript(`
          if (window.mapboxDraw) {
            window.mapboxDraw.changeMode('simple_select');
          }
          true;
        `);
      }
    }
  }, []);

  // Clear drawings
  const clearDrawings = useCallback(() => {
    if (webViewRef.current) {
      // Mapbox Draw has a deleteAll method
      webViewRef.current.injectJavaScript(`
        if (window.mapboxDraw) {
          window.mapboxDraw.deleteAll();
        }
        true;
      `);
    }
  }, []);

  // Initial load state
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

  // Error state
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

  return (
    <View style={[styles.container, style]}>
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
                
                <!-- Mapbox GL JS and plugins -->
                <script src="https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js"></script>
                <link href="https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css" rel="stylesheet" />
                <script src="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v5.0.0/mapbox-gl-geocoder.min.js"></script>
                <link rel="stylesheet" href="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v5.0.0/mapbox-gl-geocoder.css" type="text/css">
                <script src="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v1.4.3/mapbox-gl-draw.js"></script>
                <link rel="stylesheet" href="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v1.4.3/mapbox-gl-draw.css" type="text/css">
                
                <style>
                  html, body {
                    height: 100%;
                    margin: 0;
                    padding: 0;
                    overflow: hidden;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  }
                  #map {
                    height: 100vh;
                    width: 100vw;
                    position: absolute;
                    top: 0;
                    left: 0;
                    z-index: 0;
                  }
                  /* Adjust geocoder style to match React Native's positioning */
                  .mapboxgl-ctrl-geocoder {
                    position: absolute !important;
                    top: 20px !important; /* Adjusted top position */
                    left: 20px !important; /* Adjusted left position */
                    right: 20px !important; /* Adjusted right position */
                    z-index: 1000 !important;
                    max-width: none !important; /* Allow it to take full width within constraints */
                    margin-left: 0 !important;
                    margin-right: 0 !important;
                  }
                  /* Adjust draw control style */
                  .mapboxgl-ctrl-bottom-left {
                    left: 60px !important; /* Position draw controls below geocoder */
                  }
                  .mapboxgl-ctrl-top-left {
                    top: 80px !important; /* Ensure draw controls don't overlap geocoder */
                  }
                </style>
              </head>
              <body>
                <div id="map"></div>

                <script>
                  // Set Mapbox access token - IMPORTANT: Replace with your actual token
                  // It's recommended to load this from a secure configuration or environment variable
                  mapboxgl.accessToken = 'pk.YOUR_MAPBOX_TOKEN'; 

                  // Initialize map
                  const map = new mapboxgl.Map({
                    container: 'map',
                    style: 'mapbox://styles/mapbox/streets-v12', // Or choose another style
                    center: [${center[0]}, ${center[1]}], // Mapbox uses [lng, lat]
                    zoom: ${zoom}
                  });

                  // Add navigation controls (zoom in/out, rotation)
                  map.addControl(new mapboxgl.NavigationControl(), 'top-right');

                  // Add geocoder (search) control
                  const geocoder = new MapboxGeocoder({
                    accessToken: mapboxgl.accessToken,
                    mapboxgl: mapboxgl,
                    placeholder: 'Search location...',
                    // Optional: limit results to a certain area
                    proximity: {
                      longitude: ${center[0]}, 
                      latitude: ${center[1]}
                    }
                  });

                  map.addControl(geocoder, 'top-left'); // Position search bar

                  // Initialize Mapbox Draw controls
                  const draw = new MapboxDraw({
                    displayControlsDefault: false, // Hide default controls
                    controls: {
                      point: true, // Enable point (marker) drawing
                      line_string: true, // Enable line drawing
                      polygon: true, // Enable polygon drawing
                      trash: true, // Enable delete control
                      combine_features: false, // Disable combining features
                      uncombine_features: false // Disable uncombining features
                    },
                    defaultMode: 'simple_select' // Start in select mode
                  });

                  map.addControl(draw, 'top-left'); // Position drawing controls

                  // --- Event Listeners ---

                  // Handle map clicks for pinpointing or adding markers
                  map.on('click', (e) => {
                    // e.lngLat is an object with lat and lng properties
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'mapClick',
                      lat: e.lngLat.lat,
                      lng: e.lngLat.lng
                    }));
                  });

                  // Handle map movement end to update region state
                  map.on('moveend', () => {
                    const currentCenter = map.getCenter();
                    const currentZoom = map.getZoom();
                    // Calculate latitudeDelta based on zoom level for consistency
                    const latitudeDelta = 360 / Math.pow(2, currentZoom); 

                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'regionChange',
                      region: {
                        latitude: currentCenter.lat,
                        longitude: currentCenter.lng,
                        latitudeDelta: latitudeDelta, // Approximate delta
                        longitudeDelta: latitudeDelta // Approximate delta
                      }
                    }));
                  });

                  // Handle drawing completion
                  map.on('draw.create', (e) => {
                    // e.features contains the drawn feature(s) in GeoJSON format
                    // We're sending the first feature back. Adjust if multiple features are drawn simultaneously.
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'drawingComplete',
                      data: e.features[0] 
                    }));
                  });

                  // Handle feature deletion via the trash control
                  map.on('draw.delete', () => {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'drawingsCleared' 
                    }));
                  });

                  // --- Adding initial data ---

                  // Add provided markers
                  ${markers.map(marker => `
                    new mapboxgl.Marker({ color: '#007bff' }) // Default marker color
                      .setLngLat([${marker.coordinate.longitude}, ${marker.coordinate.latitude}]) // [lng, lat]
                      .setPopup(new mapboxgl.Popup().setHTML('<h3>${marker.title || ''}</h3><p>${marker.description || ''}</p>'))
                      .addTo(map);
                  `).join('')}

                  // Add store locations
                  ${storeLocations.map(store => `
                    const storeMarker = new mapboxgl.Marker({ color: '#ff4444' }) // Store marker color
                      .setLngLat([${store.coords?.lng || store.longitude}, ${store.coords?.lat || store.latitude}]) // [lng, lat]
                      .setPopup(new mapboxgl.Popup().setHTML('<h3>${store.title}</h3><p>${store.address || ''}</p>'))
                      .addTo(map);
                  `).join('')}

                  // Add user location marker if available
                  ${userLocation ? `
                    new mapboxgl.Marker({ color: '#28a745' }) // User location marker color
                      .setLngLat([${userLocation.longitude}, ${userLocation.latitude}]) // [lng, lat]
                      .addTo(map);
                  ` : ''}

                  // Expose Mapbox objects to the window for React Native to interact with
                  window.mapboxMap = map;
                  window.mapboxDraw = draw;
                  window.geocoder = geocoder;
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
          originWhitelist={['*']} // Allow all origins for WebView messages
          scrollEnabled={false} // Disable WebView scrolling, map controls handle navigation
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView error: ', nativeEvent);
            setMapError(true); // Set error state on WebView error
          }}
          onLoadEnd={() => {
            setIsLoading(false); // Set loading to false once WebView finishes loading
          }}
        />

        {/* Search Bar Component */}
        {showSearch && (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search location..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch} // Trigger search on submit
              returnKeyType="search"
            />
            <TouchableOpacity 
              style={styles.searchButton} 
              onPress={handleSearch} // Trigger search on button press
              activeOpacity={0.7}
            >
              <MaterialIcons name="search" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Drawing Tools Component */}
        {showDrawingTools && (
          <View style={styles.drawingTools}>
            {/* Point/Marker Tool */}
            <TouchableOpacity
              style={[
                styles.toolButton,
                drawingMode === 'point' && styles.activeToolButton // Highlight if active
              ]}
              onPress={() => handleDrawingTool(drawingMode === 'point' ? null : 'point')} // Toggle drawing mode
            >
              <MaterialIcons 
                name="location-on" 
                size={24} 
                color={drawingMode === 'point' ? '#fff' : '#0066ff'} // Color based on active state
              />
            </TouchableOpacity>

            {/* Polygon Tool */}
            <TouchableOpacity
              style={[
                styles.toolButton,
                drawingMode === 'polygon' && styles.activeToolButton
              ]}
              onPress={() => handleDrawingTool(drawingMode === 'polygon' ? null : 'polygon')}
            >
              <MaterialIcons 
                name="area-chart" // Using 'area-chart' for polygon visualization
                size={24} 
                color={drawingMode === 'polygon' ? '#fff' : '#0066ff'} 
              />
            </TouchableOpacity>
            
            {/* Line Tool (if needed, Mapbox Draw supports it) */}
            {/* 
            <TouchableOpacity
              style={[
                styles.toolButton,
                drawingMode === 'line_string' && styles.activeToolButton
              ]}
              onPress={() => handleDrawingTool(drawingMode === 'line_string' ? null : 'line_string')}
            >
              <MaterialIcons 
                name="timeline" 
                size={24} 
                color={drawingMode === 'line_string' ? '#fff' : '#0066ff'} 
              />
            </TouchableOpacity>
            */}

            {/* Clear Drawings Button */}
            <TouchableOpacity
              style={[styles.toolButton, styles.clearButton]}
              onPress={clearDrawings}
            >
              <MaterialIcons name="clear" size={24} color="#dc3545" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Selected Marker Info Panel */}
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
    overflow: 'hidden', // Ensure map content stays within bounds
  },
  webview: {
    flex: 1,
    width: '100%',
  },
  // Search Bar Styles
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
  // Drawing Tools Styles
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
    alignItems: 'center', // Align items vertically
  },
  toolButton: {
    width: 48, // Slightly larger buttons
    height: 48,
    borderRadius: 24, // Circular buttons
    backgroundColor: '#f0f8ff', // Light blue background
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 6, // More spacing between buttons
  },
  activeToolButton: {
    backgroundColor: '#007bff', // Active tool background
    borderWidth: 2,
    borderColor: '#0056b3', // Darker border for active state
  },
  clearButton: {
    backgroundColor: '#f8d7da', // Light red for clear button
  },
  // General Container Styles
  container: {
    flex: 1,
    backgroundColor: '#e6f2ff', // Lighter background color
    borderRadius: 15,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#cce0ff', // Lighter border color
  },
  // Error View Styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff', // White background for error message
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545', // Bootstrap danger color
    marginTop: 10,
    fontWeight: '600',
  },
  retryButton: {
    marginTop: 15,
    backgroundColor: '#007bff', // Primary button color
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  // Loading View Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff', // White background for loading message
  },
  loadingText: {
    fontSize: 16,
    color: '#6c757d', // Bootstrap secondary color
    marginTop: 10,
    fontWeight: '500',
  },
  // Selected Marker Info Panel Styles
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
    padding: 5, // Add padding for easier tapping
  },
});

// Web-compatible Marker component (placeholder, Mapbox markers are handled in WebView)
export const Marker: React.FC<any> = () => null;

// Provider constant for Mapbox
export const PROVIDER_MAPBOX = 'mapbox';

export default MapWeb;
export { MapWeb };