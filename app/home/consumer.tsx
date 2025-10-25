import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, ActivityIndicator, RefreshControl, TextInput } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from 'expo-location';
import { debounce } from 'lodash';
import { Ionicons } from '@expo/vector-icons';

import { useAlert } from '../../components/AlertProvider';
import ErrorBoundary from '../../components/ErrorBoundary';
import MapContainer, { Marker } from '../../components/Map';
import MerchantDetailsModal from '../components/MerchantDetailsModal';
import { locationService } from '../../services/locationService';

// Define missing types
interface Merchant {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  address: string;
  // Add other merchant properties as needed
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
  // Add other driver properties as needed
}

interface MenuItem {
  id: string;
  name: string;
  // Add other menu item properties as needed
}

// Define menu items as strings for navigation
type MenuItemString = string;

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

interface ActiveDelivery {
  driverId: string;
  merchantLocation: { latitude: number; longitude: number };
  status: 'picking_up' | 'delivering';
  driverLocation: { latitude: number; longitude: number };
}

import { Dimensions } from 'react-native';

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

function ConsumerHomeContent() {
  const router = useRouter();
  const { showConfirmDialog, showError, showSuccess, showInfo } = useAlert();
  const [isLocationSet, setIsLocationSet] = useState<boolean | null>(null);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [liveDrivers, setLiveDrivers] = useState<Driver[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemString[]>([
    "Dashboard",
    "Profile",
    "Notifications",
    "Settings",
    "Support",
    "Switch to Merchant",
    "Switch to Driver"
  ]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [userAddress, setUserAddress] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("Consumer");
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isLiveTrackingEnabled, setIsLiveTrackingEnabled] = useState(false);
  const [nearbyDrivers, setNearbyDrivers] = useState<Driver[]>([]);
  const [activeDelivery, setActiveDelivery] = useState<ActiveDelivery | null>(null);
  const [showDriverCard, setShowDriverCard] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const [storeLocations, setStoreLocations] = useState<StoreLocation[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<StoreLocation | null>(null);
  const [showMerchantDetails, setShowMerchantDetails] = useState(false);
  const [region, setRegion] = useState({
    latitude: 9.0765,
    longitude: 7.3986,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filteredMerchants, setFilteredMerchants] = useState<Merchant[]>([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<StoreLocation | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDistance, setSelectedDistance] = useState<string>('Any');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [retryCount, setRetryCount] = useState<{ [key: string]: number }>({});

  const sidebarWidth = Math.min(300, width * 0.85);
  const slideAnim = useRef(new Animated.Value(-sidebarWidth)).current;
  const mapRef = useRef<any>(null);
  const isMountedRef = useRef(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Error handling utilities
  const checkNetworkConnectivity = async (): Promise<boolean> => {
    try {
      // Simple network check - in a real app, you'd use expo-network or similar
      return true; // Assume network is available for now
    } catch (error) {
      console.error('Network check failed:', error);
      return false;
    }
  };

  const handleRetryWithBackoff = async (operation: () => Promise<void>, operationKey: string, maxRetries: number = 3) => {
    const currentRetry = retryCount[operationKey] || 0;
    if (currentRetry >= maxRetries) {
      showError("Operation Failed", `Failed to complete operation after ${maxRetries} attempts. Please try again later.`);
      return;
    }

    try {
      await operation();
      // Reset retry count on success
      setRetryCount(prev => ({ ...prev, [operationKey]: 0 }));
    } catch (error) {
      console.error(`Operation ${operationKey} failed (attempt ${currentRetry + 1}):`, error);
      setRetryCount(prev => ({ ...prev, [operationKey]: currentRetry + 1 }));

      // Exponential backoff: wait 1s, 2s, 4s...
      const delay = Math.pow(2, currentRetry) * 1000;
      setTimeout(() => {
        handleRetryWithBackoff(operation, operationKey, maxRetries);
      }, delay);
    }
  };

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
      const isConnected = await checkNetworkConnectivity();
      if (!isConnected) {
        showError("Network Error", "No internet connection. Please check your network and try again.");
        await loadAllMerchants(); // Fallback to cached/all merchants
        return;
      }

      // Make API call to get nearby merchants
      const response = await fetch(`https://api.brillprime.com/api/merchants/nearby?lat=${latitude}&lng=${longitude}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add auth headers if needed
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        // Transform API response to StoreLocation format with enhanced data
        const stores: StoreLocation[] = data.data.map((merchant: any) => {
          const distance = locationService.calculateDistance(
            latitude, longitude,
            merchant.latitude || merchant.coords?.lat,
            merchant.longitude || merchant.coords?.lng
          );

          return {
            id: merchant.id,
            title: merchant.name || merchant.title,
            address: merchant.address,
            coords: {
              lat: merchant.latitude || merchant.coords?.lat,
              lng: merchant.longitude || merchant.coords?.lng
            },
            distance: distance,
            rating: merchant.rating || 0,
            isOpen: merchant.isOpen !== undefined ? merchant.isOpen : true,
            category: merchant.category || 'General',
            phone: merchant.phone,
            description: merchant.description
          };
        });

        // Sort by distance (closest first)
        stores.sort((a, b) => (a.distance || 0) - (b.distance || 0));

        setStoreLocations(stores);
      } else {
        throw new Error(data.message || 'Failed to load merchants');
      }
    } catch (error) {
      console.error('Error loading nearby merchants:', error);

      // Check error type and handle appropriately
      if (error instanceof TypeError && error.message.includes('fetch')) {
        showError("Network Error", "Unable to connect to servers. Please check your internet connection.");
      } else if (error instanceof Error && error.message.includes('API Error')) {
        showError("Server Error", "Unable to load nearby merchants. Using cached data.");
      } else {
        showError("Loading Error", "Failed to load nearby merchants. Using cached data.");
      }

      // Fallback to loading all merchants
      await loadAllMerchants();
    }
  };

  const loadAllMerchants = async () => {
    try {
      const isConnected = await checkNetworkConnectivity();
      if (!isConnected) {
        showError("Network Error", "No internet connection. Using cached merchant data.");
        // Could load from local cache here
        return;
      }

      // Make API call to get all merchants
      const response = await fetch('https://api.brillprime.com/api/merchants', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add auth headers if needed
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        // Transform API response to StoreLocation format with enhanced data
        const stores: StoreLocation[] = data.data.map((merchant: any) => {
          // Calculate distance from current user location if available
          let distance: number | undefined;
          if (isLocationSet && region) {
            distance = locationService.calculateDistance(
              region.latitude, region.longitude,
              merchant.latitude || merchant.coords?.lat,
              merchant.longitude || merchant.coords?.lng
            );
          }

          return {
            id: merchant.id,
            title: merchant.name || merchant.title,
            address: merchant.address,
            coords: {
              lat: merchant.latitude || merchant.coords?.lat,
              lng: merchant.longitude || merchant.coords?.lng
            },
            distance: distance,
            rating: merchant.rating || 0,
            isOpen: merchant.isOpen !== undefined ? merchant.isOpen : true,
            category: merchant.category || 'General',
            phone: merchant.phone,
            description: merchant.description
          };
        });

        // Sort by distance if available (closest first)
        if (isLocationSet) {
          stores.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        }

        setStoreLocations(stores);
      } else {
        throw new Error(data.message || 'Failed to load merchants');
      }
    } catch (error) {
      console.error('Error loading all merchants:', error);

      // Fallback to cached/default data with enhanced fields
      const fallbackStores: StoreLocation[] = [
        {
          id: '1',
          title: "NASCO FOODS",
          address: "Yakubu Gowon Way, Jos",
          coords: { lat: 9.868215, lng: 8.870632 },
          distance: isLocationSet ? locationService.calculateDistance(region.latitude, region.longitude, 9.868215, 8.870632) : undefined,
          rating: 4.2,
          isOpen: true,
          category: 'Supermarket',
          phone: '+234 803 123 4567',
          description: 'Your one-stop shop for groceries and household items'
        },
        {
          id: '2',
          title: "Airforce Masjid",
          address: "Abattoir Rd, Jos",
          coords: { lat: 9.882716, lng: 8.886276 },
          distance: isLocationSet ? locationService.calculateDistance(region.latitude, region.longitude, 9.882716, 8.886276) : undefined,
          rating: 4.8,
          isOpen: true,
          category: 'Religious',
          phone: '+234 803 987 6543',
          description: 'Community mosque serving the local area'
        },
        {
          id: '3',
          title: "BrillPrime Market",
          address: "Wuse 2, Abuja",
          coords: { lat: 9.0765, lng: 7.3986 },
          distance: isLocationSet ? locationService.calculateDistance(region.latitude, region.longitude, 9.0765, 7.3986) : undefined,
          rating: 4.5,
          isOpen: false,
          category: 'Market',
          phone: '+234 803 555 1234',
          description: 'Fresh produce and local goods marketplace'
        },
        {
          id: '4',
          title: "Prime Fuel Station",
          address: "Garki, Abuja",
          coords: { lat: 9.0415, lng: 7.4883 },
          distance: isLocationSet ? locationService.calculateDistance(region.latitude, region.longitude, 9.0415, 7.4883) : undefined,
          rating: 3.9,
          isOpen: true,
          category: 'Fuel Station',
          phone: '+234 803 777 8888',
          description: 'Quality fuel and automotive services'
        }
      ];

      // Sort fallback data by distance if location is set
      if (isLocationSet) {
        fallbackStores.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }

      setStoreLocations(fallbackStores);

      if (error instanceof TypeError && error.message.includes('fetch')) {
        showError("Network Error", "Unable to connect to servers. Using cached data.");
      } else {
        showError("Loading Error", "Failed to load merchants. Using cached data.");
      }
    }
  };

  const calculateETA = (lat1: number, lon1: number, lat2: number, lon2: number): string => {
    const distance = locationService.calculateDistance(lat1, lon1, lat2, lon2);
    const avgSpeed = 30; // km/h average speed in urban areas
    const timeInMinutes = Math.round((distance / avgSpeed) * 60);
    return `${timeInMinutes} mins`;
  };
  


  const fetchNearbyMerchants = useCallback(async () => {
    const operationKey = 'fetchNearbyMerchants';
    const operation = async () => {
      const isConnected = await checkNetworkConnectivity();
      if (!isConnected) {
        throw new Error('Network unavailable');
      }

      const location = await locationService.getCurrentLocation();
      if (!location) {
        throw new Error('Unable to get current location');
      }

      // Load merchants near the location
      await loadNearbyMerchants(location.latitude, location.longitude);
    };

    await handleRetryWithBackoff(operation, operationKey);
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
      location: {
        latitude: merchant.coords.lat - 0.01,
        longitude: merchant.coords.lng - 0.01,
      },
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
    const toValue = isSidebarOpen ? -sidebarWidth : 0;
    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setIsSidebarOpen(!isSidebarOpen);
  }, [isSidebarOpen, slideAnim, sidebarWidth]);
  
  // Close sidebar when clicking outside
  const closeSidebar = useCallback(() => {
    if (isSidebarOpen) {
      Animated.timing(slideAnim, {
        toValue: -sidebarWidth,
        duration: 300,
        useNativeDriver: true,
      }).start();
      setIsSidebarOpen(false);
    }
  }, [isSidebarOpen, slideAnim, sidebarWidth]);

  const handleGoBack = () => {
    showConfirmDialog(
      "Go Back",
      "Are you sure you want to go back to dashboard?",
      () => router.push('/dashboard/consumer')
    );
  };

  const handleMenuItemPress = useCallback((item: MenuItemString) => {
    toggleMenu();
    setTimeout(async () => {
      try {
        if (!isLocationSet && item !== "Dashboard") {
          showError("Location Required", "Please set your location first to access this feature.");
          return;
        }

        // Validate route before navigation
        const validRoutes = [
          "/dashboard/consumer",
          "/profile",
          "/notifications",
          "/profile/privacy-settings",
          "/support",
          "/home/merchant",
          "/home/driver"
        ];

        let targetRoute = "";
        switch (item) {
          case "Dashboard":
            targetRoute = "/dashboard/consumer";
            break;
          case "Profile":
            targetRoute = "/profile";
            break;
          case "Notifications":
            targetRoute = "/notifications";
            break;
          case "Settings":
            targetRoute = "/profile/privacy-settings";
            break;
          case "Support":
            targetRoute = "/support";
            break;
          case "Switch to Merchant":
            targetRoute = "/home/merchant";
            break;
          case "Switch to Driver":
            targetRoute = "/home/driver";
            break;
          default:
            showInfo("Navigation", `Navigating to ${item}`);
            return;
        }

        if (targetRoute && validRoutes.includes(targetRoute)) {
          await router.push(targetRoute as any);
        } else {
          throw new Error(`Invalid route: ${targetRoute}`);
        }
      } catch (error) {
        console.error(`Navigation error to ${item}:`, error);

        if (error instanceof Error) {
          if (error.message.includes('Invalid route')) {
            showError("Navigation Error", "Invalid navigation destination.");
          } else {
            showError("Navigation Error", `Could not navigate to ${item}. Please try again.`);
          }
        } else {
          showError("Navigation Error", "An unexpected error occurred during navigation.");
        }
      }
    }, 300);
  }, [router, toggleMenu, showInfo, isLocationSet, showError]);

  const handleSignOut = async () => {
    showConfirmDialog(
      "Sign Out",
      "Are you sure you want to sign out?",
      async () => {
        try {
          // Clear all user data
          const keysToRemove = ["userToken", "userEmail", "userRole", "userName", "userLocation", "userAddress"];
          await AsyncStorage.multiRemove(keysToRemove);

          // Stop any ongoing location tracking
          if (locationService) {
            locationService.stopLiveTracking();
          }

          // Navigate to login screen
          await router.replace("/");
        } catch (error) {
          console.error("Error signing out:", error);

          if (error instanceof Error) {
            if (error.message.includes('AsyncStorage')) {
              showError("Sign Out Error", "Failed to clear user data. Please restart the app.");
            } else {
              showError("Sign Out Failed", "Unable to sign out completely. Please restart the app.");
            }
          } else {
            showError("Sign Out Failed", "An unexpected error occurred during sign out.");
          }
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

  // Request and set user's current location
  const handleSetLocationAutomatically = async () => {
    setIsLoadingLocation(true);
    const operationKey = 'setLocationAutomatically';

    const operation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          throw new Error('Location permission denied');
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!location || !location.coords) {
          throw new Error('Unable to get location coordinates');
        }

        const { latitude, longitude } = location.coords;
        const deltas = calculateDelta(latitude);

        // Update region with current location
        const newRegion = {
          latitude,
          longitude,
          ...deltas
        };

        setRegion(newRegion);

        // Try to get address with retry logic
        try {
          const addressResponse = await Location.reverseGeocodeAsync({
            latitude,
            longitude
          });

          if (addressResponse && addressResponse.length > 0) {
            const address = addressResponse[0];
            const addressText = [
              address.name,
              address.street,
              address.city,
              address.region,
              address.country
            ].filter(Boolean).join(', ');

            setUserAddress(addressText);
            await AsyncStorage.setItem("userAddress", addressText);
          }
        } catch (addressError) {
          console.error("Error getting address:", addressError);
          setUserAddress("Your Location");
          // Don't throw here - address is optional
        }

        // Save location to AsyncStorage
        await AsyncStorage.setItem("userLocation", JSON.stringify({
          latitude,
          longitude
        }));

        // Load nearby merchants
        await loadNearbyMerchants(latitude, longitude);

        // Animate map to new location
        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 1000);
        }

        setIsLocationSet(true);
      } catch (locationError) {
        console.error("Error setting location automatically:", locationError);

        if (locationError instanceof Error) {
          if (locationError.message.includes('permission')) {
            showError("Permission Denied", "Location permission is required. Please enable location services in your device settings.");
          } else if (locationError.message.includes('timeout')) {
            showError("Location Timeout", "Unable to get your location. Please check your GPS and try again.");
          } else {
            showError("Location Error", "Failed to get your location. Please try again or set location manually.");
          }
        } else {
          showError("Location Error", "An unexpected error occurred while getting your location.");
        }

        throw locationError; // Re-throw to trigger retry
      }
    };

    try {
      await handleRetryWithBackoff(operation, operationKey, 2); // Max 2 retries for location
    } finally {
      setIsLoadingLocation(false);
    }
  };
  
  const handleNavigationGuard = (route: string) => {
    if (!isLocationSet) {
      alert("Please set your location first");
      return;
    }
    router.push(route as any);
  };

  const handleSearchNavigation = () => {
    try {
      if (isLocationSet) {
        router.push("/search");
      } else {
        showError("No Location Set", "Please set your location first to find nearby merchants.");
      }
    } catch (error) {
      console.error("Navigation error:", error);
      showError("Navigation Error", "Could not navigate to search. Please try again.");
    }
  };

  const handleMerchantPress = useCallback((merchant: StoreLocation) => {
    setSelectedMerchant(merchant);
    setShowMerchantDetails(true);
  }, []);

  const handleMerchantDetailsClose = useCallback(() => {
    setShowMerchantDetails(false);
    setSelectedMerchant(null);
  }, []);

  const handleOrderNow = useCallback(() => {
    if (selectedMerchant?.id) {
      router.push({
        pathname: "/merchant/[id]",
        params: { id: selectedMerchant.id }
      });
    }
    handleMerchantDetailsClose();
  }, [selectedMerchant, router]);

  const handleGetDirections = useCallback(() => {
    if (selectedMerchant) {
      const { lat, lng } = selectedMerchant.coords;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      // In a real app, you'd use Linking.openURL(url) for native apps
      console.log('Open directions:', url);
      showInfo("Directions", "Opening Google Maps for directions");
    }
    handleMerchantDetailsClose();
  }, [selectedMerchant]);

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        {/* Map Container */}
        <MapContainer
          ref={mapRef}
          style={styles.map}
          region={region}
          onRegionChange={handleRegionChange}
          customMapStyle={blueMapStyle}
          showsUserLocation={isLiveTrackingEnabled}
          showsMyLocationButton={false}
          zoomEnabled={true}
          scrollEnabled={true}
          rotateEnabled={false}
          pitchEnabled={false}
        >
          {/* Merchant Markers */}
          {storeLocations.map((merchant) => (
            <Marker
              key={merchant.id}
              coordinate={merchant.coords}
              onPress={() => handleMerchantPress(merchant)}
            >
              <View style={styles.merchantMarker}>
                <View style={styles.merchantMarkerIcon}>
                  <Ionicons name="storefront" size={20} color={theme.colors.white} />
                </View>
              </View>
            </Marker>
          ))}

          {/* Driver Markers */}
          {nearbyDrivers.map((driver) => (
            <Marker
              key={driver.id}
              coordinate={{ latitude: driver.latitude, longitude: driver.longitude }}
            >
              <View style={styles.driverMarker}>
                <View style={styles.driverMarkerIcon}>
                  <Ionicons name="car" size={18} color={theme.colors.white} />
                </View>
                <View style={[styles.statusIndicator, { backgroundColor: driver.status === 'available' ? theme.colors.success : theme.colors.error }]} />
              </View>
            </Marker>
          ))}

          {/* User Location Marker */}
          {isLocationSet && (
            <Marker coordinate={region}>
              <View style={styles.userMarker}>
                <View style={styles.userMarkerDot} />
              </View>
            </Marker>
          )}
        </MapContainer>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
            <Ionicons name="menu" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Search Container */}
        {isLocationSet && (
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color={theme.colors.textLight} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for merchants..."
                placeholderTextColor={theme.colors.textLight}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={handleSearchNavigation}
              />
              <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(true)}>
                <Ionicons name="options" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Location Setup Card */}
        {isLocationSet === false && (
          <View style={styles.bottomCard}>
            <View style={styles.locationIconContainer}>
              <View style={styles.locationIconInner}>
                <Ionicons name="location" size={40} color={theme.colors.primary} />
              </View>
            </View>
            <Text style={styles.whereAreYouText}>Where are you?</Text>
            <Text style={styles.descriptionText}>
              We need your location to show nearby merchants and provide accurate delivery services.
            </Text>
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.setAutomaticallyButton}
                onPress={handleSetLocationAutomatically}
                disabled={isLoadingLocation}
              >
                {isLoadingLocation ? (
                  <ActivityIndicator color={theme.colors.white} />
                ) : (
                  <Text style={styles.setAutomaticallyText}>Set Location Automatically</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.setLaterButton} onPress={handleSetLocationLater}>
                <Text style={styles.setLaterText}>Set Later</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Active Delivery Card */}
        {activeDelivery && showDriverCard && (
          <View style={styles.floatingCard}>
            <View style={styles.driverCardHeader}>
              <View style={styles.driverAvatar}>
                {/* Add driver avatar */}
              </View>
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>
                  {nearbyDrivers.find(d => d.id === activeDelivery.driverId)?.name || 'Driver'}
                </Text>
                <Text style={styles.driverStatus}>
                  {activeDelivery.status === 'picking_up' ? 'Picking up your order' : 'Delivering to you'}
                </Text>
              </View>
            </View>
            <View style={styles.driverCardBody}>
              <View style={styles.distanceRow}>
                <Text style={styles.distanceText}>
                  {activeDelivery.status === 'picking_up'
                    ? `Distance to merchant: ${nearbyDrivers.find(d => d.id === activeDelivery.driverId)?.distanceToMerchant?.toFixed(1)} km`
                    : `Distance to you: ${nearbyDrivers.find(d => d.id === activeDelivery.driverId)?.distanceToConsumer?.toFixed(1)} km`
                  }
                </Text>
              </View>
              <View style={styles.distanceRow}>
                <Text style={styles.distanceText}>
                  ETA: {nearbyDrivers.find(d => d.id === activeDelivery.driverId)?.eta || 'Calculating...'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Test Delivery Button */}
        {isLocationSet && storeLocations.length > 0 && (
          <TouchableOpacity style={styles.testDeliveryButton} onPress={simulateDelivery}>
            <Text style={styles.testDeliveryText}>Test Delivery</Text>
          </TouchableOpacity>
        )}

        {/* Notification */}
        {notificationMessage && (
          <View style={styles.notification}>
            <Text style={styles.notificationText}>{notificationMessage}</Text>
          </View>
        )}

        {/* Sidebar */}
        {isSidebarOpen && (
          <>
            <TouchableOpacity style={styles.backdrop} onPress={closeSidebar} />
            <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
              <View style={styles.sidebarHeader}>
                <View style={styles.userAvatar}>
                  <Ionicons name="person" size={40} color={theme.colors.primary} />
                </View>
                <Text style={styles.userName}>{userName}</Text>
                <TouchableOpacity style={styles.closeMenuButton} onPress={closeSidebar}>
                  <Ionicons name="close" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
              <View style={styles.menuItems}>
                {menuItems.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.menuItem}
                    onPress={() => handleMenuItemPress(item)}
                  >
                    <Text style={styles.menuItemText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </Animated.View>
          </>
        )}

        {/* Loading Overlay */}
        {isMapLoading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Loading Map</Text>
              <Text style={styles.loadingSubtext}>Please wait while we load your location</Text>
            </View>
          </View>
        )}

        {/* Error Overlay */}
        {mapError && (
          <View style={styles.errorContainer}>
            <View style={styles.errorContent}>
              <Text style={styles.errorTitle}>Map Error</Text>
              <Text style={styles.errorMessage}>
                Unable to load the map. Please check your internet connection and try again.
              </Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => setMapError(false)}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Merchant Details Modal */}
        {showMerchantDetails && selectedMerchant && (
          <MerchantDetailsModal
            visible={showMerchantDetails}
            merchant={selectedMerchant}
            onClose={handleMerchantDetailsClose}
            onOrderNow={handleOrderNow}
            onGetDirections={handleGetDirections}
          />
        )}
      </View>
    </ErrorBoundary>
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
    bottom: 100,
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
    backgroundColor: theme.colors.white,
    zIndex: 1000,
    ...theme.shadows.large,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  sidebarHeader: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(70, 130, 180, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    color: theme.colors.text,
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
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
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
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  menuItemText: {
    color: theme.colors.text,
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
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    gap: 10,
  },
  signOutIcon: {
    marginRight: 5,
  },
  signOutText: {
    color: theme.colors.error,
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
    alignItems: 'center',
    justifyContent: 'center',
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
  statusIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: theme.colors.overlay,
  },
  merchantDetailsModal: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
    ...theme.shadows.large,
  },
  merchantDetailsHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  merchantDetailsTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  merchantDetailsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
    fontFamily: theme.typography.semiBold,
  },
  closeButton: {
    padding: 4,
  },
  merchantDetailsMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: theme.typography.medium,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
    fontFamily: theme.typography.medium,
  },
  merchantDetailsContent: {
    flex: 1,
    padding: 20,
  },
  merchantDetailsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: theme.typography.semiBold,
  },
  merchantAddress: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
    fontFamily: theme.typography.regular,
  },
  merchantDistance: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginTop: 4,
    fontFamily: theme.typography.regular,
  },
  merchantCategory: {
    fontSize: 14,
    color: theme.colors.text,
    fontFamily: theme.typography.regular,
  },
  merchantPhone: {
    fontSize: 14,
    color: theme.colors.primary,
    fontFamily: theme.typography.regular,
  },
  merchantDescription: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
    fontFamily: theme.typography.regular,
  },
  merchantDetailsActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  merchantActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  directionsButton: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  directionsButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: theme.typography.medium,
  },
  orderButton: {
    backgroundColor: theme.colors.primary,
  },
  orderButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: theme.typography.medium,
  },
});
export default ConsumerHomeContent;
