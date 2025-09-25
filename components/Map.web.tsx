import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MapProps {
  style?: ViewStyle;
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
}

export default function MapViewWeb({ style, initialRegion, markers }: MapProps) {
  const [mapError, setMapError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (mapError) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={32} color="#e74c3c" />
          <Text style={styles.errorText}>Map failed to load</Text>
          <Text style={styles.errorSubtext}>Please check your connection</Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="map" size={32} color="#4682B4" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.mapContainer}>
        <View style={styles.mapHeader}>
          <Ionicons name="location" size={20} color="#4682B4" />
          <Text style={styles.locationText}>Current Location</Text>
        </View>

        <View style={styles.mapContent}>
          <View style={styles.mapGrid}>
            {Array.from({ length: 20 }, (_, i) => (
              <View key={i} style={styles.gridLine} />
            ))}
          </View>

          <View style={styles.centerMarker}>
            <Ionicons name="radio-button-on" size={16} color="#e74c3c" />
          </View>

          <Text style={styles.coordinatesText}>
            {initialRegion ? 
              `${initialRegion.latitude.toFixed(4)}, ${initialRegion.longitude.toFixed(4)}` :
              '6.5244, 3.3792'
            }
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f8ff',
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    marginTop: 10,
    fontWeight: '600',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#4682B4',
    marginTop: 10,
    fontWeight: '500',
  },
  mapContainer: {
    flex: 1,
    minHeight: 200,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(70, 130, 180, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  locationText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#4682B4',
    fontWeight: '600',
  },
  mapContent: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  mapGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridLine: {
    width: '10%',
    height: '10%',
    borderWidth: 0.5,
    borderColor: 'rgba(70, 130, 180, 0.2)',
  },
  centerMarker: {
    position: 'absolute',
    zIndex: 10,
  },
  coordinatesText: {
    position: 'absolute',
    bottom: 15,
    fontSize: 12,
    color: '#666',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
});