import React, { useRef, useCallback } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MapErrorBoundary } from "./MapErrorBoundary";

// react-native-maps is native-only. Avoid importing it on web entirely.
// This file is only used on native; for web we render a lightweight placeholder.
let MapView: any = null;
let PROVIDER_GOOGLE: any = null;
let Marker: any = null;

// Important: avoid requiring `react-native-maps` at module evaluation time.
// Even conditional requires can still be statically analyzed by Metro for web.
// Do NOT reference react-native-maps in this file at all for web.
// Native can still render via separate entrypoints; this file should be web-safe.





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
    elementType: "geometry",
    stylers: [{ color: "#f5f5f5" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#1a1a1a" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#ffffff" }, { weight: 3 }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#64b5f6" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#1565c0" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#bdbdbd" }, { weight: 0.8 }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.fill",
    stylers: [{ color: "#ffecb3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#ffa726" }, { weight: 1.5 }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#e8f5e9" }],
  },
  {
    featureType: "poi",
    elementType: "labels.icon",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry.fill",
    stylers: [{ color: "#a8e6a1" }],
  },
  {
    featureType: "poi.medical",
    elementType: "geometry",
    stylers: [{ color: "#ffebee" }],
  },
  {
    featureType: "poi.business",
    elementType: "labels.icon",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: "#fafafa" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#e3f2fd" }],
  },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#9e9e9e" }, { weight: 0.5 }],
  },
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
    console.log("📍 Map ready with region:", region);
    console.log("📊 Map ready callback fired successfully");
    onMapReady?.();
  }, [onMapReady, region]);

  // Always render a placeholder on web. This prevents Metro from even evaluating the native map JSX.
  if (Platform.OS === "web") {
    return <View style={styles.mapContainer} />;
  }

  return (
    <MapErrorBoundary onRetry={() => console.log("Retrying map load...")}>
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          customMapStyle={blueMapStyle}
          region={region}
          onRegionChangeComplete={onRegionChange}
          onMapReady={handleMapReady}
          showsUserLocation={true}
        >


          {/* User marker - Only show when location is set with 3D pin style */}
          {isLocationSet === true && (
            <>
              {/* User's current location marker - 3D Pin */}
              <Marker
                coordinate={{
                  latitude: isFinite(region.latitude) ? region.latitude : 0,
                  longitude: isFinite(region.longitude) ? region.longitude : 0,
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
              {storeLocations &&
                storeLocations.map((merchant) => (
                  <Marker
                    key={merchant.id || merchant.title}
                    coordinate={{
                      latitude: isFinite(merchant.coords.lat) ? merchant.coords.lat : 0,
                      longitude: isFinite(merchant.coords.lng) ? merchant.coords.lng : 0,
                    }}
                    title={merchant.title}
                    description={`${merchant.address}${merchant.distance
                      ? ` • ${merchant.distance.toFixed(1)} km`
                      : ""
                      }`}
                    onPress={() => onMerchantPress(merchant)}
                  />
                ))}

              {/* Driver markers for live tracking */}
              {liveDrivers &&
                liveDrivers.map((driver) => (
                  <Marker
                    key={driver.id}
                    coordinate={{
                      latitude: isFinite(driver.location.latitude) ? driver.location.latitude : 0,
                      longitude: isFinite(driver.location.longitude) ? driver.location.longitude : 0,
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
    position: "relative",
  },
  map: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
  },
  userLocationPin: {
    alignItems: "center",
    justifyContent: "flex-end",
    width: 50,
    height: 60,
  },
  pinTop: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#4682B4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    // @ts-ignore
    boxShadow: "0px 4px 8px rgba(70, 130, 180, 0.4)",
  },
  pinPoint: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#4682B4",
    marginTop: -2,
  },
  pinShadow: {
    width: 20,
    height: 8,
    borderRadius: 10,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    marginTop: 2,
  },
});

export default MapContainer;
