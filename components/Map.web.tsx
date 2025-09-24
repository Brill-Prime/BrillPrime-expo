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
  const [showFallback, setShowFallback] = useState(false);

  const showFallbackMap = () => {
    setShowFallback(true);
    if (mapRef.current) {
      mapRef.current.innerHTML = `
        <div style="
          width: 100%; 
          height: 100%; 
          background: linear-gradient(45deg, #e8f4f8, #f0f8ff);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        ">
          <div style="
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: 
              linear-gradient(rgba(70, 130, 180, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(70, 130, 180, 0.1) 1px, transparent 1px);
            background-size: 50px 50px;
          "></div>
          <div style="
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            text-align: center;
            z-index: 1;
            max-width: 300px;
          ">
            <div style="
              width: 60px;
              height: 60px;
              background: #4682B4;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 15px;
              color: white;
              font-size: 24px;
            ">🗺️</div>
            <h3 style="
              margin: 0 0 10px;
              color: #333;
              font-size: 18px;
              font-weight: 600;
            ">Nigeria Region</h3>
            <p style="
              margin: 0 0 15px;
              color: #666;
              font-size: 14px;
              line-height: 1.4;
            ">Interactive map centered on Nigeria.<br/>Showing nearby merchants and locations.</p>
            <div style="
              background: #f8f9fa;
              padding: 10px;
              border-radius: 5px;
              font-size: 12px;
              color: #666;
            ">
              📍 Lat: ${region?.latitude || 9.0765}°<br/>
              📍 Lng: ${region?.longitude || 7.3986}°
            </div>
          </div>
          ${nearbyMerchants.map((merchant, index) => `
            <div style="
              position: absolute;
              width: 12px;
              height: 12px;
              background: #28a745;
              border: 2px solid white;
              border-radius: 50%;
              top: ${20 + (index * 15)}%;
              left: ${25 + (index * 12)}%;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              animation: pulse 2s infinite;
            "></div>
          `).join('')}
          <style>
            @keyframes pulse {
              0% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.2); opacity: 0.7; }
              100% { transform: scale(1); opacity: 1; }
            }
          </style>
        </div>
      `;
    }
  };

  // Load Google Maps script based on environment variables
  useEffect(() => {
    // Access API key from multiple sources with your specific key as fallback
    const apiKey = Constants.expoConfig?.extra?.googleMapsApiKey || 
                   Constants.expoConfig?.web?.config?.googleMapsApiKey ||
                   process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
                   process.env.GOOGLE_MAPS_API_KEY;

    if (!window.google) {
      console.log('Loading Google Maps with API key:', apiKey.substring(0, 10) + '...');

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,marker&loading=async`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      script.onerror = (error) => {
        console.error('Failed to load Google Maps script:', error);
        // Try to initialize anyway in case it's just a warning
        setTimeout(initializeMap, 1000);
      };
      document.head.appendChild(script);
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
    if (!mapRef.current) {
      setTimeout(initializeMap, 500);
      return;
    }

    // Check if Google Maps loaded properly, wait if not ready
    if (!window.google || !window.google.maps) {
      console.log('Google Maps not ready yet, retrying...');
      setTimeout(initializeMap, 1000);
      return;
    }

    try {
      const mapOptions: google.maps.MapOptions = {
        center: region ? 
          new google.maps.LatLng(region.latitude, region.longitude) : 
          new google.maps.LatLng(9.0765, 7.3986), // Default to Nigeria
        zoom: region ? Math.round(Math.log(360 / region.latitudeDelta) / Math.LN2) : 6, // Adjusted zoom for Nigeria
        mapTypeId: mapType === 'satellite' ? google.maps.MapTypeId.SATELLITE : google.maps.MapTypeId.ROADMAP,
        mapId: '8a42169807b0e4f056d1abfc', // Custom Map ID for brillprime styling
        disableDefaultUI: !toolbarEnabled,
        zoomControl: zoomEnabled !== false,
        scrollwheel: scrollEnabled !== false,
        draggable: scrollEnabled !== false,
        disableDoubleClickZoom: !zoomEnabled,
        gestureHandling: scrollEnabled === false ? 'none' : 'auto'
      };

      googleMapRef.current = new google.maps.Map(mapRef.current, mapOptions);
      console.log('Google Maps initialized successfully');
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      // Only show fallback after multiple failed attempts
      setTimeout(() => {
        if (!googleMapRef.current) {
          showFallbackMap();
        }
      }, 3000);
      return;
    }

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
      if (merchant.liveLocation || merchant.latitude) {
        const coords = merchant.liveLocation || { latitude: merchant.latitude, longitude: merchant.longitude };

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
              <p style="margin: 0 0 8px 0; color: #757575;">${merchant.address || 'Address not available'}</p>
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

  if (showFallback) {
    return (
      <View style={style}>
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