import React, { useEffect, useState, useCallback, useMemo } from "react";
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
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAlert } from "../../components/AlertProvider";
import { useAuth } from "../../hooks/useAuth";
import { PerformanceOptimizer } from "../../utils/performance";

// Safe Map component with error boundary
const SafeMapComponent = React.memo(() => {
  const [mapError, setMapError] = useState(false);

  try {
    if (Platform.OS === "web") {
      return (
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map" size={40} color="#006AFF" />
          <Text style={styles.mapPlaceholderText}>Map View</Text>
        </View>
      );
    }

    const Map = require("../../components/Map").default;
    return <Map style={styles.map} customMapStyle={blueMapStyle} />;
  } catch (error) {
    console.warn("Map component failed to load:", error);
    return (
      <View style={styles.mapPlaceholder}>
        <Ionicons name="map" size={40} color="#006AFF" />
        <Text style={styles.mapPlaceholderText}>Map Unavailable</Text>
      </View>
    );
  }
});

const { width, height } = Dimensions.get("window");

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

// Theme colors
const theme = {
  colors: {
    primary: '#4682B4',
    boltBlue: '#006AFF',
    background: '#fff',
    text: '#333',
    textLight: '#666',
    white: '#fff',
    error: '#e74c3c',
    success: '#00C853',
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
    bold: 'Montserrat-Bold',
    semiBold: 'Montserrat-SemiBold',
    medium: 'Montserrat-Medium',
    regular: 'Montserrat-Regular',
    light: 'Montserrat-Light',
  },
};

