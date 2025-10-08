import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image, Animated, StatusBar, ScrollView, Platform, ActivityIndicator, TextInput, Modal } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MapView, { PROVIDER_GOOGLE, Marker } from '../../components/Map';
const MapViewDirections = Platform.OS === 'web' ? null : require('react-native-maps-directions').default;
import { locationService } from '../../services/locationService';
import * as Location from 'expo-location';
import { useAlert } from '../../components/AlertProvider';
import { Ionicons } from '@expo/vector-icons';
import { debounce } from 'lodash';

const { width, height } = Dimensions.get('window');

const theme = {
  colors: {
    primary: '#4682B4',
    primaryDark: '#0B1A51',
    background: '#fff',
    text: '#333',
    textLight: '#666',
    white: '#fff',
    error: '#e74c3c',
    border: '#f0f0f0',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 5,
    },
  },
  typography: {
    bold: 'Montserrat-ExtraBold',
    semiBold: 'Montserrat-SemiBold',
    medium: 'Montserrat-Medium',
    regular: 'Montserrat-Regular',
    light: 'Montserrat-Light',
  },
};

interface StoreLocation {
  title: string;
  address: string;
  coords: { lat: number; lng: number };
}

interface Driver {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  eta: string;
}

export default function ConsumerHome() {
  const router = useRouter();
  const { showConfirmDialog, showError, showSuccess, showInfo } = useAlert();
  const [isLocationSet, setIsLocationSet] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [userAddress, setUserAddress] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLiveTrackingEnabled, setIsLiveTrackingEnabled] = useState(false);
  const [nearbyDrivers, setNearbyDrivers] = useState<Driver[]>([]);
  const [storeLocations, setStoreLocations] = useState<StoreLocation[]>([
    {
      title: "NASCO FOODS",
      address: "Yakubu Gowon Way, Jos",
      coords: { lat: 9.868215, lng: 8.870632 }
    },
    {
      title: "Airforce Masjid",
      address: "Abattoir Rd, Jos",
      coords: { lat: 9.882716, lng: 8.886276 }
    }
  ]);
  const [region, setRegion] = useState({
    latitude: 9.0765,
    longitude: 7.3986,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<StoreLocation | null>(null);

  const slideAnim = useRef(new Animated.Value(-Math.min(280, width * 0.8))).current;
  const mapRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  // Calculate delta based on screen dimensions
  const calculateDelta = (latitude: number) => {
    const latitudeDelta = 0.0922 * (height / 800);
    const aspectRatio = width / height;
    const longitudeDelta = latitudeDelta * aspectRatio;
    return { latitudeDelta, longitudeDelta };
  };

  // Fit map to show user location and nearby points
  const fitToUserLocation = useCallback(() => {
    if (mapRef.current && (nearbyDrivers.length > 0 || storeLocations.length > 0)) {
      const locationsToShow = [
        { latitude: region.latitude, longitude: region.longitude },
        ...nearbyDrivers.map(driver => ({
          latitude: driver.latitude,
          longitude: driver.longitude,
        })),
        ...storeLocations.map(store => store.coords)
      ];
      mapRef.current.fitToCoordinates(
        locationsToShow,
        {
          edgePadding: { top: 100, right: 20, bottom: isLocationSet ? 150 : 400, left: 20 },
          animated: true
        }
      );
    } else if (mapRef.current) {
      // If no nearby points, just center on user location
      mapRef.current.animateToRegion(region, 1000);
    }
  }, [region, nearbyDrivers, storeLocations, isLocationSet]);

  // Debounced region change handler
  const handleRegionChange = useCallback(
    debounce((newRegion: any) => {
      if (isMountedRef.current) {
        setRegion(newRegion);
      }
    }, 500),
    []
  );

  const loadNearbyMerchants = async (latitude: number, longitude: number) => {
    try {
      // Load merchants from backend
      const { merchantService } = await import('../../services/merchantService');
      const response = await merchantService.getNearbyMerchants(latitude, longitude, 10000); // 10km radius

      if (response.success && response.data) {
        // Convert merchants to store locations format
        const locations: StoreLocation[] = response.data.map(merchant => ({
          title: merchant.name,
          address: merchant.address,
          coords: { lat: merchant.latitude, lng: merchant.longitude }
        }));

        setStoreLocations(locations);

        // Also set as nearby merchants for tracking
        setNearbyDrivers(response.data.map(m => ({
          id: m.id,
          latitude: m.latitude,
          longitude: m.longitude,
          name: m.name,
          eta: calculateETA(latitude, longitude, m.latitude, m.longitude)
        })));
      }
    } catch (error) {
      console.error('Error loading nearby merchants:', error);
      showError("Loading Error", "Could not load nearby merchants. Please try again.");
    }
  };

  const calculateETA = (lat1: number, lon1: number, lat2: number, lon2: number): string => {
    const distance = locationService.calculateDistance(lat1, lon1, lat2, lon2);
    const avgSpeed = 30; // km/h average speed in urban areas
    const timeInMinutes = Math.round((distance / avgSpeed) * 60);
    return `${timeInMinutes} mins`;
  };


  useEffect(() => {
    isMountedRef.current = true;
    checkSavedLocation();
    loadUserData();
    initializeLiveTracking();

    return () => {
      isMountedRef.current = false;
      locationService.stopLiveTracking();
    };
  }, []);

  const initializeLiveTracking = async () => {
    try {
      await locationService.startLiveTracking(30000); // Update every 30 seconds
      setIsLiveTrackingEnabled(true);

      const unsubscribe = locationService.onLocationUpdate((location) => {
        if (isMountedRef.current) {
          // Update user's current region
          const deltas = calculateDelta(location.latitude);
          setRegion({
            latitude: location.latitude,
            longitude: location.longitude,
            ...deltas,
          });

          // Load nearby merchants based on the new location
          loadNearbyMerchants(location.latitude, location.longitude);

          // Update driver positions (this is a mock, real implementation would come from backend)
          setNearbyDrivers(prev => [
            ...prev.filter(d => d.id !== 'driver1'), // Remove old driver1 if exists
            {
              id: 'driver1',
              latitude: location.latitude + 0.002, // Simulate driver slightly ahead
              longitude: location.longitude + 0.002,
              name: 'Driver John',
              eta: calculateETA(location.latitude, location.longitude, location.latitude + 0.002, location.longitude + 0.002)
            }
          ]);
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Failed to initialize live tracking:', error);
      if (isMountedRef.current) {
        showError("Tracking Error", "Failed to start live tracking. Some features may be limited.");
      }
    }
  };

  const loadUserData = async () => {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      if (email && isMountedRef.current) {
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
        const deltas = calculateDelta(location.latitude);
        setRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          ...deltas,
        });
        setIsLocationSet(true);
        setUserAddress(savedAddress || "Your Location");
        // Load merchants near the saved location
        loadNearbyMerchants(location.latitude, location.longitude);
      } else {
        // If no saved location, try to get current location immediately
        handleSetLocationAutomatically();
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
          showError("Sign Out Failed", "Unable to sign out. Please try again.");
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
          const deltas = calculateDelta(latitude);
          const newRegion = {
            latitude,
            longitude,
            ...deltas,
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
              addressInfo = `${address.city || address.region || ''}, ${address.country || ''}`.trim().replace(/^,/, '');
              if (!addressInfo) addressInfo = "Unknown Location";
            }
          } catch (geoError) {
            console.log("Geocoding failed, using default address");
          }

          if (!isMountedRef.current) return;

          setUserAddress(addressInfo);
          setIsLocationSet(true);

          await AsyncStorage.setItem("userLocation", JSON.stringify({ latitude, longitude }));
          await AsyncStorage.setItem("userAddress", addressInfo);

          // Load merchants near the newly set location
          loadNearbyMerchants(latitude, longitude);

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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Implement search logic here (filter storeLocations or call API)
  };

  const handleStoreSelect = (store: StoreLocation) => {
    setSelectedDestination(store);
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: store.coords.lat,
        longitude: store.coords.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  const retryLoadMap = () => {
    setMapError(false);
    setIsMapLoading(true);
  };

  const MemoizedMarker = React.memo(Marker);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="transparent" translucent />

      {/* Map View */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChangeComplete={handleRegionChange}
        onMapLoaded={() => {
          setIsMapLoading(false);
          setMapError(false);
          fitToUserLocation();
        }}
        onMapError={() => {
          setMapError(true);
          setIsMapLoading(false);
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        mapType="standard"
        pitchEnabled={false}
        rotateEnabled={false}
        scrollEnabled={true}
        zoomEnabled={true}
        paddingAdjustmentBehavior="automatic"
        padding={{ top: 100, right: 20, bottom: isLocationSet ? 150 : 400, left: 20 }}
      >
        {!isMapLoading && !mapError && (
          <>
            {/* @ts-expect-error - Marker component accepts these props but types are not properly defined */}
            <MemoizedMarker
              coordinate={{ latitude: region.latitude, longitude: region.longitude }}
              title="You are here"
              pinColor="#4682B4"
            />

            {nearbyDrivers.map((driver) => (
              // @ts-expect-error - Marker component accepts these props but types are not properly defined
              <MemoizedMarker
                key={driver.id}
                coordinate={{ latitude: driver.latitude, longitude: driver.longitude }}
                title={driver.name}
                description={`ETA: ${driver.eta}`}
                image={require('../../assets/images/car_icon.png')} // Assuming you have a car icon
                anchor={{ x: 0.5, y: 0.5 }}
                style={{ width: 40, height: 40 }}
              />
            ))}

            {storeLocations.map((store) => (
              // @ts-expect-error - Marker component accepts these props but types are not properly defined
              <MemoizedMarker
                key={store.title}
                coordinate={{ latitude: store.coords.lat, longitude: store.coords.lng }}
                title={store.title}
                description={store.address}
                onPress={() => handleStoreSelect(store)}
              />
            ))}

            {selectedDestination && MapViewDirections && (
              <MapViewDirections
                origin={region}
                destination={selectedDestination.coords}
                apikey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY"} // Replace with your actual API key
                strokeWidth={4}
                strokeColor={theme.colors.primary}
                optimizeWaypoints={true}
                onReady={(result: any) => {
                  console.log(`Distance: ${result.distance} km`);
                  console.log(`Duration: ${result.duration} min`);
                }}
                onError={(error: any) => {
                  console.error("Directions error:", error);
                  showError("Navigation Error", "Could not calculate route. Please try again.");
                }}
              />
            )}
          </>
        )}
      </MapView>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={theme.colors.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for merchants..."
            placeholderTextColor={theme.colors.textLight}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          <TouchableOpacity style={styles.filterButton} onPress={() => setIsFilterModalOpen(true)}>
            <Ionicons name="options" size={22} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Header with Back Button and Menu */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
          <Ionicons name={isMenuOpen ? "close" : "menu"} size={30} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Location Setup Modal - Only show if location not set */}
      {!isLocationSet && (
        <View style={styles.bottomCard}>
          <View style={styles.locationIconContainer}>
            <View style={styles.locationIconInner}>
              <Image
                source={require('../../assets/images/globe_img.png')}
                style={styles.globeIcon}
                resizeMode="cover"
              />
            </View>
          </View>

          <Text style={styles.whereAreYouText}>Where are you?</Text>
          <Text style={styles.descriptionText}>
            Set your location so you can see merchants available around you
          </Text>

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

      {/* Store List (when location is set) */}
      {isLocationSet && storeLocations.length > 0 && (
        <View style={styles.storeListContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storeList}
          >
            {storeLocations.map((store) => (
              <TouchableOpacity
                key={store.title}
                style={styles.storeCard}
                onPress={() => handleStoreSelect(store)}
              >
                <View style={styles.storeCardIcon}>
                  <Ionicons name="business" size={24} color={theme.colors.primary} />
                </View>
                <Text style={styles.storeCardTitle}>{store.title}</Text>
                <Text style={styles.storeCardAddress}>{store.address}</Text>
                <Text style={styles.storeCardDistance}>2.5 km away</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Navigation Sidebar */}
      <Animated.View style={[styles.sidebar, { right: slideAnim }]}>
        <View style={styles.sidebarContent}>
          <View style={styles.sidebarProfile}>
            <View style={styles.sidebarProfileImage}>
              <Ionicons name="person" size={30} color={theme.colors.primary} />
            </View>
            <Text style={styles.sidebarProfileName}>Consumer</Text>
            <Text style={styles.sidebarProfileEmail}>{userEmail}</Text>
          </View>

          <View style={styles.menuList}>
            {['Profile', 'Orders', 'Cart', 'Favorites', 'Settings', 'Support'].map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.menuItem}
                onPress={() => handleMenuItemPress(item)}
              >
                <Text style={styles.menuItemText}>{item}</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textLight} />
              </TouchableOpacity>
            ))}
          </View>

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
      {(isLoadingLocation || isMapLoading) && !mapError && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading...</Text>
            <Text style={styles.loadingSubtext}>
              {isLoadingLocation ? "Getting your location" : "Loading map"}
            </Text>
          </View>
        </View>
      )}

      {/* Map Error View */}
      {mapError && (
        <View style={styles.errorContainer}>
          <View style={styles.errorContent}>
            <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
            <Text style={styles.errorTitle}>Map Loading Error</Text>
            <Text style={styles.errorMessage}>
              Unable to load the map. Please check your internet connection.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={retryLoadMap}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Filter Modal */}
      <Modal
        visible={isFilterModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsFilterModalOpen(false)}
      >
        <View style={styles.filterModalContainer}>
          <View style={styles.filterModal}>
            <Text style={styles.filterModalTitle}>Filter Options</Text>

            <View style={styles.filterOption}>
              <Text style={styles.filterOptionText}>Distance</Text>
              <View style={styles.filterOptionValues}>
                {['<1km', '<5km', '<10km', 'Any'].map((option) => (
                  <TouchableOpacity key={option} style={styles.filterChip}>
                    <Text style={styles.filterChipText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterOption}>
              <Text style={styles.filterOptionText}>Category</Text>
              <View style={styles.filterOptionValues}>
                {['Food', 'Gas', 'Retail', 'All'].map((option) => (
                  <TouchableOpacity key={option} style={styles.filterChip}>
                    <Text style={styles.filterChipText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterOption}>
              <Text style={styles.filterOptionText}>Rating</Text>
              <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star}>
                    <Ionicons
                      name={star <= 3 ? "star" : "star-outline"}
                      size={24}
                      color={theme.colors.primary}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterModalButtons}>
              <TouchableOpacity
                style={[styles.filterModalButton, styles.filterModalButtonOutline]}
                onPress={() => setIsFilterModalOpen(false)}
              >
                <Text style={styles.filterModalButtonOutlineText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterModalButton, styles.filterModalButtonFilled]}
                onPress={() => setIsFilterModalOpen(false)}
              >
                <Text style={styles.filterModalButtonFilledText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: theme.colors.background,
  },
  map: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
    ...theme.shadows.medium,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontFamily: theme.typography.regular,
    fontSize: 14,
  },
  filterButton: {
    padding: 8,
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
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.small,
  },
  menuButton: {
    width: 40,
    height: 40,
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.small,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 400,
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    ...theme.shadows.medium,
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
    backgroundColor: theme.colors.primary,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.medium,
  },
  locationIconInner: {
    width: 50,
    height: 50,
    backgroundColor: theme.colors.white,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  globeIcon: {
    width: 25,
    height: 25,
  },
  whereAreYouText: {
    color: theme.colors.primaryDark,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 15,
    textAlign: 'center',
    fontFamily: theme.typography.bold,
  },
  descriptionText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '200',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: theme.typography.light,
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 15,
  },
  setAutomaticallyButton: {
    width: '100%',
    height: 50,
    backgroundColor: theme.colors.primary,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.small,
  },
  setAutomaticallyText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: theme.typography.medium,
  },
  setLaterButton: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 25,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setLaterText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: theme.typography.medium,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    width: Math.min(280, width * 0.8),
    height: '100%',
    backgroundColor: theme.colors.white,
    ...theme.shadows.medium,
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
    borderBottomColor: theme.colors.border,
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
    color: theme.colors.text,
    marginBottom: 5,
    fontFamily: theme.typography.semiBold,
  },
  sidebarProfileEmail: {
    fontSize: 14,
    color: theme.colors.textLight,
    fontFamily: theme.typography.regular,
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
    borderBottomColor: theme.colors.border,
  },
  menuItemText: {
    fontSize: 16,
    color: theme.colors.text,
    fontFamily: theme.typography.medium,
  },
  sidebarBottom: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
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
    color: theme.colors.primary,
    fontWeight: '500',
    fontFamily: theme.typography.medium,
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
    color: theme.colors.error,
    fontWeight: '500',
    fontFamily: theme.typography.medium,
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.overlay,
    zIndex: 999,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
  },
  loadingContainer: {
    backgroundColor: theme.colors.white,
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    maxWidth: 280,
    marginHorizontal: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: theme.typography.semiBold,
  },
  loadingSubtext: {
    fontSize: 14,
    color: theme.colors.textLight,
    textAlign: 'center',
    fontFamily: theme.typography.regular,
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
  },
  errorContent: {
    backgroundColor: theme.colors.white,
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    maxWidth: 280,
    marginHorizontal: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.error,
    marginBottom: 10,
    fontFamily: theme.typography.semiBold,
  },
  errorMessage: {
    fontSize: 14,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: theme.typography.regular,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontWeight: '500',
    fontFamily: theme.typography.medium,
  },
  storeListContainer: {
    position: 'absolute',
    bottom: 150,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 20,
  },
  storeList: {
    gap: 15,
  },
  storeCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 15,
    width: 200,
    ...theme.shadows.small,
  },
  storeCardIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  storeCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 5,
    fontFamily: theme.typography.semiBold,
  },
  storeCardAddress: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginBottom: 8,
    fontFamily: theme.typography.regular,
  },
  storeCardDistance: {
    fontSize: 12,
    color: theme.colors.primary,
    fontFamily: theme.typography.medium,
  },
  filterModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: theme.colors.overlay,
  },
  filterModal: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 20,
    fontFamily: theme.typography.semiBold,
    textAlign: 'center',
  },
  filterOption: {
    marginBottom: 20,
  },
  filterOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 10,
    fontFamily: theme.typography.medium,
  },
  filterOptionValues: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#f0f8ff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#b3d9ff',
  },
  filterChipText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontFamily: theme.typography.medium,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 5,
  },
  filterModalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  filterModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterModalButtonOutline: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: 'transparent',
  },
  filterModalButtonOutlineText: {
    color: theme.colors.primary,
    fontWeight: '500',
    fontFamily: theme.typography.medium,
  },
  filterModalButtonFilled: {
    backgroundColor: theme.colors.primary,
  },
  filterModalButtonFilledText: {
    color: theme.colors.white,
    fontWeight: '500',
    fontFamily: theme.typography.medium,
  },
});