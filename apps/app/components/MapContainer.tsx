import React, { useRef, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Dimensions } from 'react-native';
import MapView, { PROVIDER_MAPBOX, Marker } from '../../components/Map';
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
    "stylers": [{ "color": "#e8f4ff" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#333333" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#ffffff" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#b3d9ff" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#ffffff" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#cce5ff" }]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{ "color": "#d6ebff" }]
  },
  {
    "featureType": "landscape",
    "elementType": "geometry",
    "stylers": [{ "color": "#f0f8ff" }]
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
    onMapReady?.();
  }, [onMapReady]);

  return (
    <MapErrorBoundary>
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_MAPBOX}
          customMapStyle={blueMapStyle}
          region={region}
          onRegionChangeComplete={onRegionChange}
          onMapReady={handleMapReady}
        >
          {/* User marker - Only show when location is set */}
          {isLocationSet === true && (
            <>
              {/* User's current location marker */}
              <Marker
                coordinate={{
                  latitude: region.latitude,
                  longitude: region.longitude,
                }}
                title="Your Location"
                description={userAddress}
              />

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
        </MapView>
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
});

export default MapContainer;