// Default data
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
  const sidebarWidth = useMemo(() => width * 0.8, [width]);
  const slideAnim = useState(new Animated.Value(-sidebarWidth))[0];

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
      showError("Loading Error", "Failed to load some data. Please refresh.");
      setUserEmail("driver@brillprime.com");
      setDriverData(defaultDriverData);
      setStats(defaultStats);
    }
  }, [showError]);

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
    } catch (error) {
      console.error("Error loading driver stats:", error);
      setStats(defaultStats);
    }
  }, []);

  const initializeData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadUserData(), loadDriverStats(), checkAuth()]);
    } catch (error) {
      console.error("Error initializing data:", error);
      showError(
        "Initialization Error",
        "Failed to load app data. Please restart the app.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [loadUserData, loadDriverStats, checkAuth, showError]);

  useEffect(() => {
    initializeData();
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

  const handleViewEarnings = useCallback(() => {
    router.push("/transactions");
  }, [router]);

  const handleMenuItemPress = useCallback(
    (item) => {
      toggleMenu();

      switch (item) {
        case "Profile":
          router.push("/profile");
          break;
        case "Earnings":
          router.push("/transactions");
          break;
        case "Settings":
          router.push("/profile/edit");
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
    },
    [toggleMenu, router, showInfo],
  );

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
        <ActivityIndicator size="large" color="#006AFF" />
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

      {/* Full Screen Map with Blue Theme */}
      <SafeMapComponent />

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

      {/* Tabs */}
      <View style={styles.tabs}>
        {["Available", "On delivery", "Off duty"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab ? styles.activeTab : styles.inactiveTab,
            ]}
            onPress={() => handleTabPress(tab)}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab ? theme.colors.white : theme.colors.boltBlue },
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Circular Progress with Animation */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressRing, styles.progressRingOuter]} />
        <View style={[styles.progressRing, styles.progressRingMiddle]} />
        <View style={[styles.progressRing, styles.progressRingInner]} />
      </View>

      {/* Energy Percentage */}
      <Text style={styles.energyPercentage}>75%</Text>

      {/* Truck Icon */}
      <View style={styles.truckIcon}>
        <Ionicons name="car-sport" size={30} color="black" />
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
        <Ionicons
          name="cube"
          size={20}
          color="white"
          style={styles.packageIcon}
        />
        <Text style={styles.bottomButtonText}>View orders</Text>
      </TouchableOpacity>

      {/* Clean, Modern Sidebar */}
      <Animated.View style={[styles.sidebar, { right: slideAnim }]}>
        <View style={styles.sidebarContent}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>Menu</Text>
            <TouchableOpacity onPress={toggleMenu} style={styles.sidebarClose}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.sidebarProfile}>
            <View style={styles.sidebarProfileImage}>
              <Ionicons name="car" size={30} color={theme.colors.boltBlue} />
            </View>
            <Text style={styles.sidebarProfileName}>{driverData.name}</Text>
            <Text style={styles.sidebarProfileEmail}>{userEmail}</Text>
          </View>

          <View style={styles.menuList}>
            {[
              { name: "Profile", icon: "person" },
              { name: "Earnings", icon: "wallet" },
              { name: "Settings", icon: "settings" },
              { name: "Support", icon: "help-circle" }
            ].map((item) => (
              <TouchableOpacity
                key={item.name}
                style={styles.menuItem}
                onPress={() => handleMenuItemPress(item.name)}
              >
                <View style={styles.menuItemContent}>
                  <Ionicons name={item.icon} size={20} color={theme.colors.boltBlue} />
                  <Text style={styles.menuItemText}>{item.name}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textLight} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sidebarBottom}>
            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => handleMenuItemPress("Switch to Consumer")}
            >
              <Text style={styles.switchButtonText}>Switch to Consumer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => handleMenuItemPress("Switch to Merchant")}
            >
              <Text style={styles.switchButtonText}>Switch to Merchant</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: theme.colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.textLight,
    fontFamily: theme.typography.regular,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.error,
    fontFamily: theme.typography.regular,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: theme.colors.boltBlue,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: theme.colors.white,
    fontFamily: theme.typography.medium,
  },
  map: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: -1,
  },
  mapPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: -1,
  },
  mapPlaceholderText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.boltBlue,
    fontFamily: theme.typography.medium,
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
  tabs: {
    position: 'absolute',
    left: 20,
    top: 100,
    flexDirection: 'row',
    gap: 10,
    zIndex: 10,
  },
  tab: {
    minWidth: 100,
    height: 35,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: theme.colors.boltBlue,
  },
  activeTab: {
    backgroundColor: theme.colors.boltBlue,
  },
  inactiveTab: {
    backgroundColor: theme.colors.white,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: theme.typography.medium,
  },
  progressContainer: {
    position: 'absolute',
    width: '80%',
    aspectRatio: 1,
    left: '10%',
    top: '30%',
    transform: [{ rotate: '4deg' }],
    zIndex: 1,
  },
  progressRing: {
    position: 'absolute',
    borderRadius: 999,
  },
  progressRingOuter: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 106, 255, 0.1)',
  },
  progressRingMiddle: {
    width: '60%',
    height: '60%',
    left: '20%',
    top: '20%',
    backgroundColor: 'rgba(0, 106, 255, 0.2)',
  },
  progressRingInner: {
    width: '30%',
    height: '30%',
    left: '35%',
    top: '35%',
    backgroundColor: 'rgba(0, 106, 255, 0.3)',
  },
  energyPercentage: {
    position: 'absolute',
    left: '50%',
    top: '40%',
    transform: [{ translateX: -25 }],
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.boltBlue,
    fontFamily: theme.typography.bold,
  },
  truckIcon: {
    position: 'absolute',
    left: '50%',
    top: '40%',
    transform: [{ translateX: -15 }, { translateY: 20 }],
    zIndex: 2,
  },
  totalEnergy: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: [{ translateX: -50 }],
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: theme.typography.semiBold,
  },
  divider: {
    position: 'absolute',
    left: '50%',
    top: '55%',
    width: 100,
    height: 3,
    backgroundColor: theme.colors.border,
    borderRadius: 5,
    transform: [{ translateX: -50 }],
  },
  bottomButton: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 30,
    height: 50,
    backgroundColor: theme.colors.boltBlue,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...theme.shadows.medium,
  },
  bottomButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: theme.typography.medium,
    marginLeft: 8,
  },
  packageIcon: {
    marginRight: 8,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '80%',
    height: '100%',
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  sidebarContent: {
    flex: 1,
    padding: 20,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: theme.typography.semiBold,
  },
  sidebarClose: {
    padding: 8,
  },
  sidebarProfile: {
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sidebarProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 106, 255, 0.1)',
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
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  menuItemText: {
    fontSize: 16,
    color: theme.colors.text,
    fontFamily: theme.typography.medium,
  },
  sidebarBottom: {
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  switchButton: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.boltBlue,
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  switchButtonText: {
    color: theme.colors.boltBlue,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: theme.typography.medium,
  },
  signOutButton: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.error,
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: theme.colors.error,
    fontSize: 14,
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
});
