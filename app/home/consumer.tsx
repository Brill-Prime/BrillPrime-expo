import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  Image, 
  Animated, 
  StatusBar, 
  ScrollView, 
  Platform, 
  ActivityIndicator, 
  TextInput, 
  Modal, 
  RefreshControl, 
  Alert 
} from "react-native";
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

// Define missing types
interface Merchant {
  id: string;
  name: string;
  // Add other merchant properties as needed
}

interface Driver {
  id: string;
  name: string;
  // Add other driver properties as needed
}

interface MenuItem {
  id: string;
  name: string;
  // Add other menu item properties as needed
}

interface StoreLocation {
  title: string;
  address: string;
  coords: { lat: number; lng: number };
}

interface ActiveDelivery {
  driverId: string;
  merchantLocation: { latitude: number; longitude: number };
  status: 'picking_up' | 'delivering';
  driverLocation: { latitude: number; longitude: number };
}

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
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
    large: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 10,
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

export default function ConsumerHome() {
  const router = useRouter();
  const { showConfirmDialog, showError, showSuccess, showInfo } = useAlert();
  const [isLocationSet, setIsLocationSet] = useState<boolean | null>(null);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [liveDrivers, setLiveDrivers] = useState<Driver[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [showFilters, setShowFilters] = useState(false); // Initialize as null to indicate loading state
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [userAddress, setUserAddress] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("Consumer");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
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
  const [selectedDistance, setSelectedDistance] = useState<string>('Any');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedRating, setSelectedRating] = useState<number>(0);

  const sidebarWidth = Math.min(300, width * 0.85);
  const slideAnim = useRef(new Animated.Value(sidebarWidth)).current;
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
      // For now, using mock data since backend API doesn't have location-based search yet
      // TODO: Implement backend API endpoint for nearby merchants with lat/lng
      const mockStores: StoreLocation[] = [
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
      ];

      setStoreLocations(mockStores);
    } catch (error) {
      console.error('Error loading nearby merchants:', error);
      // Fallback to loading all merchants
      await loadAllMerchants();
    }
  };

  const loadAllMerchants = async () => {
    try {
      // Load all available merchants regardless of location
      const mockStores: StoreLocation[] = [
        {
          title: "NASCO FOODS",
          address: "Yakubu Gowon Way, Jos",
          coords: { lat: 9.868215, lng: 8.870632 }
        },
        {
          title: "Airforce Masjid",
          address: "Abattoir Rd, Jos",
          coords: { lat: 9.882716, lng: 8.886276 }
        },
        {
          title: "BrillPrime Market",
          address: "Wuse 2, Abuja",
          coords: { lat: 9.0765, lng: 7.3986 }
        },
        {
          title: "Prime Fuel Station",
          address: "Garki, Abuja",
          coords: { lat: 9.0415, lng: 7.4883 }
        }
      ];

      setStoreLocations(mockStores);
    } catch (error) {
      console.error('Error loading all merchants:', error);
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
        // Load merchants near the location
        await loadNearbyMerchants(location.latitude, location.longitude);
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

  const loadUserData = useCallback(async () => {
    try {
      const [email, name] = await Promise.all([
        AsyncStorage.getItem("userEmail"),
        AsyncStorage.getItem("userName")
      ]);

      setUserEmail(email || "consumer@brillprime.com");
      setUserName(name || "Consumer");

      // Load notification count
      await loadNotificationCount();
    } catch (error) {
      console.error("Error loading user data:", error);
      setUserEmail("consumer@brillprime.com");
      setUserName("Consumer");
    }
  }, []);

  const loadNotificationCount = useCallback(async () => {
    try {
      const { notificationService } = await import("../../services/notificationService");
      const response = await notificationService.getUnreadCount();
      if (response.success && response.data) {
        setUnreadNotifications(response.data.count);
      }
    } catch (error) {
      console.error("Error loading notification count:", error);
    }
  }, []);

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
        await loadNearbyMerchants(location.latitude, location.longitude);
      } else {
        // Explicitly set to false if no saved location
        setIsLocationSet(false);
      }
    } catch (error) {
      console.error("Error checking saved location:", error);
      // Ensure we set a definite state even on error
      setIsLocationSet(false);
    }
  };

  const toggleMenu = useCallback(() => {
    const toValue = isMenuOpen ? -sidebarWidth : 0;
    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsMenuOpen(!isMenuOpen);
  }, [isMenuOpen, slideAnim, sidebarWidth]);

  const handleGoBack = () => {
    showConfirmDialog(
      "Go Back",
      "Are you sure you want to go back to dashboard?",
      () => router.push('/dashboard/consumer')
    );
  };

  const handleMenuItemPress = useCallback((item: string) => {
    toggleMenu();
    setTimeout(() => {
      switch (item) {
        case "Dashboard":
          router.push("/dashboard/consumer");
          break;
        case "Profile":
          router.push("/profile");
          break;
        case "Notifications":
          router.push("/notifications");
          break;
        case "Settings":
          router.push("/profile/privacy-settings");
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
    }, 300);
  }, [router, toggleMenu, showInfo]);

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

  const handleSetLocationLater = () => {
    setIsLocationSet(true); // Ensure location is marked as set
    setTimeout(() => {
      router.push("/search"); // Navigate only after state is updated
    }, 100); // Small delay to ensure state update completes
  };

  // Fix Alert to alert
  const handleSetLocationAutomatically = async () => {
    setIsLoadingLocation(true);
    try {
      await fitToUserLocation(); // Simulate location setting
      setIsLocationSet(true); // Ensure location is marked as set
    } catch (error) {
      alert("Error - Failed to set location automatically. Please try again.");
    } finally {
      setIsLoadingLocation(false);
    }
  };
  
  // Add handleMerchantPress function
  const handleMerchantPress = (merchant: Merchant) => {
    router.push(`/merchant/${merchant.id}` as any);
  };

  const handleNavigationGuard = (route: string) => {
    if (!isLocationSet) {
      alert("Please set your location first");
      return;
    }
    router.push(route as any);
  };

  const handleSearchNavigation = () => handleNavigationGuard("/search");

  const handleMerchantPress = useCallback((merchantId: string) => {
    router.push({
      pathname: "/merchant/[id]",
      params: { id: merchantId }
    });
  }, [router]);

  return (
    <View style={styles.container}>
      {/* Fallback UI for loading state */}
      {isLocationSet === null && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}

      {/* Location Setup Modal - Only show if location not set */}
      {isLocationSet === false && (
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
                <Text style={styles.setAutomaticallyButtonText}>Set Automatically</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.setLaterButton}
              onPress={handleSetLocationLater}
              activeOpacity={0.9}
              accessibilityLabel="Set location later"
              accessibilityRole="button"
            >
              <Text style={styles.setLaterButtonText}>Set Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Other components - Only show when location is set */}
      {isLocationSet === true && (
        <>
          {/* Map View */}
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            customMapStyle={blueMapStyle}
            region={region}
            onRegionChangeComplete={handleRegionChange}
          >
            {/* User's current location marker */}
            <Marker
              coordinate={{
                latitude: region.latitude,
                longitude: region.longitude,
              }}
              title="Your Location"
              description={userAddress}
            >
              <View style={styles.userMarker}>
                <View style={styles.userMarkerDot} />
              </View>
            </Marker>

            {/* Merchant markers */}
            {merchants && merchants.map((merchant) => (
              <Marker
                key={merchant.id}
                coordinate={{
                  latitude: merchant.location.latitude,
                  longitude: merchant.location.longitude,
                }}
                title={merchant.name}
                description={merchant.address}
                onPress={() => handleMerchantPress(merchant)}
              >
                <View style={styles.merchantMarker}>
                  <Image
                    source={require('../../assets/images/view_commodities_icon.png')}
                    style={styles.merchantMarkerIcon}
                  />
                </View>
              </Marker>
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
              >
                <View style={styles.driverMarker}>
                  <Image
                    source={require('../../assets/images/order_fuel_icon.png')}
                    style={styles.driverMarkerIcon}
                  />
                </View>
              </Marker>
            ))}
          </MapView>

          {/* Header with back and menu buttons */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleGoBack}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuButton}
              onPress={toggleMenu}
              accessibilityLabel="Open menu"
              accessibilityRole="button"
            >
              <Ionicons name="menu" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={styles.searchContainer}>
            <TouchableOpacity
              style={styles.searchInputContainer}
              onPress={handleSearchNavigation}
              activeOpacity={0.9}
              accessibilityLabel="Search"
              accessibilityRole="search"
            >
              <Ionicons
                name="search"
                size={20}
                color={theme.colors.textLight}
                style={styles.searchIcon}
              />
              <Text style={[styles.searchInput, { color: theme.colors.textLight }]}>
                Search for merchants, products...
              </Text>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setShowFilters(true)}
                accessibilityLabel="Filter"
                accessibilityRole="button"
              >
                <Ionicons name="options" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </TouchableOpacity>
          </View>

          {/* Sidebar Menu */}
          <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
            <View style={styles.sidebarHeader}>
              <Image
                source={require('../../assets/images/account_circle.svg')}
                style={styles.userAvatar}
              />
              <Text style={styles.userName}>{userName || 'User'}</Text>
              <TouchableOpacity
                style={styles.closeMenuButton}
                onPress={toggleMenu}
                accessibilityLabel="Close menu"
                accessibilityRole="button"
              >
                <Ionicons name="close" size={24} color={theme.colors.white} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.menuItems}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={() => handleMenuItemPress(item)}
                  accessibilityLabel={item}
                  accessibilityRole="menuitem"
                >
                  <Text style={styles.menuItemText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
              accessibilityLabel="Sign out"
              accessibilityRole="button"
            >
              <Ionicons name="log-out-outline" size={20} color={theme.colors.white} style={styles.signOutIcon} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}
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
    right: 0,
    width: Math.min(350, width * 0.9),
    height: '100%',
    backgroundColor: theme.colors.primary,
    zIndex: 1000,
    ...theme.shadows.large,
  },
  sidebarHeader: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  userName: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
    fontFamily: theme.typography.semiBold,
  },
  closeMenuButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItems: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuItemText: {
    color: theme.colors.white,
    fontSize: 16,
    fontFamily: theme.typography.medium,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    gap: 10,
  },
  signOutIcon: {
    marginRight: 5,
  },
  signOutText: {
    color: theme.colors.white,
    fontSize: 16,
    fontFamily: theme.typography.medium,
  },
  setAutomaticallyButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: theme.typography.medium,
  },
  setLaterButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
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
  driverMarkerIcon: {
    width: 24,
    height: 24,
  },
  userMarker: {
    width: 40,
    height: 40,
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.small,
  },
  userMarkerDot: {
    width: 20,
    height: 20,
    backgroundColor: theme.colors.white,
    borderRadius: 10,
  },
  merchantMarker: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: 8,
    ...theme.shadows.small,
  },
  merchantMarkerIcon: {
    width: 24,
    height: 24,
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
  activeOrderWidget: {
      backgroundColor: '#e3f2fd',
      borderRadius: 15,
      padding: 15,
      marginBottom: 20,
      borderLeftWidth: 4,
      borderLeftColor: '#4682B4',
    },
    activeOrderHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      gap: 8,
    },
    activeOrderTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#0c1a2a',
    },
    activeOrderStatus: {
      fontSize: 14,
      color: '#555',
      marginBottom: 10,
    },
    trackButton: {
      backgroundColor: '#4682B4',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignSelf: 'flex-start',
    },
    trackButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    quickActions: {
      marginBottom: 20,
    },
});