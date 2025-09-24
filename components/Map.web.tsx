import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Constants from 'expo-constants';
import { locationService } from '../services/locationService';
import { Merchant } from '../services/types';

// Declare global google maps types
declare global {
  interface Window {
    google: typeof google;
  }
}

export const PROVIDER_GOOGLE = 'google' as const;

export const Marker = ({ coordinate, title, description, pinColor, children }: {
  coordinate: { latitude: number; longitude: number };
  title?: string;
  description?: string;
  pinColor?: string;
  children?: React.ReactNode;
}) => null; // Markers will be handled by Google Maps API

export default function MapViewWeb({ 
  style, 
  region, 
  onRegionChangeComplete,
  showsUserLocation,
  showsMyLocationButton,
  showsCompass,
  toolbarEnabled,
  mapType,
  pitchEnabled,
  rotateEnabled,
  scrollEnabled,
  zoomEnabled,
  children,
  enableStoreLocator = false,
  storeLocations = [],
  onLocationSelect,
  showMerchants = false,
  enableLiveTracking = false,
  trackingUserId,
  onLiveLocationUpdate,
  ...props 
}: { 
  style?: any; 
  region?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
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
  enableStoreLocator?: boolean;
  storeLocations?: Array<{
    title: string;
    address: string;
    coords: { lat: number; lng: number };
    placeId?: string;
  }>;
  onLocationSelect?: (location: any) => void;
  showMerchants?: boolean;
  enableLiveTracking?: boolean;
  trackingUserId?: string;
  onLiveLocationUpdate?: (location: any) => void;
  [key: string]: any;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const directionsService = useRef<google.maps.DirectionsService | null>(null);
  const directionsRenderer = useRef<google.maps.DirectionsRenderer | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [filteredLocations, setFilteredLocations] = useState(storeLocations);
  const [nearbyMerchants, setNearbyMerchants] = useState<Array<Merchant & { liveLocation?: any }>>([]);
  const [liveTrackingMarker, setLiveTrackingMarker] = useState<google.maps.Marker | null>(null);
  const merchantMarkersRef = useRef<google.maps.Marker[]>([]);

  // Load Google Maps script based on environment variables
  useEffect(() => {
    // Access API key from multiple sources
    const apiKey = Constants.expoConfig?.extra?.googleMapsApiKey || 
                   Constants.expoConfig?.web?.config?.googleMapsApiKey ||
                   process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
                   process.env.GOOGLE_MAPS_API_KEY;
    
    if (!window.google) {
      if (apiKey) {
        console.log('Loading Google Maps with API key:', apiKey.substring(0, 10) + '...');

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,marker&loading=async`;
        script.async = true;
        script.defer = true;
        script.onload = initializeMap;
        document.head.appendChild(script);
      } else {
        console.error('Google Maps API key is not configured. Available config:', {
          expoConfig: Constants.expoConfig?.extra,
          webConfig: Constants.expoConfig?.web?.config,
          processEnv: !!process.env.GOOGLE_MAPS_API_KEY
        });
      }
    } else {
      initializeMap();
    }
  }, []);


  useEffect(() => {
    if (googleMapRef.current && region) {
      const center = new google.maps.LatLng(region.latitude, region.longitude);
      googleMapRef.current.setCenter(center);

      // Calculate zoom level based on latitudeDelta
      const zoom = Math.round(Math.log(360 / region.latitudeDelta) / Math.LN2);
      googleMapRef.current.setZoom(Math.min(Math.max(zoom, 1), 20));
    }
  }, [region]);

  const initializeMap = () => {
    if (!mapRef.current) return;

    const mapOptions: google.maps.MapOptions = {
      center: region ? 
        new google.maps.LatLng(region.latitude, region.longitude) : 
        new google.maps.LatLng(6.5244, 3.3792), // Default to Lagos
      zoom: region ? Math.round(Math.log(360 / region.latitudeDelta) / Math.LN2) : 10,
      mapTypeId: mapType === 'satellite' ? google.maps.MapTypeId.SATELLITE : google.maps.MapTypeId.ROADMAP,
      disableDefaultUI: !toolbarEnabled,
      zoomControl: zoomEnabled !== false,
      scrollwheel: scrollEnabled !== false,
      draggable: scrollEnabled !== false,
      disableDoubleClickZoom: !zoomEnabled,
      gestureHandling: scrollEnabled === false ? 'none' : 'auto',
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'on' }]
        }
      ]
    };

    googleMapRef.current = new google.maps.Map(mapRef.current, mapOptions);

    // Initialize directions service and renderer
    if (enableStoreLocator) {
      directionsService.current = new google.maps.DirectionsService();
      directionsRenderer.current = new google.maps.DirectionsRenderer({
        suppressMarkers: false,
        draggable: true
      });
      directionsRenderer.current.setMap(googleMapRef.current);
    }

    // Handle region change
    if (onRegionChangeComplete) {
      googleMapRef.current.addListener('bounds_changed', () => {
        if (!googleMapRef.current) return;

        const center = googleMapRef.current.getCenter();
        const bounds = googleMapRef.current.getBounds();

        if (center && bounds) {
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();

          const latitudeDelta = ne.lat() - sw.lat();
          const longitudeDelta = ne.lng() - sw.lng();

          onRegionChangeComplete({
            latitude: center.lat(),
            longitude: center.lng(),
            latitudeDelta,
            longitudeDelta
          });
        }
      });
    }

    // Show user location if enabled
    if (showsUserLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = new google.maps.LatLng(
            position.coords.latitude,
            position.coords.longitude
          );

          // Use modern AdvancedMarkerElement if available, fallback to classic Marker
          if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
            new google.maps.marker.AdvancedMarkerElement({
              position: userLocation,
              map: googleMapRef.current,
              title: 'Your Location'
            });
          } else {
            new google.maps.Marker({
              position: userLocation,
              map: googleMapRef.current,
              title: 'Your Location',
              icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
                    <circle cx="10" cy="10" r="8" fill="#4285F4" stroke="white" stroke-width="2"/>
                    <circle cx="10" cy="10" r="3" fill="white"/>
                  </svg>
                `),
                scaledSize: new google.maps.Size(20, 20),
                anchor: new google.maps.Point(10, 10)
              }
            });
          }
        },
        (error) => {
          console.log('Geolocation error:', error);
        }
      );
    }

    // Add markers from children
    addMarkersFromChildren();

    // Add store locator markers if enabled
    if (enableStoreLocator) {
      addStoreLocatorMarkers();
    }
  };

  const addStoreLocatorMarkers = () => {
    if (!googleMapRef.current) return;

    filteredLocations.forEach((location) => {
      let marker: any;
      
      if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
        marker = new google.maps.marker.AdvancedMarkerElement({
          position: new google.maps.LatLng(location.coords.lat, location.coords.lng),
          map: googleMapRef.current,
          title: location.title
        });
      } else {
        marker = new google.maps.Marker({
          position: new google.maps.LatLng(location.coords.lat, location.coords.lng),
          map: googleMapRef.current,
          title: location.title,
          icon: {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
                <path d="M16 0C7.163 0 0 7.163 0 16c0 16 16 24 16 24s16-8 16-24C32 7.163 24.837 0 16 0z" fill="#1967d2"/>
                <circle cx="16" cy="16" r="6" fill="white"/>
              </svg>
            `)}`,
            scaledSize: new google.maps.Size(32, 40),
            anchor: new google.maps.Point(16, 40)
          }
        });
      }

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="max-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: #1967d2;">${location.title}</h3>
            <p style="margin: 0 0 8px 0; color: #757575;">${location.address}</p>
            <button 
              onclick="getDirections('${location.coords.lat}', '${location.coords.lng}')"
              style="background: #1967d2; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;"
            >
              Get Directions
            </button>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(googleMapRef.current, marker);
        if (onLocationSelect) {
          onLocationSelect(location);
        }
      });

      markersRef.current.push(marker);
    });

    // Make getDirections available globally for the InfoWindow button
    (window as any).getDirections = (lat: string, lng: string) => {
      if (navigator.geolocation && directionsService.current && directionsRenderer.current) {
        navigator.geolocation.getCurrentPosition((position) => {
          const origin = new google.maps.LatLng(
            position.coords.latitude,
            position.coords.longitude
          );
          const destination = new google.maps.LatLng(parseFloat(lat), parseFloat(lng));

          directionsService.current!.route({
            origin,
            destination,
            travelMode: google.maps.TravelMode.DRIVING
          }, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
              directionsRenderer.current!.setDirections(result);
            }
          });
        });
      }
    };
  };

  const handleSearch = (query: string) => {
    setSearchInput(query);
    if (query.trim() === '') {
      setFilteredLocations(storeLocations);
    } else {
      const filtered = storeLocations.filter(location =>
        location.title.toLowerCase().includes(query.toLowerCase()) ||
        location.address.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredLocations(filtered);
    }
  };

  useEffect(() => {
    if (googleMapRef.current && enableStoreLocator) {
      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      
      // Add updated markers
      addStoreLocatorMarkers();
      addMarkersFromChildren();
    }
  }, [filteredLocations]);

  const addMarkersFromChildren = () => {
    if (!googleMapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Process children to find Marker components
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === Marker) {
        const props = child.props as any;
        const { coordinate, title, description, pinColor } = props;

        if (coordinate) {
          let marker: any;
          
          // Use modern AdvancedMarkerElement if available, fallback to classic Marker
          if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
            marker = new google.maps.marker.AdvancedMarkerElement({
              position: new google.maps.LatLng(coordinate.latitude, coordinate.longitude),
              map: googleMapRef.current,
              title: title || ''
            });
          } else {
            marker = new google.maps.Marker({
              position: new google.maps.LatLng(coordinate.latitude, coordinate.longitude),
              map: googleMapRef.current,
              title: title || '',
              icon: pinColor ? {
                url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
                    <path d="M16 0C7.163 0 0 7.163 0 16c0 16 16 24 16 24s16-8 16-24C32 7.163 24.837 0 16 0z" fill="${pinColor}"/>
                    <circle cx="16" cy="16" r="6" fill="white"/>
                  </svg>
                `)}`,
                scaledSize: new google.maps.Size(32, 40),
                anchor: new google.maps.Point(16, 40)
              } : undefined
            });
          }

          if (description) {
            const infoWindow = new google.maps.InfoWindow({
              content: `<div><strong>${title || ''}</strong><br/>${description}</div>`
            });

            marker.addListener('click', () => {
              infoWindow.open(googleMapRef.current, marker);
            });
          }

          markersRef.current.push(marker);
        }
      }
    });
  };

  useEffect(() => {
    if (googleMapRef.current) {
      addMarkersFromChildren();
    }
  }, [children]);

  // Load nearby merchants when showMerchants is enabled
  useEffect(() => {
    if (showMerchants && googleMapRef.current && region) {
      loadNearbyMerchants(region.latitude, region.longitude);
    }
  }, [showMerchants, region]);

  // Set up live tracking
  useEffect(() => {
    if (enableLiveTracking && trackingUserId) {
      const trackLocation = async () => {
        const response = await locationService.getLiveLocation(trackingUserId);
        if (response.success && response.data) {
          updateLiveTrackingMarker(response.data);
          if (onLiveLocationUpdate) {
            onLiveLocationUpdate(response.data);
          }
        }
      };

      const interval = setInterval(trackLocation, 5000);
      trackLocation(); // Initial call

      return () => clearInterval(interval);
    }
  }, [enableLiveTracking, trackingUserId]);

  const loadNearbyMerchants = async (latitude: number, longitude: number) => {
    const response = await locationService.getNearbyMerchantsLive(latitude, longitude, 10);
    if (response.success && response.data) {
      setNearbyMerchants(response.data);
      addMerchantMarkers(response.data);
    }
  };

  const updateLiveTrackingMarker = (location: any) => {
    if (!googleMapRef.current) return;

    if (liveTrackingMarker) {
      liveTrackingMarker.setPosition(
        new google.maps.LatLng(location.latitude, location.longitude)
      );
    } else {
      const marker = new google.maps.Marker({
        position: new google.maps.LatLng(location.latitude, location.longitude),
        map: googleMapRef.current,
        title: 'Live Location',
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
              <path d="M16 0C7.163 0 0 7.163 0 16c0 16 16 24 16 24s16-8 16-24C32 7.163 24.837 0 16 0z" fill="#ff4444"/>
              <circle cx="16" cy="16" r="6" fill="white"/>
            </svg>
          `)}`,
          scaledSize: new google.maps.Size(32, 40),
          anchor: new google.maps.Point(16, 40)
        }
      });
      setLiveTrackingMarker(marker);
    }
  };

  const addMerchantMarkers = (merchants: Array<Merchant & { liveLocation?: any }>) => {
    if (!googleMapRef.current) return;

    // Clear existing merchant markers
    merchantMarkersRef.current.forEach(marker => marker.setMap(null));
    merchantMarkersRef.current = [];

    merchants.forEach((merchant) => {
      if (merchant.liveLocation || (merchant.address?.coordinates)) {
        const coords = merchant.liveLocation || merchant.address?.coordinates;
        
        const marker = new google.maps.Marker({
          position: new google.maps.LatLng(coords.latitude, coords.longitude),
          map: googleMapRef.current,
          title: merchant.name,
          icon: {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
                <path d="M16 0C7.163 0 0 7.163 0 16c0 16 16 24 16 24s16-8 16-24C32 7.163 24.837 0 16 0z" fill="#28a745"/>
                <circle cx="16" cy="16" r="6" fill="white"/>
              </svg>
            `)}`,
            scaledSize: new google.maps.Size(32, 40),
            anchor: new google.maps.Point(16, 40)
          }
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="max-width: 200px;">
              <h3 style="margin: 0 0 8px 0; color: #28a745;">${merchant.name}</h3>
              <p style="margin: 0 0 8px 0; color: #757575;">${merchant.address?.street || 'Address not available'}</p>
              <p style="margin: 0 0 8px 0; color: #757575;">Type: ${merchant.type}</p>
              ${merchant.isOpen ? '<span style="color: #28a745;">● Open</span>' : '<span style="color: #dc3545;">● Closed</span>'}
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(googleMapRef.current, marker);
        });

        merchantMarkersRef.current.push(marker);
      }
    });
  };

  return (
    <View style={style}>
      {enableStoreLocator && (
        <div style={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 1000,
          background: 'white',
          padding: '10px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          minWidth: '250px'
        }}>
          <input
            type="text"
            placeholder="Search locations..."
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              fontSize: '14px',
              marginBottom: '8px'
            }}
          />
          <div style={{ fontSize: '12px', color: '#757575' }}>
            {filteredLocations.length} location(s) found
          </div>
        </div>
      )}
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          minHeight: '400px'
        }} 
      />
    </View>
  );
}