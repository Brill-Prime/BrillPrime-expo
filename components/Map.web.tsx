import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';

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
  markers?: {
    coordinate: { latitude: number; longitude: number };
    title?: string;
    description?: string;
    pinColor?: string;
  }[];
  customMapStyle?: any[];
  provider?: string;
  zoomEnabled?: boolean;
  scrollEnabled?: boolean;
  rotateEnabled?: boolean;
  pitchEnabled?: boolean;
  showsMyLocationButton?: boolean;
  userType?: 'consumer' | 'merchant' | 'driver'; // User role for distinct markers
  // Route directions props
  origin?: { latitude: number; longitude: number };
  destination?: { latitude: number; longitude: number };
  waypoints?: Array<{ latitude: number; longitude: number }>;
  showRoute?: boolean;
  eta?: string;
}

// Get Google Maps API key from environment
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// Declare global window interface
declare global {
  interface Window {
    google: any;
  }
}

const MapWeb = forwardRef<any, MapProps>(({
  style,
  region = {
    // Default to Nigeria (Lagos) - will be overridden by live location when available
    latitude: 9.0765,  // Abuja, Nigeria
    longitude: 7.3986,
    latitudeDelta: 5.0, // Wider view to show Nigeria
    longitudeDelta: 5.0,
  },
  onRegionChangeComplete,
  showsUserLocation = false,
  children,
  onMapReady,
  onError,
  markers = [],
  customMapStyle = [],
  zoomEnabled = true,
  origin,
  destination,
  waypoints = [],
  showRoute = false,
  eta,
  ...props
}, ref) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const isInitializedRef = useRef<boolean>(false);
  const scriptLoadingRef = useRef<boolean>(false);
  const initAttemptedRef = useRef<boolean>(false);
  const lastRegionRef = useRef<any>(null);
  const isUpdatingFromProp = useRef<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
        directionsRendererRef.current = null;
      }
    };
  }, []);

  // Extract markers from children if provided as React components
  const extractedMarkers = React.useMemo(() => {
    if (markers.length > 0) return markers;

    const childMarkers: any[] = [];
    React.Children.forEach(children, (child: any) => {
      if (React.isValidElement(child)) {
        const props = child.props as any;
        if (props?.coordinate) {
          childMarkers.push({
            coordinate: props.coordinate,
            title: props.title,
            description: props.description,
            pinColor: props.pinColor || '#FF0000',
          });
        }
      }
    });
    return childMarkers;
  }, [children, markers]);

  // Initialize map (stable - no dependencies that change)
  const initMap = useCallback(() => {
    // Prevent multiple initializations
    if (isInitializedRef.current) {
      console.log('[Map.web] Map already initialized, skipping');
      return;
    }

    if (!mapRef.current) {
      console.error('[Map.web] Map container ref not available');
      return;
    }

    if (!window.google?.maps) {
      console.error('[Map.web] Google Maps API not loaded');
      return;
    }

    try {
      console.log('[Map.web] Creating Google Maps instance with config:', {
        center: { lat: region.latitude, lng: region.longitude },
        zoom: region.latitudeDelta ? Math.round(Math.log(360 / region.latitudeDelta) / Math.LN2) : 13,
        hasCustomStyle: customMapStyle && customMapStyle.length > 0,
      });

      // Validate coordinates before creating map
      const centerLat = isFinite(region.latitude) ? region.latitude : 0;
      const centerLng = isFinite(region.longitude) ? region.longitude : 0;

      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: centerLat, lng: centerLng },
        zoom: region.latitudeDelta && isFinite(region.latitudeDelta) ? Math.round(Math.log(360 / region.latitudeDelta) / Math.LN2) : 13,
        styles: customMapStyle,
        disableDefaultUI: !showsUserLocation,
        zoomControl: zoomEnabled,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      googleMapRef.current = map;
      isInitializedRef.current = true;

      // Store initial region
      lastRegionRef.current = {
        latitude: region.latitude,
        longitude: region.longitude,
        latitudeDelta: region.latitudeDelta,
        longitudeDelta: region.longitudeDelta,
      };

      // Add event listeners - only call onRegionChangeComplete for user interactions
      // Don't trigger on programmatic updates to prevent feedback loops
      let userInteracting = false;

      map.addListener('dragstart', () => {
        userInteracting = true;
      });

      map.addListener('zoom_changed', () => {
        if (!isUpdatingFromProp.current) {
          userInteracting = true;
        }
      });

      map.addListener('idle', () => {
        // Only notify parent of region changes from user interaction
        if (userInteracting && onRegionChangeComplete) {
          const center = map.getCenter();
          if (center) {
            const bounds = map.getBounds();
            if (bounds) {
              const ne = bounds.getNorthEast();
              const sw = bounds.getSouthWest();
              const newRegion = {
                latitude: center.lat(),
                longitude: center.lng(),
                latitudeDelta: Math.abs(ne.lat() - sw.lat()),
                longitudeDelta: Math.abs(ne.lng() - sw.lng())
              };

              // Store the new region
              lastRegionRef.current = newRegion;
              onRegionChangeComplete(newRegion);
            }
          }
          userInteracting = false;
        }
      });

      // Wait for map to be fully idle before marking as ready
      google.maps.event.addListenerOnce(map, 'idle', () => {
        setIsLoading(false);
        setMapReady(true);
        console.log('[Map.web] ✅ Map fully initialized and ready!');
        if (onMapReady) {
          console.log('[Map.web] Calling onMapReady callback');
          onMapReady();
        }
      });

      console.log('[Map.web] ✅ Map instance created successfully');
    } catch (err) {
      const errorMsg = `Failed to initialize map: ${err.message || 'Unknown error'}`;
      console.error('[Map.web] ❌ Error initializing map:', err);
      setError(errorMsg);
      setIsLoading(false);
      isInitializedRef.current = false;
      if (onError) onError(err);
    }
  }, []);

  // Load Google Maps script (runs once)
  useEffect(() => {
    if (initAttemptedRef.current) {
      console.log('[Map.web] Script load already attempted, skipping');
      return;
    }

    initAttemptedRef.current = true;

    if (!GOOGLE_MAPS_API_KEY) {
      const errorMsg = 'Google Maps API key not configured. Please add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY to your .env file';
      console.error('[Map.web]', errorMsg);
      setError(errorMsg);
      setIsLoading(false);
      if (onError) onError(new Error(errorMsg));
      return;
    }

    console.log('[Map.web] Initializing map with API key:', GOOGLE_MAPS_API_KEY.substring(0, 10) + '...');

    if (window.google?.maps) {
      // Google Maps already loaded
      console.log('[Map.web] Google Maps already loaded, initializing map');
      // Small delay to ensure DOM is ready
      setTimeout(() => initMap(), 100);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
    if (existingScript) {
      console.log('[Map.web] Google Maps script already exists');

      if (scriptLoadingRef.current) {
        console.log('[Map.web] Script already being loaded by this component');
        return;
      }

      // Check if script has already loaded
      if (window.google?.maps) {
        console.log('[Map.web] Existing script already loaded');
        setTimeout(() => initMap(), 100);
        return;
      }

      // Wait for existing script to load
      console.log('[Map.web] Waiting for existing script to load...');
      const loadHandler = () => {
        console.log('[Map.web] Existing script loaded');
        setTimeout(() => initMap(), 100);
      };

      existingScript.addEventListener('load', loadHandler);

      // Cleanup
      return () => {
        existingScript.removeEventListener('load', loadHandler);
      };
    }

    // Load Google Maps script
    if (scriptLoadingRef.current) {
      console.log('[Map.web] Script loading already in progress');
      return;
    }

    scriptLoadingRef.current = true;
    console.log('[Map.web] Loading Google Maps script...');

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.id = 'google-maps-script';

    script.onload = () => {
      console.log('[Map.web] ✅ Google Maps script loaded successfully');
      scriptLoadingRef.current = false;
      // Small delay to ensure Google Maps API is fully initialized
      setTimeout(() => initMap(), 100);
    };

    script.onerror = (err) => {
      const errorMsg = 'Failed to load Google Maps script. Check your API key and internet connection.';
      console.error('[Map.web] ❌', errorMsg, err);
      setError(errorMsg);
      setIsLoading(false);
      scriptLoadingRef.current = false;
      if (onError) onError(err);
    };

    document.head.appendChild(script);

    return () => {
      // Don't remove script on unmount as it might be used by other components
      scriptLoadingRef.current = false;
    };
  }, []);

  // Update markers when they change (only after map is ready)
  useEffect(() => {
    if (!mapReady || !googleMapRef.current || !extractedMarkers || !window.google?.maps) {
      if (!mapReady) {
        console.log('[Map.web] Map not ready yet, skipping marker update');
      }
      return;
    }

    console.log('[Map.web] Updating markers, count:', extractedMarkers.length);

    // Clear existing markers
    markersRef.current.forEach(marker => {
      try {
        marker.setMap(null);
      } catch (err) {
        console.warn('[Map.web] Error removing marker:', err);
      }
    });
    markersRef.current = [];

    // Add new markers
    extractedMarkers.forEach((markerData: any, index: number) => {
      if (markerData.coordinate && window.google?.maps) {
        try {
          // Validate marker coordinates
          const markerLat = isFinite(markerData.coordinate.latitude) ? markerData.coordinate.latitude : 0;
          const markerLng = isFinite(markerData.coordinate.longitude) ? markerData.coordinate.longitude : 0;

          const marker = new window.google.maps.Marker({
            position: {
              lat: markerLat,
              lng: markerLng
            },
            map: googleMapRef.current,
            title: markerData.title || '',
            animation: google.maps.Animation.DROP,
          });

          markersRef.current.push(marker);
        } catch (err) {
          console.error(`[Map.web] Error creating marker ${index}:`, err);
        }
      }
    });

    console.log('[Map.web] ✅ Markers updated successfully, total:', markersRef.current.length);
  }, [extractedMarkers, mapReady]);

  // Update region when prop changes (only if map is initialized)
  // Only update if there's a significant change to prevent feedback loops
  useEffect(() => {
    if (!mapReady || !googleMapRef.current || !region) return;

    // Check if region has changed significantly (more than ~10 meters)
    const SIGNIFICANT_CHANGE_THRESHOLD = 0.0001; // ~11 meters
    const lastRegion = lastRegionRef.current;

    if (lastRegion) {
      const latDiff = Math.abs(region.latitude - lastRegion.latitude);
      const lngDiff = Math.abs(region.longitude - lastRegion.longitude);
      const deltaDiff = Math.abs((region.latitudeDelta || 0) - (lastRegion.latitudeDelta || 0));

      // Only update if there's a significant change
      if (
        latDiff < SIGNIFICANT_CHANGE_THRESHOLD &&
        lngDiff < SIGNIFICANT_CHANGE_THRESHOLD &&
        deltaDiff < 0.1
      ) {
        // No significant change, skip update
        return;
      }
    }

    console.log('[Map.web] Updating map region (significant change detected):', region);

    try {
      // Set flag to prevent triggering user interaction events
      isUpdatingFromProp.current = true;

      // Validate coordinates before setting center
      const centerLat = isFinite(region.latitude) ? region.latitude : 0;
      const centerLng = isFinite(region.longitude) ? region.longitude : 0;

      googleMapRef.current.setCenter({
        lat: centerLat,
        lng: centerLng
      });

      if (region.latitudeDelta) {
        const zoom = Math.round(Math.log(360 / region.latitudeDelta) / Math.LN2);
        googleMapRef.current.setZoom(zoom);
      }

      // Store the updated region
      lastRegionRef.current = {
        latitude: region.latitude,
        longitude: region.longitude,
        latitudeDelta: region.latitudeDelta,
        longitudeDelta: region.longitudeDelta,
      };

      // Reset flag after a short delay to allow map to settle
      setTimeout(() => {
        isUpdatingFromProp.current = false;
      }, 500);
    } catch (err) {
      console.error('[Map.web] Error updating region:', err);
      isUpdatingFromProp.current = false;
    }
  }, [region.latitude, region.longitude, region.latitudeDelta, mapReady]);

  // Update route when origin/destination change
  useEffect(() => {
    if (!mapReady || !googleMapRef.current || !showRoute || !origin || !destination) {
      // Clear existing route if it should not be shown
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
        directionsRendererRef.current = null;
      }
      return;
    }

    // Load Google Maps Directions service
    if (!window.google?.maps?.DirectionsService) {
      console.warn('[Map.web] Google Maps Directions Service not available');
      return;
    }

    try {
      const directionsService = new window.google.maps.DirectionsService();
      const directionsRenderer = directionsRendererRef.current || new window.google.maps.DirectionsRenderer({
        suppressMarkers: true, // Use our custom markers
        polylineOptions: {
          strokeColor: '#4682B4',
          strokeOpacity: 0.8,
          strokeWeight: 6,
        }
      });

      directionsRenderer.setMap(googleMapRef.current);
      directionsRendererRef.current = directionsRenderer;

      const waypointsFormatted = waypoints.map(point => {
        // Validate waypoint coordinates
        const lat = isFinite(point.latitude) ? point.latitude : 0;
        const lng = isFinite(point.longitude) ? point.longitude : 0;
        return {
          location: new window.google.maps.LatLng(lat, lng),
          stopover: true
        };
      });

      // Validate origin and destination coordinates
      const originLat = isFinite(origin.latitude) ? origin.latitude : 0;
      const originLng = isFinite(origin.longitude) ? origin.longitude : 0;
      const destLat = isFinite(destination.latitude) ? destination.latitude : 0;
      const destLng = isFinite(destination.longitude) ? destination.longitude : 0;

      directionsService.route({
        origin: new window.google.maps.LatLng(originLat, originLng),
        destination: new window.google.maps.LatLng(destLat, destLng),
        waypoints: waypointsFormatted,
        travelMode: window.google.maps.TravelMode.DRIVING,
      }, (result, status) => {
        if (status === 'OK' && result) {
          directionsRenderer.setDirections(result);

          // Add ETA overlay if provided
          if (eta) {
            // Create or update ETA display
            console.log('[Map.web] Route calculated with ETA:', eta);
          }
        } else {
          console.error('[Map.web] Directions request failed:', status);
        }
      });
    } catch (err) {
      console.error('[Map.web] Error calculating route:', err);
    }
  }, [mapReady, origin, destination, waypoints, showRoute, eta]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    animateToRegion: (region: any, duration?: number) => {
      if (!googleMapRef.current || !mapReady) {
        console.warn('[Map.web] Cannot animate - map not ready');
        return;
      }

      console.log('[Map.web] Animating to region:', region);
      // Validate coordinates before panning
      const panLat = isFinite(region.latitude) ? region.latitude : 0;
      const panLng = isFinite(region.longitude) ? region.longitude : 0;

      googleMapRef.current.panTo({ lat: panLat, lng: panLng });

      if (region.latitudeDelta) {
        const zoom = Math.round(Math.log(360 / region.latitudeDelta) / Math.LN2);
        googleMapRef.current.setZoom(zoom);
      }
    },
    fitToCoordinates: (coordinates: any[], options?: any) => {
      if (!googleMapRef.current || !mapReady) {
        console.warn('[Map.web] Cannot fit coordinates - map not ready');
        return;
      }

      if (!coordinates || coordinates.length === 0) {
        console.warn('[Map.web] No coordinates to fit');
        return;
      }

      console.log('[Map.web] Fitting to coordinates, count:', coordinates.length);

      try {
        const bounds = new window.google.maps.LatLngBounds();
        coordinates.forEach(coord => {
          // Validate coordinates before extending bounds
          const lat = isFinite(coord.latitude) ? coord.latitude : 0;
          const lng = isFinite(coord.longitude) ? coord.longitude : 0;
          bounds.extend(new window.google.maps.LatLng(lat, lng));
        });
        googleMapRef.current.fitBounds(bounds, options?.edgePadding);
      } catch (err) {
        console.error('[Map.web] Error fitting coordinates:', err);
      }
    },
  }), [mapReady]);

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

  if (error) {
    return (
      <View style={[styles.container, style, styles.errorContainer]}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorDetails}>
          Check console for details
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
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      />
    </View>
  );
});

MapWeb.displayName = 'MapWeb';

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