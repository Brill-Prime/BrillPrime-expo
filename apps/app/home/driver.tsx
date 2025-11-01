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

// Safe Map component with error boundary
const SafeMapComponent = React.memo(() => {
  const [mapError, setMapError] = useState(false);

  try {
    if (Platform.OS === "web") {
      return (
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map" size={40} color="#4682B4" />
          <Text style={styles.mapPlaceholderText}>Map View</Text>
        </View>
      );
    }

    const Map = require("../../components/Map").default;
    return <Map style={styles.map} />;
  } catch (error) {
    console.warn("Map component failed to load:", error);
    return (
      <View style={styles.mapPlaceholder}>
        <Ionicons name="map" size={40} color="#4682B4" />
        <Text style={styles.mapPlaceholderText}>Map Unavailable</Text>
      </View>
    );
  }
});

const { width, height } = Dimensions.get("window");

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

export default function DriverHome() {
  const router = useRouter();
  const { showConfirmDialog, showError, showSuccess, showInfo } = useAlert();
  const { isAuthenticated, isLoading: authLoading, checkAuth } = useAuth();

  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  type TabType = 'Available' | 'On delivery' | 'Off duty';
  const [activeTab, setActiveTab] = useState<TabType>("Available");
  const [driverData, setDriverData] = useState(defaultDriverData);
  const [stats, setStats] = useState(defaultStats);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [energyLevel, setEnergyLevel] = useState(75);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const sidebarWidth = useMemo(() => Math.min(350, width * 0.9), []);
  const slideAnim = useRef(new Animated.Value(-sidebarWidth)).current;
  const progressAnim = useState(new Animated.Value(0))[0];

  // Animated progress rings
  useEffect(() => {
    Animated.loop(
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Simulate energy level changes
    const interval = setInterval(() => {
      setEnergyLevel((prev) => {
        const change = Math.random() * 2 - 1;
        return Math.max(0, Math.min(100, prev + change));
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

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

  const initializeData = useCallback(async () => {
    try {
      await Promise.all([loadUserData(), loadDriverStats(), checkAuth()]);
    } catch (error) {
      console.error("Error initializing data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [loadUserData, loadDriverStats, checkAuth]);

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

  const handleTabPress = useCallback((tab: TabType) => {
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

      {/* Full Screen Map */}
      <SafeMapComponent />

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
              onPress={() => handleTabPress(tab as TabType)}
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
          <ScrollView style={styles.sidebarScrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.sidebarContent}>
              <View style={styles.sidebarProfile}>
                <View style={styles.sidebarProfileImage}>
                  <Ionicons name="person" size={30} color="#4682B4" />
                </View>
                <Text style={styles.sidebarProfileName}>{driverData.name}</Text>
                <Text style={styles.sidebarProfileEmail}>{userEmail}</Text>
              </View>

              <View style={styles.menuList}>
                {["Profile", "Notifications", "Earnings", "Settings", "Support"].map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.menuItem}
                    onPress={() => handleMenuItemPress(item)}
                  >
                    <View style={styles.menuItemContent}>
                      <Text style={styles.menuItemText}>{item}</Text>
                      {item === "Notifications" && unreadNotifications > 0 && (
                        <View style={styles.notificationBadge}>
                          <Text style={styles.notificationBadgeText}>
                            {unreadNotifications > 99 ? '99+' : unreadNotifications}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.sidebarBottom}>
                <TouchableOpacity
                  style={styles.switchButton}
                  onPress={() => handleMenuItemPress("Switch to Consumer")}
                >
                  <Text style={styles.switchButtonText}>
                    Switch to Consumer
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.switchButton}
                  onPress={() => handleMenuItemPress("Switch to Merchant")}
                >
                  <Text style={styles.switchButtonText}>
                    Switch to Merchant
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.signOutButton}
                  onPress={handleSignOut}
                >
                  <Text style={styles.signOutButtonText}>Sign out</Text>
                </TouchableOpacity>
              </View>
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
    left: 20,
    top: 20,
    width: 40,
    height: 40,
    backgroundColor: "white",
    borderRadius: 20,
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
    right: 20,
    top: 20,
    width: 40,
    height: 40,
    backgroundColor: "white",
    borderRadius: 20,
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
    left: width * 0.05,
    top: 80,
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    maxWidth: width * 0.9,
  },
  tab: {
    minWidth: 100,
    height: 35,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#4682B4",
    paddingHorizontal: 15,
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
    left: "5%",
    bottom: "5%",
    width: "90%",
    maxWidth: 350,
    height: Math.max(40, Math.min(60, width * 0.12)),
    backgroundColor: "#4682B4",
    borderRadius: 30,
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
    fontSize: Math.max(12, Math.min(16, width * 0.04)),
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
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 20,
  },
  sidebarScrollView: {
    flex: 1,
  },
  sidebarContent: {
    paddingTop: 60,
    paddingBottom: 30,
  },
  sidebarProfile: {
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sidebarProfileImage: {
    width: 80,
    height: 80,
    backgroundColor: "#f8f9fa",
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  sidebarProfileName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
    fontFamily: "Montserrat-SemiBold",
    textAlign: "center",
  },
  sidebarProfileEmail: {
    fontSize: 14,
    color: "#666",
    fontFamily: "Montserrat-Regular",
    textAlign: "center",
  },
  menuList: {
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  menuItemText: {
    fontSize: 16,
    color: "#333",
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
  sidebarBottom: {
    padding: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    marginTop: 10,
  },
  switchButton: {
    backgroundColor: "#f8f9fa",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  switchButtonText: {
    fontSize: 15,
    color: "#4682B4",
    fontWeight: "500",
    fontFamily: "Montserrat-Medium",
  },
  signOutButton: {
    backgroundColor: "#ffe6e6",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  signOutButtonText: {
    fontSize: 15,
    color: "#e74c3c",
    fontWeight: "500",
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