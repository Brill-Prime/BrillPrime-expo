
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import Constants from 'expo-constants';

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
  [key: string]: any;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    // Load Google Maps script
    if (!window.google) {
      // Use the API key directly for now
      const apiKey = 'AIzaSyDdTWdXMVc9twUm1ng_Ef_EpslM_hBb3uw';
      console.log('Loading Google Maps with API key');
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
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
        },
        (error) => {
          console.log('Geolocation error:', error);
        }
      );
    }

    // Add markers from children
    addMarkersFromChildren();
  };

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
          const marker = new google.maps.Marker({
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
