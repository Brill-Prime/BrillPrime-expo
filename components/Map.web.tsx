import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  ActivityIndicator,
  Platform
} from 'react-native';
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
    pinColor?: string;
  }>;
  customMapStyle?: any[];
  onMapReady?: () => void;
  onError?: () => void;
}

const MapWeb: React.FC<MapProps> = ({
  style,
  children,
  region,
  initialRegion,
  onRegionChangeComplete,
  markers = [],
  showsUserLocation = false,
  customMapStyle,
  onMapReady,
  onError,
  ...props
}) => {
  const [mapError, setMapError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<any>(null);
  const mapRef = useRef<any>(null);
  const googleMapRef = useRef<any>(null);
  const [selectedMarker, setSelectedMarker] = useState<any>(null);
  const [hasGoogleMapsKey, setHasGoogleMapsKey] = useState(false);
  const markersRef = useRef<any[]>([]);

  const displayRegion = region || initialRegion || {
    latitude: 6.5244,
    longitude: 3.3792,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  // Initialize Google Maps with caching
  useEffect(() => {
    const initGoogleMaps = async () => {
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        console.error('❌ Google Maps API key not found in environment variables');
        setHasGoogleMapsKey(false);
        setMapError(true);
        setIsLoading(false);
        return;
      }
      
      setHasGoogleMapsKey(true);

      // Check if Google Maps is already loaded (cached)
      if (window.google && window.google.maps) {
        console.log('✅ Google Maps already loaded (cached)');
        initMap();
        return;
      }

      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        console.log('⏳ Google Maps script already loading...');
        existingScript.addEventListener('load', () => initMap());
        return;
      }

      console.log('📥 Loading Google Maps API...');

      // Load Google Maps script with optimizations
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&loading=async`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('✅ Google Maps loaded successfully');
        // Add small delay to ensure DOM is ready
        setTimeout(() => {
          initMap();
        }, 100);
      };
      script.onerror = () => {
        console.error('❌ Failed to load Google Maps');
        setMapError(true);
        setIsLoading(false);
        if (onError) onError();
      };
      document.head.appendChild(script);
    };

    initGoogleMaps();
  }, []);

  // Retry initMap when mapRef becomes available
  useEffect(() => {
    if (window.google && window.google.maps && mapRef.current && !googleMapRef.current) {
      console.log('🔄 Retrying map initialization after DOM ready');
      initMap();
    }
  }, [initMap]);

  // Get user's current location if showsUserLocation is true (optimized)
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
          setUserLocation(null);
        },
        {
          enableHighAccuracy: false, // Use lower accuracy for faster response
          timeout: 10000,
          maximumAge: 30000 // Cache location for 30 seconds
        }
      );
    }
  }, [showsUserLocation]);

  // Initialize the map
  const initMap = useCallback(() => {
    if (!mapRef.current || !window.google) {
      console.log('⏳ Map initialization delayed - waiting for DOM element or Google Maps API');
      return;
    }

    try {
      console.log('🗺️ Initializing Google Maps instance...');
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: displayRegion.latitude, lng: displayRegion.longitude },
        zoom: getZoomFromDelta(displayRegion.latitudeDelta),
        mapTypeId: props.mapType || 'roadmap',
        styles: customMapStyle || [],
        disableDefaultUI: false,
        zoomControl: props.zoomEnabled !== false,
        scrollwheel: props.scrollEnabled !== false,
        gestureHandling: props.scrollEnabled !== false ? 'auto' : 'none',
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      });

      googleMapRef.current = map;
      console.log('✅ Google Maps instance created successfully');

      // Add region change listener
      if (onRegionChangeComplete) {
        map.addListener('idle', () => {
          const center = map.getCenter();
          const bounds = map.getBounds();
          if (center && bounds) {
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();
            onRegionChangeComplete({
              latitude: center.lat(),
              longitude: center.lng(),
              latitudeDelta: Math.abs(ne.lat() - sw.lat()),
              longitudeDelta: Math.abs(ne.lng() - sw.lng()),
            });
          }
        });
      }

      // Hide loading indicator after map is ready
      setTimeout(() => {
        setIsLoading(false);
        console.log('🎉 Map fully initialized and ready');
      }, 300);
      
      if (onMapReady) onMapReady();
    } catch (error) {
      console.error('❌ Error initializing map:', error);
      setMapError(true);
      setIsLoading(false);
      if (onError) onError();
    }
  }, [displayRegion, customMapStyle, onRegionChangeComplete, onMapReady, onError, props.mapType, props.zoomEnabled, props.scrollEnabled]);

  // Convert latitudeDelta to zoom level
  const getZoomFromDelta = (latitudeDelta: number): number => {
    return Math.round(Math.log(360 / latitudeDelta) / Math.LN2);
  };

  // Update markers when they change
  useEffect(() => {
    if (!googleMapRef.current || !window.google) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add user location marker
    if (showsUserLocation && userLocation) {
      const userMarker = new window.google.maps.Marker({
        position: { lat: userLocation.latitude, lng: userLocation.longitude },
        map: googleMapRef.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#4682B4',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3,
        },
        title: 'Your Location',
      });

      // Add accuracy circle
      new window.google.maps.Circle({
        strokeColor: '#4682B4',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#4682B4',
        fillOpacity: 0.2,
        map: googleMapRef.current,
        center: { lat: userLocation.latitude, lng: userLocation.longitude },
        radius: 50,
      });

      markersRef.current.push(userMarker);
    }

    // Add custom markers
    markers.forEach((marker, index) => {
      const googleMarker = new window.google.maps.Marker({
        position: { lat: marker.coordinate.latitude, lng: marker.coordinate.longitude },
        map: googleMapRef.current,
        title: marker.title,
        icon: marker.pinColor ? {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: marker.pinColor,
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        } : undefined,
      });

      if (marker.title || marker.description) {
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              ${marker.title ? `<strong>${marker.title}</strong>` : ''}
              ${marker.description ? `<p style="margin: 4px 0 0 0;">${marker.description}</p>` : ''}
            </div>
          `,
        });

        googleMarker.addListener('click', () => {
          infoWindow.open(googleMapRef.current, googleMarker);
          setSelectedMarker(marker);
        });
      }

      markersRef.current.push(googleMarker);
    });
  }, [markers, userLocation, showsUserLocation]);

  // Update map when region changes
  useEffect(() => {
    if (googleMapRef.current && region) {
      googleMapRef.current.setCenter({ lat: region.latitude, lng: region.longitude });
      googleMapRef.current.setZoom(getZoomFromDelta(region.latitudeDelta));
    }
  }, [region]);

  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4682B4" />
          <Text style={styles.loadingText}>Loading Google Maps...</Text>
        </View>
      </View>
    );
  }

  if (mapError || !hasGoogleMapsKey) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={32} color="#e74c3c" />
          <Text style={styles.errorText}>
            {!hasGoogleMapsKey ? 'Google Maps API key not configured' : 'Map failed to load'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => window.location.reload()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 0,
        }}
      />


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
    flex: 1,
    backgroundColor: '#ffffff',
    position: 'relative',
    overflow: 'hidden',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f8ff',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    marginTop: 12,
    fontWeight: '600',
    textAlign: 'center',
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

// Export Marker component for compatibility (handled internally in Google Maps)
export const Marker: React.FC<any> = () => null;

// Provider constant for web (Google Maps)
export const PROVIDER_GOOGLE = 'google';

export default MapWeb;