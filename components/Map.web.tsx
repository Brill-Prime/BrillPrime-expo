import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform, Text, ActivityIndicator } from 'react-native';
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
  customMapStyle?: any[];
  provider?: string;
}

// Get Google Maps API key from environment
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

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
  customMapStyle = [],
  ...props
}) => {
  const webViewRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  // Generate HTML for Google Maps
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      <style>
        body { margin: 0; padding: 0; }
        #map { width: 100%; height: 100%; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        let map;
        let markers = [];
        let userMarker;
        
        function initMap() {
          const center = { lat: ${region?.latitude || 6.5244}, lng: ${region?.longitude || 3.3792} };
          
          map = new google.maps.Map(document.getElementById('map'), {
            center: center,
            zoom: ${region?.latitudeDelta ? Math.round(Math.log(360 / region.latitudeDelta) / Math.LN2) : 13},
            styles: ${JSON.stringify(customMapStyle)},
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });
          
          // Add user location if enabled
          ${showsUserLocation ? `
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                userMarker = new google.maps.Marker({
                  position: userPos,
                  map: map,
                  icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: '#4285F4',
                    fillOpacity: 1,
                    strokeColor: '#FFFFFF',
                    strokeWeight: 3,
                  },
                  title: 'Your Location'
                });
                
                window.ReactNativeWebView?.postMessage(JSON.stringify({
                  type: 'userLocation',
                  location: {
                    latitude: userPos.lat,
                    longitude: userPos.lng
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
          
          // Handle map idle events (similar to region change)
          map.addListener('idle', function() {
            const center = map.getCenter();
            const bounds = map.getBounds();
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();
            
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'regionChange',
              region: {
                latitude: center.lat(),
                longitude: center.lng(),
                latitudeDelta: Math.abs(ne.lat() - sw.lat()),
                longitudeDelta: Math.abs(ne.lng() - sw.lng())
              }
            }));
          });
          
          // Notify React Native that map is ready
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'mapReady'
          }));
          
          // Add markers if any
          updateMarkers(${JSON.stringify(markers || [])});
        }
        
        // Function to update markers
        function updateMarkers(markersData) {
          // Clear existing markers
          markers.forEach(m => m.setMap(null));
          markers = [];
          
          // Add new markers
          markersData.forEach((mData) => {
            if (mData.coordinate) {
              const marker = new google.maps.Marker({
                position: { lat: mData.coordinate.latitude, lng: mData.coordinate.longitude },
                map: map,
                title: mData.title || '',
                icon: mData.pinColor ? {
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: mData.pinColor,
                  fillOpacity: 1,
                  strokeColor: '#FFFFFF',
                  strokeWeight: 2,
                } : undefined
              });
              
              if (mData.title || mData.description) {
                const infoWindow = new google.maps.InfoWindow({
                  content: \`
                    <div style="padding: 8px;">
                      \${mData.title ? \`<strong>\${mData.title}</strong><br/>\` : ''}
                      \${mData.description || ''}
                    </div>
                  \`
                });
                
                marker.addListener('click', () => {
                  infoWindow.open(map, marker);
                });
              }
              
              markers.push(marker);
            }
          });
        }
        
        window.updateMarkers = updateMarkers;
      </script>
      <script src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap" async defer></script>
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
          setIsLoading(false);
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

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <View style={[styles.container, style, styles.errorContainer]}>
        <Text style={styles.errorText}>Google Maps API key not configured</Text>
        <Text style={styles.errorDetails}>
          Please add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY to your .env file
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4682B4" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scalesPageToFit={false}
        originWhitelist={['*']}
        mixedContentMode="always"
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        allowFileAccessFromFileURLs={true}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error:', nativeEvent);
          if (onError) onError(nativeEvent);
        }}
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
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  errorDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    zIndex: 1000,
  },
  loadingText: {
    fontSize: 16,
    color: '#4682B4',
    marginTop: 12,
    fontWeight: '500',
  },
});

// Export Marker component for compatibility (handled internally in Google Maps)
export const Marker: React.FC<any> = () => null;

// Provider constant for web (Google Maps)
export const PROVIDER_GOOGLE = 'google';

export default MapWeb;