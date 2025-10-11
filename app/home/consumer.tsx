import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image, Animated, StatusBar, ScrollView, Platform, ActivityIndicator, TextInput, Modal, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MapView, { PROVIDER_GOOGLE, Marker } from '../../components/Map';
const MapViewDirections = Platform.OS === 'web' ? null : require('react-native-maps-directions').default;
import { locationService } from '../../services/locationService';
import { merchantService } from '../../services/merchantService';
import * as Location from 'expo-location';
import { useAlert } from '../../components/AlertProvider';
import { Ionicons } from '@expo/vector-icons';
import { debounce } from 'lodash';

const { width, height } = Dimensions.get('window');

// Blue map style (Bolt-inspired) for Google Maps
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

const theme = {
  colors: {
    primary: '#4682B4',
    primaryDark: '#0B1A51',
    boltBlue: '#006AFF', // Bolt-style blue
    background: '#fff',
    text: '#333',
    textLight: '#666',
    white: '#fff',
    error: '#e74c3c',
    success: '#00C853',
    border: '#f0f0f0',
    overlay: 'rgba(0, 0, 0, 0.5)',
    mapOverlay: 'rgba(0, 106, 255, 0.1)',
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
  status?: 'idle' | 'picking_up' | 'delivering';
  distanceToMerchant?: number;
  distanceToConsumer?: number;
}

interface ActiveDelivery {
  driverId: string;
  merchantLocation: { latitude: number; longitude: number };
  status: 'picking_up' | 'delivering';
  driverLocation: { latitude: number; longitude: number };
}

export default function ConsumerHome() {
  const router = useRouter();
  const { showConfirmDialog, showError, showSuccess, showInfo } = useAlert();
  const [isLocationSet, setIsLocationSet] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [userAddress, setUserAddress] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLiveTrackingEnabled, setIsLiveTrackingEnabled] = useState(false);
  const [nearbyDrivers, setNearbyDrivers] = useState<Driver[]>([]);
  const [activeDelivery, setActiveDelivery] = useState<ActiveDelivery | null>(null);
  const [showDriverCard, setShowDriverCard] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const [storeLocations, setStoreLocations] = useState<StoreLocation[]>([]);
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
  const [refreshing, setRefreshing] = useState(false); // Added for pull-to-refresh

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

  const fetchNearbyMerchants = useCallback(async () => {
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        const response = await merchantService.getNearbyMerchants(
          location.latitude,
          location.longitude,
          5000
        );
        if (response.success && response.data) {
          setStoreLocations(response.data.map(merchant => ({
            title: merchant.name,
            address: merchant.address,
            coords: { lat: merchant.latitude, lng: merchant.longitude }
          })));
          setNearbyDrivers(response.data.map(m => ({
            id: m.id,
            latitude: m.latitude,
            longitude: m.longitude,
            name: m.name,
            eta: calculateETA(location.latitude, location.longitude, m.latitude, m.longitude)
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching nearby merchants:', error);
      showError("Loading Error", "Could not load nearby merchants. Please try again.");
    }
  }, [showError]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNearbyMerchants();
    setRefreshing(false);
  }, [fetchNearbyMerchants]);

  useEffect(() => {
    isMountedRef.current = true;
    setIsMapLoading(false); // Map loads in background
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
      await locationService.startLiveTracking(5000); // Update every 5 seconds
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

  // Real-time driver tracking
  useEffect(() => {
    if (!activeDelivery) return;

    const trackingInterval = setInterval(async () => {
      try {
        // In real app, fetch from backend: const driverData = await orderService.getDriverLocation(activeDelivery.driverId);
        // Simulate driver movement
        const currentDriver = nearbyDrivers.find(d => d.id === activeDelivery.driverId);
        if (!currentDriver) return;

        let newLat = currentDriver.latitude;
        let newLng = currentDriver.longitude;

        if (activeDelivery.status === 'picking_up') {
          // Move towards merchant
          const latDiff = activeDelivery.merchantLocation.latitude - currentDriver.latitude;
          const lngDiff = activeDelivery.merchantLocation.longitude - currentDriver.longitude;
          newLat += latDiff * 0.1;
          newLng += lngDiff * 0.1;

          const distanceToMerchant = locationService.calculateDistance(
            newLat, newLng,
            activeDelivery.merchantLocation.latitude,
            activeDelivery.merchantLocation.longitude
          );

          // Check if driver arrived at merchant
          if (distanceToMerchant < 0.05) {
            setNotificationMessage('🎉 Driver has arrived at the merchant!');
            setTimeout(() => setNotificationMessage(null), 3000);
            setActiveDelivery({ ...activeDelivery, status: 'delivering' });
          }
        } else if (activeDelivery.status === 'delivering') {
          // Move towards consumer
          const latDiff = region.latitude - currentDriver.latitude;
          const lngDiff = region.longitude - currentDriver.longitude;
          newLat += latDiff * 0.1;
          newLng += lngDiff * 0.1;

          const distanceToConsumer = locationService.calculateDistance(
            newLat, newLng,
            region.latitude,
            region.longitude
          );

          // Check if driver arrived at consumer
          if (distanceToConsumer < 0.05) {
            setNotificationMessage('🎊 Driver has arrived at your location!');
            setTimeout(() => {
              setNotificationMessage(null);
              setActiveDelivery(null);
              setShowDriverCard(false);
            }, 3000);
          }
        }

        // Update driver location
        setNearbyDrivers(prev => prev.map(d => 
          d.id === activeDelivery.driverId 
            ? { 
                ...d, 
                latitude: newLat, 
                longitude: newLng,
                distanceToMerchant: activeDelivery.status === 'picking_up' 
                  ? locationService.calculateDistance(newLat, newLng, activeDelivery.merchantLocation.latitude, activeDelivery.merchantLocation.longitude)
                  : 0,
                distanceToConsumer: locationService.calculateDistance(newLat, newLng, region.latitude, region.longitude),
                eta: calculateETA(newLat, newLng, region.latitude, region.longitude),
              }
            : d
        ));

        setActiveDelivery(prev => prev ? { ...prev, driverLocation: { latitude: newLat, longitude: newLng } } : null);

        // Auto-zoom to include all locations
        fitMapToActiveDelivery();
      } catch (error) {
        console.error('Error tracking driver:', error);
      }
    }, 5000);

    return () => clearInterval(trackingInterval);
  }, [activeDelivery, nearbyDrivers, region]);

  const fitMapToActiveDelivery = useCallback(() => {
    if (!mapRef.current || !activeDelivery) return;

    const driver = nearbyDrivers.find(d => d.id === activeDelivery.driverId);
    if (!driver) return;

    const locationsToFit = [
      { latitude: driver.latitude, longitude: driver.longitude },
      { latitude: region.latitude, longitude: region.longitude },
    ];

    if (activeDelivery.status === 'picking_up') {
      locationsToFit.push(activeDelivery.merchantLocation);
    }

    mapRef.current.fitToCoordinates(locationsToFit, {
      edgePadding: { top: 100, right: 50, bottom: showDriverCard ? 250 : 150, left: 50 },
      animated: true
    });
  }, [activeDelivery, nearbyDrivers, region, showDriverCard]);

  // Simulate starting a delivery
  const simulateDelivery = () => {
    if (storeLocations.length === 0) return;
    
    const merchant = storeLocations[0];
    const driver: Driver = {
      id: 'driver-1',
      latitude: merchant.coords.lat - 0.01,
      longitude: merchant.coords.lng - 0.01,
      name: 'John Doe',
      eta: '15 mins',
      status: 'picking_up',
    };

    setNearbyDrivers(prev => [...prev.filter(d => d.id !== driver.id), driver]);
    setActiveDelivery({
      driverId: driver.id,
      merchantLocation: { latitude: merchant.coords.lat, longitude: merchant.coords.lng },
      status: 'picking_up',
      driverLocation: { latitude: driver.latitude, longitude: driver.longitude },
    });
    setShowDriverCard(true);
  };

  const loadUserData = async () => {
    try {
      // Load user data from AsyncStorage (stored by authService)
      const userDataString = await AsyncStorage.getItem('userData');
      
      if (userDataString && isMountedRef.current) {
        const userData = JSON.parse(userDataString);
        setUserEmail(userData.email || '');
        setUserName(userData.name || 'User');
      } else {
        // Fallback to email only
        const email = await AsyncStorage.getItem("userEmail");
        if (email && isMountedRef.current) {
          setUserEmail(email);
          setUserName('User');
        }
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

  const handleSetLocationAutomatically = async () => {
    if (!isMountedRef.current) return;
    setIsLoadingLocation(true);

    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsLoadingLocation(false);
        showError("Permission Denied", "Location permission is required to find nearby merchants. You can set it manually later.");
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
      showSuccess("Location Set!", `Your location has been set to ${addressInfo}.`);
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

  const memoizedStoreLocations = useMemo(() => {
    return storeLocations;
  }, [storeLocations]);

  // Mock cart item count for badge display
  const cartItemCount = 3;

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
          fitToUserLocation();
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
        customMapStyle={Platform.OS !== 'web' ? blueMapStyle : undefined}
      >
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
          >
            <View style={styles.driverMarker}>
              <Ionicons name="car" size={24} color={activeDelivery?.driverId === driver.id ? theme.colors.boltBlue : theme.colors.success} />
            </View>
          </MemoizedMarker>
        ))}

        {memoizedStoreLocations.map((store) => (
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
            apikey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY"}
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
      </MapView>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={theme.colors.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Where do you want to shop?"
            placeholderTextColor={theme.colors.textLight}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          <TouchableOpacity style={styles.filterButton} onPress={() => setIsFilterModalOpen(true)}
            accessibilityLabel="Open filter options"
            accessibilityRole="button"
          >
            <Ionicons name="options" size={22} color={theme.colors.boltBlue} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Notification */}
      {notificationMessage && (
        <Animated.View style={styles.notification}>
          <Text style={styles.notificationText}>{notificationMessage}</Text>
        </Animated.View>
      )}

      {/* Header with Back Button and Menu */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={styles.backButton}
          accessibilityLabel="Go back to dashboard"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={toggleMenu}
          style={styles.menuButton}
          accessibilityLabel={isMenuOpen ? "Close menu" : "Open menu"}
          accessibilityRole="button"
        >
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
              accessibilityLabel="Set location automatically"
              accessibilityRole="button"
            >
              {isLoadingLocation ? (
                <ActivityIndicator size="small" color={theme.colors.white} />
              ) : (
                <Text style={styles.setAutomaticallyText}>Set automatically</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.setLaterButton}
              onPress={handleSetLocationLater}
              activeOpacity={0.9}
              disabled={isLoadingLocation}
              accessibilityLabel="Set location later"
              accessibilityRole="button"
            >
              <Text style={styles.setLaterText}>Set later</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Floating Driver Card */}
      {showDriverCard && activeDelivery && (
        <View style={styles.floatingCard}>
          {(() => {
            const driver = nearbyDrivers.find(d => d.id === activeDelivery.driverId);
            if (!driver) return null;

            return (
              <>
                <View style={styles.driverCardHeader}>
                  <View style={styles.driverAvatar}>
                    <Ionicons name="person" size={24} color={theme.colors.white} />
                  </View>
                  <View style={styles.driverInfo}>
                    <Text style={styles.driverName}>{driver.name}</Text>
                    <Text style={styles.driverStatus}>
                      {activeDelivery.status === 'picking_up' ? '📦 Picking up order' : '🚗 On the way'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowDriverCard(false)}>
                    <Ionicons name="close" size={24} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>

                <View style={styles.driverCardBody}>
                  {activeDelivery.status === 'picking_up' && driver.distanceToMerchant !== undefined && (
                    <View style={styles.distanceRow}>
                      <Ionicons name="storefront" size={16} color={theme.colors.boltBlue} />
                      <Text style={styles.distanceText}>
                        {driver.distanceToMerchant.toFixed(1)} km to merchant
                      </Text>
                    </View>
                  )}
                  <View style={styles.distanceRow}>
                    <Ionicons name="location" size={16} color={theme.colors.boltBlue} />
                    <Text style={styles.distanceText}>
                      {driver.distanceToConsumer?.toFixed(1) || '0'} km to you • ETA: {driver.eta}
                    </Text>
                  </View>
                </View>
              </>
            );
          })()}
        </View>
      )}

      {/* Test Delivery Button (for demo) */}
      {isLocationSet && !activeDelivery && storeLocations.length > 0 && (
        <TouchableOpacity 
          style={styles.testDeliveryButton}
          onPress={simulateDelivery}
        >
          <Ionicons name="play" size={20} color={theme.colors.white} />
          <Text style={styles.testDeliveryText}>Test Delivery</Text>
        </TouchableOpacity>
      )}

      {/* Store List (when location is set) */}
      {isLocationSet && storeLocations.length > 0 && (
        <View style={styles.storeListContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storeList}
          >
            {memoizedStoreLocations.map((store) => (
              <TouchableOpacity
                key={store.title}
                style={styles.storeCard}
                onPress={() => handleStoreSelect(store)}
                accessibilityLabel={`View details for ${store.title}`}
                accessibilityRole="button"
              >
                <View style={styles.storeCardIcon}>
                  <Ionicons name="business" size={24} color={theme.colors.primary} />
                </View>
                <Text style={styles.storeCardTitle}>{store.title}</Text>
                <Text style={styles.storeCardAddress}>{store.address}</Text>
                <Text style={styles.storeCardDistance}>
                  {(() => {
                    const dist = locationService.calculateDistance(
                      region.latitude,
                      region.longitude,
                      store.coords.lat,
                      store.coords.lng
                    ).toFixed(1);
                    return `${dist} km away`;
                  })()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Navigation Sidebar - Only visible when menu is open */}
      {isMenuOpen && (
        <Animated.View style={[styles.sidebar, { right: slideAnim }]}>
          <View style={styles.sidebarContent}>
          <View style={styles.sidebarProfile}>
            <View style={styles.sidebarProfileImage}>
              <Ionicons name="person" size={30} color={theme.colors.primary} />
            </View>
            <Text style={styles.sidebarProfileName}>{userName}</Text>
            <Text style={styles.sidebarProfileEmail}>{userEmail}</Text>
          </View>

          <View style={styles.menuList}>
            {['Profile', 'Orders', 'Cart', 'Favorites', 'Settings', 'Support'].map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.menuItem}
                onPress={() => handleMenuItemPress(item)}
                accessibilityLabel={`Navigate to ${item}`}
                accessibilityRole="button"
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
              accessibilityLabel="Switch to Merchant view"
              accessibilityRole="button"
            >
              <Text style={styles.switchButtonText}>Switch to Merchant</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => handleMenuItemPress("Switch to Driver")}
              accessibilityLabel="Switch to Driver view"
              accessibilityRole="button"
            >
              <Text style={styles.switchButtonText}>Switch to Driver</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
              accessibilityLabel="Sign out from the application"
              accessibilityRole="button"
            >
              <Text style={styles.signOutButtonText}>Sign out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
      )}

      {/* Menu Overlay */}
      {isMenuOpen && (
        <TouchableOpacity
          style={styles.menuOverlay}
          onPress={toggleMenu}
          activeOpacity={1}
          accessibilityLabel="Close menu overlay"
        />
      )}

      {/* Loading Indicator for Location Only */}
      {isLoadingLocation && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Getting your location...</Text>
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
                  <TouchableOpacity key={option} style={styles.filterChip}
                    accessibilityLabel={`Filter by ${option} distance`}
                    accessibilityRole="button"
                  >
                    <Text style={styles.filterChipText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterOption}>
              <Text style={styles.filterOptionText}>Category</Text>
              <View style={styles.filterOptionValues}>
                {['Food', 'Gas', 'Retail', 'All'].map((option) => (
                  <TouchableOpacity key={option} style={styles.filterChip}
                    accessibilityLabel={`Filter by ${option} category`}
                    accessibilityRole="button"
                  >
                    <Text style={styles.filterChipText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterOption}>
              <Text style={styles.filterOptionText}>Rating</Text>
              <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star}
                    accessibilityLabel={`Filter by ${star} star rating`}
                    accessibilityRole="button"
                  >
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
                accessibilityLabel="Reset filters"
                accessibilityRole="button"
              >
                <Text style={styles.filterModalButtonOutlineText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterModalButton, styles.filterModalButtonFilled]}
                onPress={() => setIsFilterModalOpen(false)}
                accessibilityLabel="Apply filters"
                accessibilityRole="button"
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
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 12,
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
  notification: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 12,
    padding: 16,
    zIndex: 15,
    ...theme.shadows.medium,
  },
  notificationText: {
    color: theme.colors.white,
    fontSize: 14,
    fontFamily: theme.typography.medium,
    textAlign: 'center',
  },
  floatingCard: {
    position: 'absolute',
    bottom: 180,
    left: 20,
    right: 20,
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    zIndex: 20,
    ...theme.shadows.medium,
  },
  driverCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.boltBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: theme.typography.semiBold,
    marginBottom: 2,
  },
  driverStatus: {
    fontSize: 14,
    color: theme.colors.textLight,
    fontFamily: theme.typography.regular,
  },
  driverCardBody: {
    gap: 8,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distanceText: {
    fontSize: 14,
    color: theme.colors.text,
    fontFamily: theme.typography.medium,
  },
  driverMarker: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: 8,
    ...theme.shadows.small,
  },
  testDeliveryButton: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    backgroundColor: theme.colors.boltBlue,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    zIndex: 20,
    ...theme.shadows.medium,
  },
  testDeliveryText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: theme.typography.semiBold,
  },
});