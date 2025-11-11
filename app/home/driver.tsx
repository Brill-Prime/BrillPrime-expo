import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  ActivityIndicator,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAlert } from "../../components/AlertProvider";
import { useAuth } from "../../hooks/useAuth";
import { PerformanceOptimizer } from "../../utils/performance";
import { locationService } from "../../services/locationService";
import Map, { Marker, PROVIDER_GOOGLE } from "../../components/Map";

// Real-time Map component
const RealTimeMapComponent = React.memo(({
  region,
  currentLocation,
  mapRef
}: {
  region: any;
  currentLocation: any;
  mapRef: any;
}) => {
  const [mapError, setMapError] = useState(false);

  if (mapError) {
    return (
      <View style={styles.mapPlaceholder}>
        <Ionicons name="map-outline" size={40} color="#4682B4" />
        <Text style={styles.mapPlaceholderText}>Map Unavailable</Text>
        <Text style={[styles.mapPlaceholderText, { fontSize: 12, marginTop: 8 }]}>
          Enable location services to view map
        </Text>
      </View>
    );
  }

  return (
    <Map
      ref={mapRef}
      style={styles.map}
      provider={PROVIDER_GOOGLE}
      region={region}
      showsUserLocation={true}
      showsMyLocationButton={false}
      showsCompass={true}
      rotateEnabled={true}
      pitchEnabled={true}
      mapType="standard"
      onError={() => setMapError(true)}
    >
      {currentLocation && (
        <Marker
          coordinate={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          }}
          title="Your Location"
          description="Current driver position"
        >
          <View style={styles.driverLocationMarker}>
            <Ionicons name="car-sport" size={24} color="#4682B4" />
          </View>
        </Marker>
      )}
    </Map>
  );
});

const { width, height } = Dimensions.get("window");

// Responsive sizing utilities
const getResponsiveSize = (baseSize: number) => {
  const scale = width / 375; // Base on iPhone X width
  return Math.round(baseSize * scale);
};

const getResponsivePadding = () => Math.max(15, width * 0.04);
const getResponsiveFontSize = (size: 'small' | 'medium' | 'large') => {
  const sizes = {
    small: getResponsiveSize(12),
    medium: getResponsiveSize(16),
    large: getResponsiveSize(20),
  };
  return sizes[size];
};

// Default data to prevent dependency issues
const defaultDriverData = {
  userId: "DR456789",
  name: "John Doe",
  vehicle: "Honda Civic - ABC 123",
  rating: 4.8,
  status: "Online",
};

const defaultStats = {
  totalTrips: 234,
  activeOrders: 3,
  todaysEarnings: 45000,
  weeklyRating: 4.8,
  pendingNotifications: 1,
};

