
import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MapView, { PROVIDER_GOOGLE, Marker } from '../../components/Map';
import * as Location from 'expo-location';
import { useAlert } from '../../components/AlertProvider';

const { width, height } = Dimensions.get('window');

export default function ConsumerHome() {
  const router = useRouter();
  const { showConfirmDialog, showError, showSuccess } = useAlert();
  const [isLocationSet, setIsLocationSet] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [userAddress, setUserAddress] = useState("");
  const [region, setRegion] = useState({
    latitude: 9.0765, // Abuja, Nigeria
    longitude: 7.3986,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    checkSavedLocation();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const checkSavedLocation = async () => {
    try {
      const savedLocation = await AsyncStorage.getItem("userLocation");
      const savedAddress = await AsyncStorage.getItem("userAddress");

      if (savedLocation && isMountedRef.current) {
        const location = JSON.parse(savedLocation);
        setRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        setIsLocationSet(true);
        setUserAddress(savedAddress || "Your Location");
      }
    } catch (error) {
      console.error("Error loading saved location:", error);
    }
  };

  const handleGoBack = () => {
    showConfirmDialog(
      "Go Back",
      "Are you sure you want to go back to dashboard?",
      () => router.push('/dashboard/consumer')
    );
  };

  const handleSetLocationAutomatically = async () => {
    if (!isMountedRef.current) return;

    setIsLoadingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showError("Permission Denied", "Location permission is required to find nearby merchants.");
        setIsLoadingLocation(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (!isMountedRef.current) return;

      const { latitude, longitude } = location.coords;
      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setRegion(newRegion);

      let addressInfo = "Your Current Location";
      try {
        let reverseGeocode = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        if (reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          addressInfo = `${address.city || address.subregion || address.region}, ${address.country}`;
        }
      } catch (geoError) {
        console.log("Geocoding failed, using default address");
      }

      if (!isMountedRef.current) return;

      setUserAddress(addressInfo);
      setIsLocationSet(true);

      await AsyncStorage.setItem("userLocation", JSON.stringify({ latitude, longitude }));
      await AsyncStorage.setItem("userAddress", addressInfo);

      setIsLoadingLocation(false);
      showSuccess("Location Set!", `Your location has been set to ${addressInfo}. You can now discover merchants near you.`);
    } catch (error) {
      console.error("Error getting location:", error);
      if (isMountedRef.current) {
        setIsLoadingLocation(false);
        showError("Location Error", "Unable to get your location. Please try again or set manually.");
      }
    }
  };

  const handleSetLocationLater = () => {
    router.push("/search");
  };

  return (
    <View style={styles.container}>
      {/* Full Screen Map */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        mapType="standard"
        pitchEnabled={false}
        rotateEnabled={false}
        scrollEnabled={true}
        zoomEnabled={true}
      >
        <Marker
          coordinate={{
            latitude: region.latitude,
            longitude: region.longitude,
          }}
          title="You are here"
        />
      </MapView>

      {/* Simple Back Button */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={handleGoBack}
        activeOpacity={0.8}
      >
        <View style={styles.backArrow} />
      </TouchableOpacity>

      {/* Location Setup Modal - Only show if location not set */}
      {!isLocationSet && (
        <View style={styles.bottomCard}>
          {/* Location Icon */}
          <View style={styles.locationIconContainer}>
            <View style={styles.locationIconInner}>
              <Image 
                source={require('../../assets/images/globe_img.png')} 
                style={styles.globeIcon} 
                resizeMode="cover" 
              />
            </View>
          </View>

          {/* Content */}
          <Text style={styles.whereAreYouText}>Where are you?</Text>
          <Text style={styles.descriptionText}>
            Set your location so you can see merchants available around you
          </Text>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={styles.setAutomaticallyButton} 
              onPress={handleSetLocationAutomatically}
              activeOpacity={0.9}
              disabled={isLoadingLocation}
            >
              <Text style={styles.setAutomaticallyText}>
                {isLoadingLocation ? "Getting location..." : "Set automatically"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.setLaterButton} 
              onPress={handleSetLocationLater}
              activeOpacity={0.9}
              disabled={isLoadingLocation}
            >
              <Text style={styles.setLaterText}>Set later</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Loading Overlay */}
      {isLoadingLocation && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Getting your location...</Text>
            <Text style={styles.loadingSubtext}>This may take a few seconds</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#f5f5f5',
  },
  map: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    backgroundColor: 'white',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    zIndex: 10,
  },
  backArrow: {
    width: 16,
    height: 16,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: '#333',
    transform: [{ rotate: '225deg' }],
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 450,
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 30,
    zIndex: 20,
  },
  locationIconContainer: {
    position: 'absolute',
    top: -30,
    width: 80,
    height: 80,
    backgroundColor: '#4682B4',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4682B4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  locationIconInner: {
    width: 50,
    height: 50,
    backgroundColor: 'white',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  globeIcon: {
    width: 25,
    height: 25,
  },
  whereAreYouText: {
    color: '#010E42',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 15,
    textAlign: 'center',
    fontFamily: 'Montserrat-ExtraBold',
  },
  descriptionText: {
    color: 'black',
    fontSize: 14,
    fontWeight: '200',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Montserrat-Light',
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 15,
  },
  setAutomaticallyButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#4682B4',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4682B4',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  setAutomaticallyText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Montserrat-Medium',
  },
  setLaterButton: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#4682B4',
    borderRadius: 25,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setLaterText: {
    color: '#131313',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Montserrat-Medium',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
  },
  loadingContainer: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    maxWidth: 280,
    marginHorizontal: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Montserrat-SemiBold',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Montserrat-Regular',
  },
});
