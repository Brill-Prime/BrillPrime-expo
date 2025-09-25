import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  StatusBar,
  Alert,
  ActivityIndicator,
  RefreshControl,
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
        <View style={refuelerStyles.mapPlaceholder}>
          <Ionicons name="map" size={40} color="#4682B4" />
          <Text style={refuelerStyles.mapPlaceholderText}>Map View</Text>
        </View>
      );
    }

    const Map = require("../../components/Map").default;
    return <Map style={refuelerStyles.map} />;
  } catch (error) {
    console.warn("Map component failed to load:", error);
    return (
      <View style={refuelerStyles.mapPlaceholder}>
        <Ionicons name="map" size={40} color="#4682B4" />
        <Text style={refuelerStyles.mapPlaceholderText}>Map Unavailable</Text>
      </View>
    );
  }
});

const { width, height } = Dimensions.get("window");

export default function DriverHome() {
  const router = useRouter();
  const { showConfirmDialog, showError, showSuccess, showInfo } = useAlert();
  const { isAuthenticated, isLoading: authLoading, checkAuth } = useAuth();

  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [driverData, setDriverData] = useState({
    userId: "DR456789",
    name: "John Doe",
    vehicle: "Honda Civic - ABC 123",
    rating: 4.8,
    status: "Online",
  });

  const [stats, setStats] = useState({
    totalTrips: 234,
    activeOrders: 3,
    todaysEarnings: 45000,
    weeklyRating: 4.8,
    pendingNotifications: 1,
  });

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useState(new Animated.Value(-280))[0];

  // Memoized values
  const sidebarWidth = useMemo(() => Math.min(280, width * 0.8), [width]);

  // Load data with error handling
  const loadUserData = useCallback(async () => {
    try {
      const cachedData = PerformanceOptimizer.getCache("driverData");
      if (cachedData) {
        setUserEmail(cachedData.email || "driver@brillprime.com");
        setDriverData((prev) => ({ ...prev, ...cachedData.driver }));
        setStats((prev) => ({ ...prev, ...cachedData.stats }));
        return;
      }
      const email = await AsyncStorage.getItem("userEmail");
      const driverName = await AsyncStorage.getItem("userName");
      const savedStats = await AsyncStorage.getItem("driverStats");

      setUserEmail(email || "driver@brillprime.com");

      if (driverName) {
        setDriverData((prev) => ({ ...prev, name: driverName }));
      }

      if (savedStats) {
        setStats(JSON.parse(savedStats));
      }
      PerformanceOptimizer.setCache("driverData", {
        email: email || "driver@brillprime.com",
        driver: driverData,
        stats: savedStats ? JSON.parse(savedStats) : stats,
      });
    } catch (error) {
      console.error("Error loading user data:", error);
      showError("Loading Error", "Failed to load some data. Please refresh.");
    }
  }, [driverData, stats, showError]);

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      PerformanceOptimizer.clearCache();
      await initializeData();
    } finally {
      setRefreshing(false);
    }
  }, [initializeData]);

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

  const renderStars = useCallback((rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Ionicons key={i} name="star" size={16} color="#FFD700" />);
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={16} color="#FFD700" />,
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons
          key={`empty-${i}`}
          name="star-outline"
          size={16}
          color="#FFD700"
        />,
      );
    }

    return stars;
  }, []);

  if (authLoading || isLoading) {
    return (
      <View style={[refuelerStyles.container, refuelerStyles.centerContent]}>
        <ActivityIndicator size="large" color="#4682B4" />
        <Text style={refuelerStyles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={[refuelerStyles.container, refuelerStyles.centerContent]}>
        <Ionicons name="lock-closed" size={64} color="#ccc" />
        <Text style={refuelerStyles.errorText}>Please sign in to continue</Text>
        <TouchableOpacity
          style={refuelerStyles.retryButton}
          onPress={() => router.replace("/auth/signin")}
        >
          <Text style={refuelerStyles.retryText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={refuelerStyles.container}>
      <StatusBar backgroundColor="transparent" translucent />

      {/* Menu Icon */}
      <TouchableOpacity onPress={toggleMenu} style={refuelerStyles.menu}>
        <View style={refuelerStyles.menuLines}>
          <View style={refuelerStyles.menuLine} />
          <View style={refuelerStyles.menuLine} />
          <View style={refuelerStyles.menuLine} />
        </View>
      </TouchableOpacity>

      {/* Tabs */}
      <View style={refuelerStyles.tabs}>
        <TouchableOpacity
          style={[refuelerStyles.tab, refuelerStyles.tabAvailable]}
        >
          <Text style={[refuelerStyles.tabText, { color: "#4682B4" }]}>
            Available
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[refuelerStyles.tab, refuelerStyles.tabOnDelivery]}
        >
          <Text style={[refuelerStyles.tabText, { color: "white" }]}>
            On delivery
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[refuelerStyles.tab, refuelerStyles.tabOffDuty]}
        >
          <Text style={[refuelerStyles.tabText, { color: "#4682B4" }]}>
            Off duty
          </Text>
        </TouchableOpacity>
      </View>

      {/* Circular Progress */}
      <View style={refuelerStyles.progressContainer}>
        <View
          style={[
            refuelerStyles.progressRing,
            refuelerStyles.progressRingOuter,
          ]}
        />
        <View
          style={[
            refuelerStyles.progressRing,
            refuelerStyles.progressRingMiddle,
          ]}
        />
        <View
          style={[
            refuelerStyles.progressRing,
            refuelerStyles.progressRingInner,
          ]}
        />
        <Ionicons
          name="car-sport"
          size={30}
          color="black"
          style={refuelerStyles.truckIcon}
        />
      </View>

      {/* Total Energy Text */}
      <Text style={refuelerStyles.totalEnergy}>Total energy</Text>
      <View style={refuelerStyles.divider} />

      {/* Bottom Button */}
      <TouchableOpacity
        style={refuelerStyles.bottomButton}
        onPress={handleManageTrips}
      >
        <Ionicons
          name="cube"
          size={20}
          color="white"
          style={refuelerStyles.packageIcon}
        />
        <Text style={refuelerStyles.bottomButtonText}>View orders</Text>
      </TouchableOpacity>

      {/* Map Section */}
      <View style={refuelerStyles.mapSection}>
        <Text style={refuelerStyles.sectionTitle}>Current Location</Text>
        <SafeMapComponent />
      </View>

      {/* Stats Section */}
      <View style={refuelerStyles.statsSection}>
        <Text style={refuelerStyles.statsTitle}>Today's Overview</Text>
        <View style={refuelerStyles.statsGrid}>
          <View style={refuelerStyles.statCard}>
            <Text style={refuelerStyles.statNumber}>{stats.totalTrips}</Text>
            <Text style={refuelerStyles.statLabel}>Total Trips</Text>
          </View>
          <View style={refuelerStyles.statCard}>
            <Text style={refuelerStyles.statNumber}>{stats.activeOrders}</Text>
            <Text style={refuelerStyles.statLabel}>Active Orders</Text>
          </View>
        </View>
        <View style={refuelerStyles.statsGrid}>
          <View style={refuelerStyles.statCard}>
            <Text style={refuelerStyles.statNumber}>
              ₦{(stats.todaysEarnings / 1000).toFixed(0)}K
            </Text>
            <Text style={refuelerStyles.statLabel}>Today's Earnings</Text>
          </View>
          <View style={refuelerStyles.statCard}>
            <Text style={refuelerStyles.statNumber}>{stats.weeklyRating}</Text>
            <Text style={refuelerStyles.statLabel}>Weekly Rating</Text>
          </View>
        </View>
      </View>

      {/* Sidebar and Overlay (unchanged) */}
      <Animated.View style={[refuelerStyles.sidebar, { right: slideAnim }]}>
        <View style={refuelerStyles.sidebarContent}>
          <View style={refuelerStyles.sidebarProfile}>
            <View style={refuelerStyles.sidebarProfileImage}>
              <Ionicons name="car" size={30} color="#4682B4" />
            </View>
            <Text style={refuelerStyles.sidebarProfileName}>
              {driverData.name}
            </Text>
            <Text style={refuelerStyles.sidebarProfileEmail}>{userEmail}</Text>
          </View>

          <View style={refuelerStyles.menuList}>
            {["Profile", "Earnings", "Settings", "Support"].map((item) => (
              <TouchableOpacity
                key={item}
                style={refuelerStyles.menuItem}
                onPress={() => handleMenuItemPress(item)}
              >
                <Text style={refuelerStyles.menuItemText}>{item}</Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            ))}
          </View>

          <View style={refuelerStyles.sidebarBottom}>
            <TouchableOpacity
              style={refuelerStyles.switchButton}
              onPress={() => handleMenuItemPress("Switch to Consumer")}
            >
              <Text style={refuelerStyles.switchButtonText}>
                Switch to Consumer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={refuelerStyles.signOutButton}
              onPress={handleSignOut}
            >
              <Text style={refuelerStyles.signOutButtonText}>Sign out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {isMenuOpen && (
        <TouchableOpacity
          style={refuelerStyles.menuOverlay}
          onPress={toggleMenu}
          activeOpacity={1}
        />
      )}
    </View>
  );
}

const refuelerStyles = StyleSheet.create({
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
  tabAvailable: {
    backgroundColor: "white",
  },
  tabOnDelivery: {
    backgroundColor: "#4682B4",
  },
  tabOffDuty: {
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
  truckIcon: {
    position: "absolute",
    left: 179.39,
    top: 474.37,
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
  mapSection: {
    position: "absolute",
    top: 600,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 10,
    zIndex: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
    fontFamily: "Montserrat-SemiBold",
  },
  map: {
    height: 200,
    borderRadius: 15,
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: "#f0f8ff",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  mapPlaceholderText: {
    marginTop: 10,
    fontSize: 16,
    color: "#4682B4",
    fontFamily: "Montserrat-Medium",
  },
  statsSection: {
    position: "absolute",
    top: 820,
    left: 0,
    right: 0,
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 10,
    zIndex: 5,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
    fontFamily: "Montserrat-SemiBold",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#4682B4",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
    fontFamily: "Montserrat-Bold",
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    fontFamily: "Montserrat-Regular",
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
