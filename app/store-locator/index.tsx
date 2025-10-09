import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { PROVIDER_GOOGLE } from '../../components/Map';
import apiClient from '../../services/apiClient'; // Assuming apiClient is set up
import authService from '../../services/authService'; // Assuming authService is set up
import locationService from '../../services/locationService'; // Assuming locationService is set up

// Mock data removed as it will be fetched from API

export default function StoreLocator() {
  const router = useRouter();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [stores, setStores] = useState([]); // State to hold store data

  const region = {
    latitude: 9.875,
    longitude: 8.878,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05
  };

  useEffect(() => {
    const loadNearbyStores = async () => {
      try {
        // Assuming authService.getToken() and locationService.getCurrentLocation() are implemented
        const token = await authService.getToken();
        const location = await locationService.getCurrentLocation();

        // Assuming apiClient.get is a function that makes HTTP requests
        const response = await apiClient.get(
          `/api/merchants/nearby?latitude=${location.latitude}&longitude=${location.longitude}&radius=10`,
          {
            Authorization: `Bearer ${token}`,
          }
        );

        if (response.success && response.data) {
          setStores(response.data);
        }
      } catch (error) {
        console.error('Error loading stores:', error);
        Alert.alert('Error', 'Failed to load nearby stores');
      }
    };

    loadNearbyStores();
  }, []);


  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Store Locator</Text>
      </View>

      {/* Map */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        enableStoreLocator={true}
        storeLocations={stores} // Use the fetched store data
        onLocationSelect={setSelectedLocation}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
      />

      {/* Location Details Panel */}
      {selectedLocation && (
        <View style={styles.detailsPanel}>
          <Text style={styles.locationTitle}>{selectedLocation.title}</Text>
          <Text style={styles.locationAddress}>{selectedLocation.address}</Text>
          <TouchableOpacity style={styles.directionsButton}>
            <Ionicons name="navigate" size={20} color="white" />
            <Text style={styles.directionsText}>Get Directions</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: 50,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  map: {
    flex: 1,
  },
  detailsPanel: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1967d2',
    padding: 12,
    borderRadius: 8,
  },
  directionsText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});