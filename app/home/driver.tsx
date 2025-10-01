
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
  const [activeTab, setActiveTab] = useState("Available");
  const [driverData, setDriverData] = useState(defaultDriverData);
  const [stats, setStats] = useState(defaultStats);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useState(new Animated.Value(-280))[0];

  // Memoized values
  const sidebarWidth = useMemo(() => Math.min(280, width * 0.8), []);

  // Load data with error handling - fixed dependencies
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

      // Cache the data
      PerformanceOptimizer.setCache("driverData", {
        email: emailValue,
        driver: driverInfo,
        stats: statsInfo,
      });
    } catch (error) {
      console.error("Error loading user data:", error);
      showError("Loading Error", "Failed to load some data. Please refresh.");
      // Set defaults on error
      setUserEmail("driver@brillprime.com");
      setDriverData(defaultDriverData);
      setStats(defaultStats);
    }
  }, [showError]); // Only showError as dependency

  const loadDriverStats = useCallback(async () => {
    try {
      const cachedStats = PerformanceOptimizer.getCache("driverStats");
      if (cachedStats) {
        setStats(cachedStats);
        return;
      }

      // Simulate API call
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
  }, []); // No dependencies needed

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
        {/* Menu Icon */}
        <TouchableOpacity onPress={toggleMenu} style={styles.menu}>
          <View style={styles.menuLines}>
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </View>
        </TouchableOpacity>

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
                  { color: activeTab === tab ? "white" : "#4682B4" },
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Circular Progress */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressRing, styles.progressRingOuter]} />
          <View style={[styles.progressRing, styles.progressRingMiddle]} />
          <View style={[styles.progressRing, styles.progressRingInner]} />
        </View>

        {/* Truck Icon */}
        <View style={styles.truckIconContainer}>
          <Ionicons
            name="car-sport"
            size={30}
            color="black"
            style={styles.truckIcon}
          />
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
      </View>

      {/* Sidebar */}
      <Animated.View style={[styles.sidebar, { right: slideAnim }]}>
        <View style={styles.sidebarContent}>
          <View style={styles.sidebarProfile}>
            <View style={styles.sidebarProfileImage}>
              <Ionicons name="car" size={30} color="#4682B4" />
            </View>
            <Text style={styles.sidebarProfileName}>
              {driverData.name}
            </Text>
            <Text style={styles.sidebarProfileEmail}>{userEmail}</Text>
          </View>

          <View style={styles.menuList}>
            {["Profile", "Earnings", "Settings", "Support"].map((item) => (
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
      </Animated.View>

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
    backgroundColor: "white",
    position: "relative",
    width: 399,
    height: 896,
    overflow: "hidden",
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
    zIndex: -1,
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
    zIndex: -1,
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
  menu: {
    position: "absolute",
    left: 15,
    top: 15,
    width: 24,
    height: 24,
    zIndex: 10,
  },
  menuLines: {
    width: "100%",
    height: "100%",
    justifyContent: "space-between",
  },
  menuLine: {
    height: 2,
    backgroundColor: "#333",
    width: "100%",
  },
  tabs: {
    position: "absolute",
    left: 15,
    top: 110,
    flexDirection: "row",
    gap: 10,
    zIndex: 10,
  },
  tab: {
    width: 120,
    height: 35,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#4682B4",
  },
  activeTab: {
    backgroundColor: "#4682B4",
  },
  inactiveTab: {
    backgroundColor: "white",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Montserrat-Medium",
  },
  progressContainer: {
    position: "absolute",
    left: 52.46,
    top: 295,
    width: 340,
    height: 340,
    transform: [{ rotate: "4deg" }],
  },
  progressRing: {
    position: "absolute",
    borderRadius: 170,
  },
  progressRingOuter: {
    width: 340,
    height: 340,
    backgroundColor: "rgba(70, 130, 180, 0.25)",
  },
  progressRingMiddle: {
    width: 210,
    height: 210,
    left: 65,
    top: 65,
    backgroundColor: "rgba(70, 130, 180, 0.5)",
  },
  progressRingInner: {
    width: 80,
    height: 80,
    left: 130,
    top: 130,
    backgroundColor: "rgba(70, 130, 180, 0.75)",
  },
  truckIconContainer: {
    position: "absolute",
    left: 179.39,
    top: 474.37,
    transform: [{ rotate: "-47deg" }],
  },
  truckIcon: {
    transform: [{ rotate: "-47deg" }],
  },
  totalEnergy: {
    position: "absolute",
    left: 45,
    top: 444,
    fontSize: 8,
    fontWeight: "600",
    color: "black",
    fontFamily: "Montserrat-SemiBold",
  },
  divider: {
    position: "absolute",
    left: 170,
    top: 532,
    width: 60,
    height: 5,
    backgroundColor: "#D9D9D9",
    borderRadius: 5,
  },
  bottomButton: {
    position: "absolute",
    left: 30,
    top: 782,
    width: 339,
    height: 54,
    backgroundColor: "#4682B4",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    zIndex: 10,
  },
  bottomButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "400",
    fontFamily: "Montserrat-Regular",
  },
  packageIcon: {
    marginRight: 10,
  },
  sidebar: {
    position: "absolute",
    top: 0,
    width: Math.min(280, Dimensions.get("window").width * 0.8),
    height: "100%",
    backgroundColor: "white",
    zIndex: 20,
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 15,
  },
  sidebarContent: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  sidebarProfile: {
    alignItems: "center",
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    marginBottom: 20,
  },
  sidebarProfileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0f8ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  sidebarProfileName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
    fontFamily: "Montserrat-Bold",
  },
  sidebarProfileEmail: {
    fontSize: 14,
    color: "#666",
    fontFamily: "Montserrat-Regular",
  },
  menuList: {
    flex: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuItemText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
    fontFamily: "Montserrat-Medium",
  },
  sidebarBottom: {
    paddingBottom: 30,
  },
  switchButton: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#2f75c2",
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  switchButtonText: {
    color: "#2f75c2",
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Montserrat-Medium",
  },
  signOutButton: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e74c3c",
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: "center",
  },
  signOutButtonText: {
    color: "#e74c3c",
    fontSize: 16,
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