// Function to format currency to Naira
const formatNaira = (amount: number): string => {
  return `N${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
};

export default function DriverHome() {
  const router = useRouter();
  const { showConfirmDialog, showError, showSuccess, showInfo } = useAlert();
  const { isAuthenticated, isLoading: authLoading, checkAuth } = useAuth();

  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [activeTab, setActiveTab] = useState("Available");
  const [driverData, setDriverData] = useState(defaultDriverData);
  const [stats, setStats] = useState(defaultStats);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [energyLevel, setEnergyLevel] = useState(75);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [region, setRegion] = useState({
    latitude: 6.5244,
    longitude: 3.3792,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const mapRef = useRef<any>(null);

  const sidebarWidth = useMemo(() => Math.min(350, width * 0.9), []);
  const slideAnim = useRef(new Animated.Value(-sidebarWidth)).current;
  const progressAnim = useState(new Animated.Value(0))[0];

  // Animated progress rings and energy calculation
  useEffect(() => {
    Animated.loop(
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Calculate energy based on activity and time
    const interval = setInterval(() => {
      setEnergyLevel((prev) => {
        // Energy decreases when on delivery, increases when off duty
        let change = 0;
        if (activeTab === "On delivery") {
          change = -0.5; // Decreases during delivery
        } else if (activeTab === "Off duty") {
          change = 1; // Increases when resting
        } else if (activeTab === "Available") {
          change = 0.2; // Slight increase when waiting
        }

        // Add small random variation
        change += (Math.random() * 0.4 - 0.2);

        return Math.max(0, Math.min(100, prev + change));
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [activeTab]);

  const rotateAnimation = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Load data with error handling
  const loadUserData = useCallback(async () => {
    try {
      const cachedData = PerformanceOptimizer.getCache("driverData");
      if (cachedData) {
        setUserEmail(cachedData.email || "driver@brillprime.com");
        setDriverData(cachedData.driver || defaultDriverData);
        setStats(cachedData.stats || defaultStats);
        return;
      }

      const [email, driverName, savedStats] = await Promise.all([
        AsyncStorage.getItem("userEmail"),
        AsyncStorage.getItem("userName"),
        AsyncStorage.getItem("driverStats")
      ]);

      const emailValue = email || "driver@brillprime.com";
      const driverInfo = driverName ? { ...defaultDriverData, name: driverName } : defaultDriverData;
      const statsInfo = savedStats ? JSON.parse(savedStats) : defaultStats;

      setUserEmail(emailValue);
      setDriverData(driverInfo);
      setStats(statsInfo);

      PerformanceOptimizer.setCache("driverData", {
        email: emailValue,
        driver: driverInfo,
        stats: statsInfo,
      });
    } catch (error) {
      console.error("Error loading user data:", error);
      setUserEmail("driver@brillprime.com");
      setDriverData(defaultDriverData);
      setStats(defaultStats);
    }
  }, []);

  const loadDriverStats = useCallback(async () => {
    try {
      const cachedStats = PerformanceOptimizer.getCache("driverStats");
      if (cachedStats) {
        setStats(cachedStats);
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      const newStats = {
        totalTrips: 234,
        activeOrders: 3,
        todaysEarnings: 45000,
        weeklyRating: 4.8,
        pendingNotifications: 1,
      };

      setStats(newStats);
      PerformanceOptimizer.setCache("driverStats", newStats);

      // Load notification count
      await loadNotificationCount();
    } catch (error) {
      console.error("Error loading driver stats:", error);
      setStats(defaultStats);
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

  // Start real-time location tracking
  const startLocationTracking = useCallback(async () => {
    try {
      setIsTrackingLocation(true);

      // Get initial location
      const location = await locationService.getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
        setRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }

      // Start live tracking
      await locationService.startLiveTracking(5000); // Update every 5 seconds

      // Subscribe to location updates
      const unsubscribe = locationService.onLocationUpdate((newLocation) => {
        setCurrentLocation(newLocation);
        setRegion((prevRegion) => ({
          ...prevRegion,
          latitude: newLocation.latitude,
          longitude: newLocation.longitude,
        }));
      });

      return unsubscribe;
    } catch (error) {
      console.error("Error starting location tracking:", error);
      showError("Location Error", "Failed to start location tracking. Please enable location services.");
      setIsTrackingLocation(false);
    }
  }, [showError]);

  // Stop location tracking
  const stopLocationTracking = useCallback(() => {
    locationService.stopLiveTracking();
    setIsTrackingLocation(false);
  }, []);

  const initializeData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadUserData(), loadDriverStats(), checkAuth()]);
      // Start location tracking after data loads
      await startLocationTracking();
    } catch (error) {
      console.error("Error initializing data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [loadUserData, loadDriverStats, checkAuth, startLocationTracking]);

  useEffect(() => {
    initializeData();

    return () => {
      stopLocationTracking();
    };
  }, [initializeData]);

  const toggleMenu = useCallback(() => {
    const toValue = isMenuOpen ? -sidebarWidth : 0;
    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsMenuOpen(!isMenuOpen);
  }, [isMenuOpen, slideAnim, sidebarWidth]);

  const handleGoBack = useCallback(() => {
    router.push("/dashboard/driver");
  }, [router]);

  const handleManageTrips = useCallback(() => {
    router.push("/orders/driver-orders");
  }, [router]);

  const handleMenuItemPress = useCallback((item: string) => {
    toggleMenu();
    switch (item) {
      case "Profile":
        router.push("/profile");
        break;
      case "Notifications":
        router.push("/notifications");
        break;
      case "Earnings":
        router.push("/transactions");
        break;
      case "Settings":
        router.push("/profile/privacy-settings");
        break;
      case "Support":
        router.push("/support");
        break;
      case "Switch to Consumer":
        router.push("/home/consumer");
        break;
      case "Switch to Merchant":
        router.push("/home/merchant");
        break;
      default:
        showInfo("Navigation", `Navigating to ${item}`);
    }
  }, [router, toggleMenu, showInfo]);

  const handleSignOut = useCallback(async () => {
    showConfirmDialog(
      "Sign Out",
      "Are you sure you want to sign out?",
      async () => {
        try {
          await AsyncStorage.multiRemove([
            "userToken",
            "userEmail",
            "userRole",
          ]);
          PerformanceOptimizer.clearCache();
          router.replace("/");
          showSuccess("Signed Out", "You have been successfully signed out.");
        } catch (error) {
          console.error("Error signing out:", error);
          showError(
            "Sign Out Error",
            "There was an error signing out. Please try again.",
          );
        }
      },
    );
  }, [showConfirmDialog, showSuccess, showError, router]);

  const handleTabPress = useCallback((tab) => {
    setActiveTab(tab);
    showInfo("Status Update", `Switched to ${tab} mode`);
  }, [showInfo]);

  if (authLoading || isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#4682B4" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="lock-closed" size={64} color="#ccc" />
        <Text style={styles.errorText}>Please sign in to continue</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.replace("/auth/signin")}
        >
          <Text style={styles.retryText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="transparent" translucent />

      {/* Full Screen Real-time Map */}
      <RealTimeMapComponent
        region={region}
        currentLocation={currentLocation}
        mapRef={mapRef}
      />

      {/* Overlay for UI elements */}
      <View style={styles.overlay}>
        {/* Navigation Buttons */}
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color="#4682B4" />
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
          <Ionicons name="menu" size={20} color="#4682B4" />
        </TouchableOpacity>

        {/* Status Tabs */}
        <View style={styles.tabs}>
          {["Available", "On delivery", "Off duty"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && styles.activeTab,
              ]}
              onPress={() => handleTabPress(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Location Tracking Indicator */}
        {isTrackingLocation && (
          <View style={styles.trackingIndicator}>
            <View style={styles.trackingPulse} />
            <Ionicons name="location" size={16} color="#4CAF50" />
            <Text style={styles.trackingText}>Live Tracking</Text>
          </View>
        )}

        {/* Circular Progress Rings */}
        <View style={styles.progressContainer}>
          <Animated.View
            style={[
              styles.progressRing,
              styles.progressRingOuter,
              { transform: [{ rotate: rotateAnimation }] }
            ]}
          />
          <Animated.View
            style={[
              styles.progressRing,
              styles.progressRingMiddle,
              { transform: [{ rotate: rotateAnimation }] }
            ]}
          />
          <Animated.View
            style={[
              styles.progressRing,
              styles.progressRingInner,
              { transform: [{ rotate: rotateAnimation }] }
            ]}
          />
        </View>

        {/* Energy Percentage */}
        <Text style={styles.energyPercentage}>
          {Math.round(energyLevel)}%
        </Text>

        {/* Truck Icon */}
        <View style={styles.truckIconContainer}>
          <Ionicons name="car-sport" size={width * 0.08} color="#4682B4" />
        </View>

        {/* Total Energy Text */}
        <Text style={styles.totalEnergy}>Total energy</Text>

        {/* Divider Line */}
        <View style={styles.divider} />

        {/* Bottom Button */}
        <TouchableOpacity
          style={styles.bottomButton}
          onPress={handleManageTrips}
        >
          <Ionicons name="cube" size={20} color="white" style={styles.packageIcon} />
          <Text style={styles.bottomButtonText}>View orders</Text>
        </TouchableOpacity>
      </View>

      {isMenuOpen && (
        <Animated.View style={[styles.sidebar, { left: slideAnim }]}>
          <View style={styles.sidebarHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={toggleMenu}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                <Ionicons name="person-circle" size={60} color="#4682B4" />
              </View>
              <Text style={styles.userName}>{driverData.name}</Text>
              <Text style={styles.userEmail}>{userEmail}</Text>
            </View>
          </View>

          <ScrollView
            style={styles.sidebarScrollView}
            contentContainerStyle={styles.sidebarScrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
            scrollEventThrottle={16}
          >
            <View style={styles.menuList}>
              {[
                { label: "Profile", icon: "person-outline" },
                { label: "Notifications", icon: "notifications-outline" },
                { label: "Earnings", icon: "wallet-outline" },
                { label: "Settings", icon: "settings-outline" },
                { label: "Support", icon: "help-circle-outline" },
              ].map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={styles.menuItem}
                  onPress={() => handleMenuItemPress(item.label)}
                >
                  <Ionicons name={item.icon as any} size={22} color="#666" />
                  <Text style={styles.menuItemText}>{item.label}</Text>
                  {item.label === "Notifications" && unreadNotifications > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationBadgeText}>
                        {unreadNotifications > 99 ? '99+' : unreadNotifications}
                      </Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={20} color="#666" style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.sidebarFooter}>
              <TouchableOpacity
                style={styles.switchRoleButton}
                onPress={() => handleMenuItemPress("Switch to Consumer")}
              >
                <Ionicons name="cart-outline" size={20} color="#4682B4" />
                <Text style={styles.switchRoleText}>Switch to Consumer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.switchRoleButton}
                onPress={() => handleMenuItemPress("Switch to Merchant")}
              >
                <Ionicons name="storefront-outline" size={20} color="#4682B4" />
                <Text style={styles.switchRoleText}>Switch to Merchant</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <Ionicons name="log-out-outline" size={20} color="#e74c3c" />
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      )}

      {isMenuOpen && (
        <TouchableOpacity
          style={styles.menuOverlay}
          onPress={toggleMenu}
          activeOpacity={1}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    position: "relative",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
    fontFamily: "Montserrat-Regular",
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: "#e74c3c",
    fontFamily: "Montserrat-Regular",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: "#4682B4",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: "white",
    fontFamily: "Montserrat-Medium",
  },
  map: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 0,
  },
  mapPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f0f8ff",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 0,
  },
  mapPlaceholderText: {
    marginTop: 10,
    fontSize: 16,
    color: "#4682B4",
    fontFamily: "Montserrat-Medium",
  },
  retryMapButton: {
    marginTop: 15,
    backgroundColor: "#4682B4",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryMapText: {
    color: "white",
    fontFamily: "Montserrat-Medium",
    fontSize: 14,
  },
  driverLocationMarker: {
    backgroundColor: "white",
    borderRadius: 25,
    padding: 8,
    borderWidth: 3,
    borderColor: "#4682B4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  trackingIndicator: {
    position: "absolute",
    top: 130,
    left: 20,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trackingPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  trackingText: {
    fontSize: 12,
    color: "#4CAF50",
    fontFamily: "Montserrat-SemiBold",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: 1,
  },
  backButton: {
    position: "absolute",
    left: getResponsivePadding(),
    top: Math.max(20, height * 0.025),
    width: getResponsiveSize(40),
    height: getResponsiveSize(40),
    backgroundColor: "white",
    borderRadius: getResponsiveSize(20),
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  menuButton: {
    position: "absolute",
    right: getResponsivePadding(),
    top: Math.max(20, height * 0.025),
    width: getResponsiveSize(40),
    height: getResponsiveSize(40),
    backgroundColor: "white",
    borderRadius: getResponsiveSize(20),
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  tabs: {
    position: "absolute",
    left: getResponsivePadding(),
    top: Math.max(80, height * 0.1),
    flexDirection: "row",
    gap: getResponsiveSize(10),
    flexWrap: "wrap",
    maxWidth: width - (getResponsivePadding() * 2),
  },
  tab: {
    minWidth: getResponsiveSize(100),
    height: getResponsiveSize(35),
    borderRadius: getResponsiveSize(30),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#4682B4",
    paddingHorizontal: getResponsivePadding(),
  },
  activeTab: {
    backgroundColor: "#4682B4",
    borderColor: "#4682B4",
  },
  tabText: {
    fontSize: Math.max(10, Math.min(14, width * 0.035)),
    fontWeight: "500",
    color: "#4682B4",
    fontFamily: "Montserrat-Medium",
  },
  activeTabText: {
    color: "white",
  },
  progressContainer: {
    position: "absolute",
    width: Math.min(340, width * 0.8),
    height: Math.min(340, width * 0.8),
    left: "50%",
    top: "45%",
    transform: [
      { translateX: -Math.min(170, width * 0.4) },
      { translateY: -Math.min(170, width * 0.4) },
    ],
  },
  progressRing: {
    position: "absolute",
    borderRadius: 1000,
    borderWidth: 2,
    borderColor: "rgba(70, 130, 180, 0.5)",
  },
  progressRingOuter: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(70, 130, 180, 0.1)",
    borderColor: "#4682B4",
    borderTopColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
    borderWidth: 4,
  },
  progressRingMiddle: {
    width: "60%",
    height: "60%",
    left: "20%",
    top: "20%",
    backgroundColor: "rgba(70, 130, 180, 0.2)",
    borderColor: "#4682B4",
    borderTopColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
    borderWidth: 3,
  },
  progressRingInner: {
    width: "30%",
    height: "30%",
    left: "35%",
    top: "35%",
    backgroundColor: "rgba(70, 130, 180, 0.3)",
    borderColor: "#4682B4",
    borderTopColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
    borderWidth: 2,
  },
  energyPercentage: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: [{ translateX: -30 }, { translateY: -20 }],
    fontSize: Math.max(16, Math.min(24, width * 0.06)),
    fontWeight: "800",
    color: "#4682B4",
    fontFamily: "Montserrat-ExtraBold",
  },
  truckIconContainer: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: [
      { translateX: -width * 0.04 },
      { translateY: -width * 0.04 },
    ],
  },
  totalEnergy: {
    position: "absolute",
    left: "50%",
    top: "58%",
    transform: [{ translateX: -35 }],
    fontSize: Math.max(8, Math.min(12, width * 0.03)),
    fontWeight: "600",
    color: "black",
    fontFamily: "Montserrat-SemiBold",
  },
  divider: {
    position: "absolute",
    left: "50%",
    top: "68%",
    width: Math.min(100, width * 0.2),
    height: 3,
    backgroundColor: "#D9D9D9",
    borderRadius: 5,
    transform: [{ translateX: -Math.min(50, width * 0.1) }],
  },
  bottomButton: {
    position: "absolute",
    left: getResponsivePadding(),
    bottom: Math.max(20, height * 0.03),
    width: width - (getResponsivePadding() * 2),
    maxWidth: Math.min(350, width * 0.9),
    height: getResponsiveSize(50),
    backgroundColor: "#4682B4",
    borderRadius: getResponsiveSize(30),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  bottomButtonText: {
    color: "white",
    fontSize: getResponsiveFontSize('medium'),
    fontWeight: "500",
    fontFamily: "Montserrat-Medium",
  },
  packageIcon: {
    marginRight: 10,
  },
  sidebar: {
    position: "absolute",
    top: 0,
    left: 0,
    width: Math.min(350, width * 0.9),
    height: "100%",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 20,
  },
  sidebarHeader: {
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 4,
    zIndex: 10,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  userName: {
    color: "#333",
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
    fontFamily: "Montserrat-SemiBold",
  },
  userEmail: {
    color: "#666",
    fontSize: 13,
    fontFamily: "Montserrat-Regular",
  },
  sidebarScrollView: {
    flex: 1,
  },
  sidebarScrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  menuList: {
    paddingVertical: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    gap: 15,
  },
  menuItemText: {
    flex: 1,
    color: "#333",
    fontSize: 16,
    fontFamily: "Montserrat-Medium",
  },
  notificationBadge: {
    backgroundColor: "#e74c3c",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    fontFamily: "Montserrat-Bold",
  },
  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  switchRoleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  switchRoleText: {
    color: "#4682B4",
    fontSize: 16,
    fontFamily: "Montserrat-Medium",
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  signOutText: {
    color: "#e74c3c",
    fontSize: 16,
    fontFamily: "Montserrat-Medium",
  },
  menuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    zIndex: 15,
  },
});