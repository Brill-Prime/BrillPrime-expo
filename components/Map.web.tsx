import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  ActivityIndicator,
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
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);

  // Validate and set region with fallback
  const defaultRegion = {
    latitude: 6.5244,
    longitude: 3.3792,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  const displayRegion = React.useMemo(() => {
    const reg = region || initialRegion || defaultRegion;

    if (isNaN(reg.latitude) || isNaN(reg.longitude)) {
      console.warn('⚠️ Invalid coordinates detected, using default region');
      return defaultRegion;
    }

    if (reg.latitude < -90 || reg.latitude > 90 || reg.longitude < -180 || reg.longitude > 180) {
      console.warn('⚠️ Coordinates out of bounds, using default region');
      return defaultRegion;
    }

    return reg;
  }, [region, initialRegion]);

  // Track if Leaflet is loaded
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Load Leaflet library
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      try {
        // Check if Leaflet is already loaded
        if (window.L) {
          console.log('✅ Leaflet already loaded');
          setLeafletLoaded(true);
          return;
        }

        console.log('📥 Loading Leaflet...');

        // Load Leaflet CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = '';
        document.head.appendChild(link);

        // Load Leaflet JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        script.crossOrigin = '';
        script.async = true;

        script.onload = () => {
          console.log('✅ Leaflet loaded successfully');
          setLeafletLoaded(true);
        };

        script.onerror = () => {
          console.error('❌ Failed to load Leaflet');
          setMapError(true);
          setIsLoading(false);
          if (onError) onError();
        };

        document.head.appendChild(script);
      } catch (error) {
        console.error('❌ Error loading Leaflet:', error);
        setMapError(true);
        setIsLoading(false);
        if (onError) onError();
      }
    };

    loadLeaflet();
  }, []);

  // Initialize map when both Leaflet and DOM are ready
  useEffect(() => {
    if (leafletLoaded && mapRef.current && !leafletMapRef.current) {
      console.log('🚀 DOM and Leaflet ready, initializing map...');
      setTimeout(() => initMap(), 100);
    }
  }, [leafletLoaded]);

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
          setUserLocation(null);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 30000,
        }
      );
    }
  }, [showsUserLocation]);

  // Initialize Leaflet map
  const initMap = () => {
    if (leafletMapRef.current) {
      console.log('ℹ️ Map already initialized');
      return;
    }

    if (!mapRef.current || !window.L) {
      console.log('⏳ Map initialization delayed - waiting for DOM/Leaflet');
      return;
    }

    if (!displayRegion || isNaN(displayRegion.latitude) || isNaN(displayRegion.longitude)) {
      console.error('❌ Invalid region data:', displayRegion);
      setMapError(true);
      setIsLoading(false);
      return;
    }

    try {
      console.log('🗺️ Initializing Leaflet map...');
      console.log('📍 Map center:', { lat: displayRegion.latitude, lng: displayRegion.longitude });

      const zoom = getZoomFromDelta(displayRegion.latitudeDelta);
      console.log('🔍 Map zoom:', zoom);

      // Create map
      const map = window.L.map(mapRef.current, {
        center: [displayRegion.latitude, displayRegion.longitude],
        zoom: zoom,
        zoomControl: props.zoomEnabled !== false,
        scrollWheelZoom: props.scrollEnabled !== false,
        dragging: props.scrollEnabled !== false,
        touchZoom: props.zoomEnabled !== false,
      });

      // Add tile layer (OpenStreetMap)
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      leafletMapRef.current = map;
      console.log('✅ Leaflet map created successfully');

      // Map is ready
      setTimeout(() => {
        setIsLoading(false);
        if (onMapReady) onMapReady();
        console.log('🎉 Map ready');
      }, 500);

      // Add move end listener for region changes
      if (onRegionChangeComplete) {
        map.on('moveend', () => {
          const center = map.getCenter();
          const bounds = map.getBounds();
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();

          onRegionChangeComplete({
            latitude: center.lat,
            longitude: center.lng,
            latitudeDelta: Math.abs(ne.lat - sw.lat),
            longitudeDelta: Math.abs(ne.lng - sw.lng),
          });
        });
      }
    } catch (error: any) {
      console.error('❌ Error initializing map:', error);
      setMapError(true);
      setIsLoading(false);
      if (onError) onError();
    }
  };

  // Convert latitudeDelta to zoom level
  const getZoomFromDelta = (latitudeDelta: number): number => {
    return Math.round(Math.log(360 / latitudeDelta) / Math.LN2);
  };

  // Update markers when they change
  useEffect(() => {
    if (!leafletMapRef.current || !window.L) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add user location marker
    if (showsUserLocation && userLocation) {
      const userIcon = window.L.divIcon({
        html: `
          <div style="
            width: 36px;
            height: 36px;
            background-color: #4682B4;
            border: 3px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
        `,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = window.L.marker([userLocation.latitude, userLocation.longitude], {
        icon: userIcon,
      }).addTo(leafletMapRef.current);

      marker.bindPopup('<b>Your Location</b>');
      markersRef.current.push(marker);
      userMarkerRef.current = marker;
    }

    // Add custom markers
    markers.forEach((markerData) => {
      const markerIcon = window.L.divIcon({
        html: `
          <div style="
            width: 30px;
            height: 30px;
            background-color: ${markerData.pinColor || '#FF6B6B'};
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          "></div>
        `,
        className: '',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const marker = window.L.marker(
        [markerData.coordinate.latitude, markerData.coordinate.longitude],
        { icon: markerIcon }
      ).addTo(leafletMapRef.current);

      if (markerData.title || markerData.description) {
        const popupContent = `
          <div style="padding: 8px;">
            ${markerData.title ? `<strong>${markerData.title}</strong>` : ''}
            ${markerData.description ? `<p style="margin: 4px 0 0 0;">${markerData.description}</p>` : ''}
          </div>
        `;
        marker.bindPopup(popupContent);
      }

      markersRef.current.push(marker);
    });
  }, [markers, userLocation, showsUserLocation]);

  // Update map center when region changes
  useEffect(() => {
    if (leafletMapRef.current && region) {
      leafletMapRef.current.setView(
        [region.latitude, region.longitude],
        getZoomFromDelta(region.latitudeDelta)
      );
    }
  }, [region]);

  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4682B4" />
          <Text style={styles.loadingText}>Loading Map...</Text>
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
          <Text style={styles.errorDetails}>
            Please check your internet connection and try again.
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