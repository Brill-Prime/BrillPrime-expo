
import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image, Animated, StatusBar, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MapView, { PROVIDER_GOOGLE, Marker } from '../../components/Map';
import * as Location from 'expo-location';
import { useAlert } from '../../components/AlertProvider';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function ConsumerHome() {
  const router = useRouter();
  const { showConfirmDialog, showError, showSuccess, showInfo } = useAlert();
  const [isLocationSet, setIsLocationSet] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [userAddress, setUserAddress] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-280)).current;
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
    loadUserData();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadUserData = async () => {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      if (email) {
        setUserEmail(email);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

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

  const toggleMenu = () => {
    const sidebarWidth = Math.min(280, width * 0.8);
    const toValue = isMenuOpen ? -sidebarWidth : 0;
    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleGoBack = () => {
    showConfirmDialog(
      "Go Back",
      "Are you sure you want to go back to dashboard?",
      () => router.push('/dashboard/consumer')
    );
  };

  const handleMenuItemPress = (item: string) => {
    toggleMenu();
    
    switch (item) {
      case "Profile":
        router.push("/profile");
        break;
      case "Orders":
        router.push("/orders/consumer-orders");
        break;
      case "Cart":
        router.push("/cart");
        break;
      case "Favorites":
        router.push("/favorites");
        break;
      case "Settings":
        router.push("/profile/edit");
        break;
      case "Support":
        router.push("/support");
        break;
      case "Switch to Merchant":
        router.push("/home/merchant");
        break;
      case "Switch to Driver":
        router.push("/home/driver");
        break;
      default:
        showInfo("Navigation", `Navigating to ${item}`);
    }
  };

  const handleSignOut = async () => {
    showConfirmDialog(
      "Sign Out",
      "Are you sure you want to sign out?",
      async () => {
        try {
          await AsyncStorage.multiRemove(["userToken", "userEmail", "userRole"]);
          router.replace("/");
        } catch (error) {
          console.error("Error signing out:", error);
        }
      }
    );
  };

  const handleSetLocationAutomatically = () => {
    showConfirmDialog(
      "Location Access",
      "Allow Brill Prime to access your location to find nearby merchants?",
      async () => {
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
      }
    );
  };

  const handleSetLocationLater = () => {
    router.push("/search");
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="transparent" translucent />
      
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

      {/* Header with Back Button and Menu */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
          <Ionicons name={isMenuOpen ? "close" : "menu"} size={30} color="#000" />
        </TouchableOpacity>
      </View>

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

      {/* Navigation Sidebar */}
      <Animated.View style={[styles.sidebar, { right: slideAnim }]}>
        <View style={styles.sidebarContent}>
          {/* Profile Section */}
          <View style={styles.sidebarProfile}>
            <View style={styles.sidebarProfileImage}>
              <Ionicons name="person" size={30} color="#4682B4" />
            </View>
            <Text style={styles.sidebarProfileName}>Consumer</Text>
            <Text style={styles.sidebarProfileEmail}>{userEmail}</Text>
          </View>
          
          {/* Menu Items */}
          <View style={styles.menuList}>
            {['Profile', 'Orders', 'Cart', 'Favorites', 'Settings', 'Support'].map((item) => (
              <TouchableOpacity 
                key={item}
                style={styles.menuItem} 
                onPress={() => handleMenuItemPress(item)}
              >
                <Text style={styles.menuItemText}>{item}</Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Bottom Buttons */}
          <View style={styles.sidebarBottom}>
            <TouchableOpacity 
              style={styles.switchButton} 
              onPress={() => handleMenuItemPress("Switch to Merchant")}
            >
              <Text style={styles.switchButtonText}>Switch to Merchant</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.switchButton} 
              onPress={() => handleMenuItemPress("Switch to Driver")}
            >
              <Text style={styles.switchButtonText}>Switch to Driver</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.signOutButton} 
              onPress={handleSignOut}
            >
              <Text style={styles.signOutButtonText}>Sign out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Menu Overlay */}
      {isMenuOpen && (
        <TouchableOpacity 
          style={styles.menuOverlay} 
          onPress={toggleMenu}
          activeOpacity={1}
        />
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
  },
  map: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  backButton: {
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
  },
  menuButton: {
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
  sidebar: {
    position: 'absolute',
    top: 0,
    width: Math.min(280, width * 0.8),
    height: '100%',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 1000,
  },
  sidebarContent: {
    flex: 1,
    paddingTop: 60,
  },
  sidebarProfile: {
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sidebarProfileImage: {
    width: 80,
    height: 80,
    backgroundColor: '#f8f9fa',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  sidebarProfileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    fontFamily: 'Montserrat-SemiBold',
  },
  sidebarProfileEmail: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Montserrat-Regular',
  },
  menuList: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Montserrat-Medium',
  },
  sidebarBottom: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  switchButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  switchButtonText: {
    fontSize: 14,
    color: '#4682B4',
    fontWeight: '500',
    fontFamily: 'Montserrat-Medium',
  },
  signOutButton: {
    backgroundColor: '#ffe6e6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutButtonText: {
    fontSize: 14,
    color: '#e74c3c',
    fontWeight: '500',
    fontFamily: 'Montserrat-Medium',
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
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
