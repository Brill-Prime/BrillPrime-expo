import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_ACCESS_TOKEN } from '../config/mapbox';

interface Location {
  latitude: number;
  longitude: number;
}

interface MapProps {
  location?: Location;
  markers?: Array<{
    latitude: number;
    longitude: number;
    title?: string;
    description?: string;
  }>;
  onLocationSelect?: (location: Location) => void;
  style?: any;
}

export default function Map({ location, markers = [], onLocationSelect, style }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    try {
      mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [location?.longitude || 0, location?.latitude || 0],
        zoom: 13,
      });

      map.current.on('load', () => {
        setIsLoading(false);
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setError('Failed to load map');
        setIsLoading(false);
      });

      // Add click handler
      if (onLocationSelect) {
        map.current.on('click', (e) => {
          onLocationSelect({
            latitude: e.lngLat.lat,
            longitude: e.lngLat.lng,
          });
        });
      }

      // Add markers
      markers.forEach((marker) => {
        if (map.current) {
          new mapboxgl.Marker()
            .setLngLat([marker.longitude, marker.latitude])
            .setPopup(
              new mapboxgl.Popup().setHTML(
                `<h3>${marker.title || ''}</h3><p>${marker.description || ''}</p>`
              )
            )
            .addTo(map.current);
        }
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl());

    } catch (err) {
      console.error('Map initialization error:', err);
      setError('Failed to initialize map');
      setIsLoading(false);
    }

    return () => {
      map.current?.remove();
    };
  }, [location, markers, onLocationSelect]);

  return (
    <View style={[styles.container, style]}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0B1A51" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      )}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#0B1A51',
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1000,
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
    padding: 20,
  },
});