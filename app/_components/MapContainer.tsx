import React, { useRef, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Dimensions } from 'react-native';
import Map, { PROVIDER_GOOGLE, Marker } from '../../components/Map';
import { Ionicons } from '@expo/vector-icons';
import { MapErrorBoundary } from './MapErrorBoundary';

const { width, height } = Dimensions.get('window');

interface StoreLocation {
  id?: string;
  title: string;
  address: string;
  coords: { lat: number; lng: number };
  distance?: number;
  rating?: number;
  isOpen?: boolean;
  category?: string;
  phone?: string;
  description?: string;
}

interface Driver {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  location: {
    latitude: number;
    longitude: number;
  };
  eta: string;
  status: string;
  distanceToMerchant?: number;
  distanceToConsumer?: number;
}

interface MapContainerProps {
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  isLocationSet: boolean | null;
  storeLocations: StoreLocation[];
  liveDrivers: Driver[];
  userAddress: string;
  onRegionChange: (region: any) => void;
  onMerchantPress: (merchant: StoreLocation) => void;
  onMapReady?: () => void;
}

const blueMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#1a1a1a" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#ffffff" }, { "weight": 3 }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#64b5f6" }]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#1565c0" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#ffffff" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#bdbdbd" }, { "weight": 0.8 }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#ffecb3" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#ffa726" }, { "weight": 1.5 }]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{ "color": "#e8f5e9" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "on" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#a8e6a1" }]
  },
  {
    "featureType": "poi.medical",
    "elementType": "geometry",
    "stylers": [{ "color": "#ffebee" }]
  },
  {
    "featureType": "poi.business",
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "on" }]
  },
  {
    "featureType": "landscape",
    "elementType": "geometry",
    "stylers": [{ "color": "#fafafa" }]
  },
  {
    "featureType": "transit",
    "elementType": "geometry",
    "stylers": [{ "color": "#e3f2fd" }]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#9e9e9e" }, { "weight": 0.5 }]
  }
];

const MapContainer: React.FC<MapContainerProps> = ({
  region,
  isLocationSet,
  storeLocations,
  liveDrivers,
  userAddress,
  onRegionChange,
  onMerchantPress,
  onMapReady,
}) => {
  const mapRef = useRef<any>(null);

  const handleMapReady = useCallback(() => {
    console.log('📍 Map ready with region:', region);
    onMapReady?.();
  }, [onMapReady, region]);

  return (
    <MapErrorBoundary onRetry={() => console.log('Retrying map load...')}>
      <View style={styles.mapContainer}>
        <Map
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          customMapStyle={blueMapStyle}
          region={region}
          onRegionChangeComplete={onRegionChange}
          onMapReady={handleMapReady}
          onError={() => console.error('Map component reported an error')}
          showsUserLocation={true}
        >
          {/* User marker - Only show when location is set with 3D pin style */}
          {isLocationSet === true && (
            <>
              {/* User's current location marker - 3D Pin */}
              <Marker
                coordinate={{
                  latitude: region.latitude,
                  longitude: region.longitude,
                }}
                title="Your Location"
                description={userAddress}
              >
                <View style={styles.userLocationPin}>
                  <View style={styles.pinTop}>
                    <Ionicons name="person" size={16} color="#FFFFFF" />
                  </View>
                  <View style={styles.pinPoint} />
                  <View style={styles.pinShadow} />
                </View>
              </Marker>

              {/* Merchant markers */}
              {storeLocations && storeLocations.map((merchant) => (
                <Marker
                  key={merchant.id || merchant.title}
                  coordinate={{
                    latitude: merchant.coords.lat,
                    longitude: merchant.coords.lng,
                  }}
                  title={merchant.title}
                  description={`${merchant.address}${merchant.distance ? ` • ${merchant.distance.toFixed(1)} km` : ''}`}
                  onPress={() => onMerchantPress(merchant)}
                />
              ))}

              {/* Driver markers for live tracking */}
              {liveDrivers && liveDrivers.map((driver) => (
                <Marker
                  key={driver.id}
                  coordinate={{
                    latitude: driver.location.latitude,
                    longitude: driver.location.longitude,
                  }}
                  title={`Driver ${driver.name}`}
                  description={`ETA: ${driver.eta} mins`}
                />
              ))}
            </>
          )}
        </Map>
      </View>
    </MapErrorBoundary>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  userLocationPin: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 50,
    height: 60,
  },
  pinTop: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4682B4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#4682B4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  pinPoint: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#4682B4',
    marginTop: -2,
  },
  pinShadow: {
    width: 20,
    height: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    marginTop: 2,
  },
});

export default MapContainer;
