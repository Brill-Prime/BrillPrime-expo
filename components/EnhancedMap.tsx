import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import Map, { Marker, PROVIDER_GOOGLE } from './Map';
import { Ionicons } from '@expo/vector-icons';
import { placesService, Place, PlaceCategory } from '../services/placesService';
import { routeService, Route } from '../services/routeService';
import { Platform } from 'react-native';

interface EnhancedMapProps {
  style?: any;
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  onRegionChangeComplete?: (region: any) => void;
  showsUserLocation?: boolean;
  showPlaces?: boolean;
  placeCategories?: PlaceCategory[];
  showRoute?: boolean;
  routeDestination?: { latitude: number; longitude: number };
  markers?: Array<{
    coordinate: { latitude: number; longitude: number };
    title?: string;
    description?: string;
    pinColor?: string;
  }>;
  children?: React.ReactNode;
}

const EnhancedMap: React.FC<EnhancedMapProps> = ({
  style,
  region,
  onRegionChangeComplete,
  showsUserLocation = true,
  showPlaces = true,
  placeCategories = ['restaurant', 'gas_station', 'hospital'],
  showRoute = false,
  routeDestination,
  markers = [],
  children,
}) => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [route, setRoute] = useState<Route | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [showPlacesPanel, setShowPlacesPanel] = useState(false);
  const [activeCategory, setActiveCategory] = useState<PlaceCategory>('all');

  useEffect(() => {
    if (showPlaces && region) {
      loadNearbyPlaces();
    }
  }, [region.latitude, region.longitude, activeCategory, showPlaces]);

  useEffect(() => {
    if (showRoute && routeDestination && region) {
      loadRoute();
    }
  }, [showRoute, routeDestination, region]);

  const loadNearbyPlaces = useCallback(async () => {
    setLoadingPlaces(true);
    try {
      const nearbyPlaces = await placesService.getNearbyPlaces(
        region.latitude,
        region.longitude,
        activeCategory,
        5000
      );
      setPlaces(nearbyPlaces);
    } catch (error) {
      console.error('Error loading places:', error);
    } finally {
      setLoadingPlaces(false);
    }
  }, [region.latitude, region.longitude, activeCategory]);

  const loadRoute = useCallback(async () => {
    if (!routeDestination) return;
    
    setLoadingRoute(true);
    try {
      const routeData = await routeService.getRoute(
        { latitude: region.latitude, longitude: region.longitude },
        routeDestination,
        'driving'
      );
      setRoute(routeData);
    } catch (error) {
      console.error('Error loading route:', error);
    } finally {
      setLoadingRoute(false);
    }
  }, [region, routeDestination]);

  const categoryIcons: Record<string, string> = {
    all: 'location',
    restaurant: 'restaurant',
    gas_station: 'gas-pump',
    hospital: 'medical',
    pharmacy: 'medkit',
    atm: 'cash',
    bank: 'business',
    supermarket: 'cart',
    hotel: 'bed',
    parking: 'car',
    police: 'shield',
  };

  const categoryColors: Record<string, string> = {
    restaurant: '#FF6B6B',
    gas_station: '#4ECDC4',
    hospital: '#E74C3C',
    pharmacy: '#3498DB',
    atm: '#2ECC71',
    bank: '#F39C12',
    supermarket: '#9B59B6',
    hotel: '#E67E22',
    parking: '#34495E',
    police: '#C0392B',
  };

  const placeMarkers = useMemo(() => {
    return places.map((place) => (
      <Marker
        key={place.id}
        coordinate={{
          latitude: place.latitude,
          longitude: place.longitude,
        }}
        title={place.name}
        description={`${place.category}${place.distance ? ` • ${place.distance.toFixed(2)}km` : ''}`}
        pinColor={categoryColors[place.category] || '#4682B4'}
        onPress={() => setSelectedPlace(place)}
      />
    ));
  }, [places]);

  const routePolyline = useMemo(() => {
    if (!route || !route.points || route.points.length === 0) return null;

    if (Platform.OS === 'web') {
      return null;
    }

    const Polyline = require('react-native-maps').Polyline;
    return (
      <Polyline
        coordinates={route.points}
        strokeColor="#4682B4"
        strokeWidth={4}
        lineJoin="round"
        lineCap="round"
      />
    );
  }, [route]);

  return (
    <View style={[styles.container, style]}>
      <Map
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChangeComplete={onRegionChangeComplete}
        showsUserLocation={showsUserLocation}
        customMapStyle={enhancedMapStyle}
      >
        {markers.map((marker, index) => (
          <Marker
            key={`marker-${index}`}
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.description}
            pinColor={marker.pinColor || '#4682B4'}
          />
        ))}

        {showPlaces && placeMarkers}
        {showRoute && routePolyline}
        {children}
      </Map>

      {showPlaces && (
        <View style={styles.categoryFilters}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {(['all', ...placeCategories] as PlaceCategory[]).map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  activeCategory === category && styles.activeCategoryButton,
                ]}
                onPress={() => setActiveCategory(category)}
              >
                <Ionicons
                  name={categoryIcons[category] as any}
                  size={20}
                  color={activeCategory === category ? '#FFF' : '#4682B4'}
                />
                <Text
                  style={[
                    styles.categoryText,
                    activeCategory === category && styles.activeCategoryText,
                  ]}
                >
                  {category.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {loadingPlaces && (
            <ActivityIndicator size="small" color="#4682B4" style={styles.loader} />
          )}
        </View>
      )}

      {selectedPlace && (
        <View style={styles.placeInfo}>
          <View style={styles.placeHeader}>
            <View style={styles.placeIcon}>
              <Ionicons
                name={categoryIcons[selectedPlace.category] as any}
                size={24}
                color={categoryColors[selectedPlace.category] || '#4682B4'}
              />
            </View>
            <View style={styles.placeDetails}>
              <Text style={styles.placeName}>{selectedPlace.name}</Text>
              <Text style={styles.placeCategory}>{selectedPlace.category.replace('_', ' ')}</Text>
              {selectedPlace.distance && (
                <Text style={styles.placeDistance}>
                  📍 {selectedPlace.distance.toFixed(2)} km away
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedPlace(null)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          {selectedPlace.address && (
            <Text style={styles.placeAddress}>{selectedPlace.address}</Text>
          )}
          <TouchableOpacity
            style={styles.directionsButton}
            onPress={() => {
              if (selectedPlace) {
                loadRoute();
              }
            }}
          >
            <Ionicons name="navigate" size={18} color="#FFF" />
            <Text style={styles.directionsText}>Get Directions</Text>
          </TouchableOpacity>
        </View>
      )}

      {route && (
        <View style={styles.routeInfo}>
          <View style={styles.routeHeader}>
            <Ionicons name="navigate-circle" size={24} color="#4682B4" />
            <Text style={styles.routeTitle}>Route Information</Text>
            <TouchableOpacity onPress={() => setRoute(null)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <View style={styles.routeStats}>
            <View style={styles.routeStat}>
              <Ionicons name="location" size={18} color="#4682B4" />
              <Text style={styles.routeStatLabel}>Distance</Text>
              <Text style={styles.routeStatValue}>
                {(route.distance / 1000).toFixed(1)} km
              </Text>
            </View>
            <View style={styles.routeStat}>
              <Ionicons name="time" size={18} color="#4682B4" />
              <Text style={styles.routeStatLabel}>Duration</Text>
              <Text style={styles.routeStatValue}>
                {Math.round(route.duration / 60)} min
              </Text>
            </View>
          </View>
        </View>
      )}

      {loadingRoute && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4682B4" />
          <Text style={styles.loadingText}>Loading route...</Text>
        </View>
      )}
    </View>
  );
};

