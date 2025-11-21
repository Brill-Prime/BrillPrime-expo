import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

interface MapProps {
  style?: any;
  region?: {
    latitude: number;
    longitude: number;
    latitudeDelta?: number;
    longitudeDelta?: number;
  };
  onRegionChangeComplete?: (region: any) => void;
  showsUserLocation?: boolean;
  children?: React.ReactNode;
  onMapReady?: () => void;
  onError?: (error: any) => void;
  markers?: Array<{
    coordinate: { latitude: number; longitude: number };
    title?: string;
    description?: string;
    pinColor?: string;
  }>;
}

const MapWeb: React.FC<MapProps> = ({
  style,
  region = {
    latitude: 6.5244,
    longitude: 3.3792,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
  onRegionChangeComplete,
  showsUserLocation = false,
  children,
  onMapReady,
  onError,
  markers = [],
  ...props
}) => {
  const webViewRef = useRef(null);
  const mapInitialized = useRef(false);

  // Generate HTML for the map
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      <link 
        rel="stylesheet" 
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossorigin=""
      />
      <style>
        body { margin: 0; padding: 0; }
        #map { width: 100%; height: 100%; }
        .leaflet-control-zoom { margin-top: 10px; margin-right: 10px; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
        crossorigin=""></script>
      <script>
        let map;
        let markers = [];
        let userMarker;
        
        function initMap() {
          const center = [${region?.latitude || 6.5244}, ${region?.longitude || 3.3792}];
          const zoom = ${region?.latitudeDelta ? Math.round(Math.log(360 / region.latitudeDelta) / Math.LN2) : 13};
          
          // Initialize map
          map = L.map('map').setView(center, zoom);
          
          // Add tile layer
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(map);
          
          // Add user location if enabled
          ${showsUserLocation ? `
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const userPos = [pos.coords.latitude, pos.coords.longitude];
                userMarker = L.marker(userPos, {
                  icon: L.divIcon({
                    html: '<div style="background-color: #4285F4; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
                    className: '',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                  })
                }).addTo(map);
                
                // Notify parent about user location
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'userLocation',
                  location: {
                    latitude: userPos[0],
                    longitude: userPos[1]
                  }
                }));
              },
              (err) => {
                console.error('Error getting location:', err);
              },
              { enableHighAccuracy: true }
            );
          }
          ` : ''}
          
          // Handle map move events
          map.on('moveend', function() {
            const center = map.getCenter();
            const zoom = map.getZoom();
            const bounds = map.getBounds();
            
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'regionChange',
              region: {
                latitude: center.lat,
                longitude: center.lng,
                latitudeDelta: (bounds.getNorthEast().lat - bounds.getSouthWest().lat) / 2,
                longitudeDelta: (bounds.getNorthEast().lng - bounds.getSouthWest().lng) / 2
              }
            }));
          });
          
          // Notify React Native that map is ready
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'mapReady'
          }));
          
          // Add markers if any
          updateMarkers(${JSON.stringify(markers || [])});
        }
        
        // Function to update markers
        function updateMarkers(markersData) {
          // Clear existing markers
          markers = [];
          
          // Add new markers
          markersData.forEach((mData) => {
            if (mData.coordinate) {
              const marker = L.marker([
                mData.coordinate.latitude, 
                mData.coordinate.longitude
              ], {
                icon: L.divIcon({
                  html: \`<div style="background-color: ${mData.pinColor || '#FF6B6B'}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>\`,
                  className: '',
                  iconSize: [20, 20],
                  iconAnchor: [10, 10]
                })
              }).addTo(map);
              
              if (mData.title || mData.description) {
                let popupContent = '';
                if (mData.title) popupContent += \`<b>${mData.title}</b><br/>\`;
                if (mData.description) popupContent += mData.description;
                marker.bindPopup(popupContent);
              }
              
              markers.push(marker);
            }
          });
        }
        
        // Handle messages from React Native
        window.updateMarkers = updateMarkers;
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', initMap);
        } else {
          initMap();
        }
      </script>
    </body>
    </html>
  `;

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'regionChange':
          if (onRegionChangeComplete) {
            onRegionChangeComplete(data.region);
          }
          break;
        case 'mapReady':
          if (onMapReady) onMapReady();
          break;
        case 'userLocation':
          // Handle user location if needed
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  };

  // Update markers when they change
  useEffect(() => {
    if (webViewRef.current && markers) {
      webViewRef.current.injectJavaScript(`
        if (window.updateMarkers) {
          window.updateMarkers(${JSON.stringify(markers)});
        }
        true;
      `);
    }
  }, [markers]);

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={false}
        originWhitelist={['*']}
        mixedContentMode="always"
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        allowFileAccessFromFileURLs={true}
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  webview: {
    flex: 1,
    backgroundColor: '#f0f8ff',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    marginTop: 12,
    textAlign: 'center',
  },
  errorDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#4682B4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f8ff',
  },
  loadingText: {
    fontSize: 16,
    color: '#4682B4',
    marginTop: 12,
    fontWeight: '500',
  },
});

// Export Marker component for compatibility (handled internally in Leaflet)
export const Marker: React.FC<any> = () => null;

// Provider constant for web (Leaflet)
export const PROVIDER_GOOGLE = 'google';

export default MapWeb;