const enhancedMapStyle = [
  {
    featureType: 'all',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#1a1a1a' }, { weight: 1.5 }],
  },
  {
    featureType: 'all',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#ffffff' }, { weight: 3 }],
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ visibility: 'on' }, { color: '#e8f5e9' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'on' }, { saturation: 10 }],
  },
  {
    featureType: 'poi.business',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'on' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry.fill',
    stylers: [{ color: '#a8e6a1' }],
  },
  {
    featureType: 'poi.medical',
    elementType: 'geometry',
    stylers: [{ color: '#ffebee' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#bdbdbd' }, { weight: 0.8 }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#424242' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.fill',
    stylers: [{ color: '#ffecb3' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#ffa726' }, { weight: 1.2 }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#e3f2fd' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'on' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry.fill',
    stylers: [{ color: '#90caf9' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#1565c0' }],
  },
  {
    featureType: 'landscape',
    elementType: 'geometry.fill',
    stylers: [{ color: '#fafafa' }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#9e9e9e' }, { weight: 0.5 }],
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  categoryFilters: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  filterScroll: {
    paddingRight: 16,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeCategoryButton: {
    backgroundColor: '#4682B4',
  },
  categoryText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#4682B4',
    textTransform: 'capitalize',
  },
  activeCategoryText: {
    color: '#FFFFFF',
  },
  loader: {
    marginLeft: 8,
  },
  placeInfo: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  placeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  placeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  placeDetails: {
    flex: 1,
  },
  placeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  placeCategory: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  placeDistance: {
    fontSize: 13,
    color: '#4682B4',
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  placeAddress: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    lineHeight: 20,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4682B4',
    paddingVertical: 14,
    borderRadius: 12,
  },
  directionsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  routeInfo: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginLeft: 8,
  },
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  routeStat: {
    alignItems: 'center',
  },
  routeStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  routeStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4682B4',
    marginTop: 2,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#4682B4',
    fontWeight: '600',
  },
});

export default EnhancedMap;
