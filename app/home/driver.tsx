
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions, 
  Animated,
  Alert,
  StatusBar
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import MapView, { PROVIDER_GOOGLE, Marker } from '../../components/Map';
import * as Location from 'expo-location';
import { useAlert } from '../../components/AlertProvider';
import { useAuth } from '../../hooks/useAuth';
import { PerformanceOptimizer } from '../../utils/performance';

// Get initial screen dimensions
const getScreenDimensions = () => Dimensions.get('window');

export default function DriverHome() {
  const router = useRouter();
  const { showConfirmDialog, showError, showSuccess, showInfo } = useAlert();
  const [userEmail, setUserEmail] = useState("");
  const { isAuthenticated, isLoading, requireRole } = useAuth();
  const [screenDimensions, setScreenDimensions] = useState(getScreenDimensions());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useState(new Animated.Value(-280))[0];
  const [driverStatus, setDriverStatus] = useState('available'); // available, on-delivery, off-duty
  const [isLocationSet, setIsLocationSet] = useState(false);
  const [userAddress, setUserAddress] = useState("");
  const [region, setRegion] = useState({
    latitude: 9.0765,
    longitude: 7.3986,
    latitudeDelta: 8.0,
    longitudeDelta: 8.0,
  });
  const [availableOrders] = useState([
    { id: 1, name: "Lagos Fuel Station", latitude: 6.5244, longitude: 3.3792, type: "fuel", amount: "₹1,200" },
    { id: 2, name: "Victoria Island Market", latitude: 6.4281, longitude: 3.4219, type: "delivery", amount: "₹850" },
    { id: 3, name: "Ikeja Shopping Mall", latitude: 6.5927, longitude: 3.3615, type: "pickup", amount: "₹650" },
  ]);
  const [todayStats, setTodayStats] = useState({
    totalEarnings: 2450,
    deliveriesCompleted: 8,
    rating: 4.8,
    totalFuel: 245,
    totalDistance: 156
  });

  useEffect(() => {
    // Check role and load location only after auth is determined
    if (!isLoading) {
      if (requireRole('driver')) {
        getCurrentLocation();
      }
    }
  }, [isLoading, requireRole, getCurrentLocation]);

  useEffect(() => {
    // Debounce screen dimension changes to prevent excessive re-renders
    let timeoutId: NodeJS.Timeout;
    
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setScreenDimensions(window);
        const sidebarWidth = Math.min(280, window.width * 0.8);
        slideAnim.setValue(isMenuOpen ? 0 : -sidebarWidth);
      }, 150); // 150ms debounce
    });

    return () => {
      clearTimeout(timeoutId);
      subscription?.remove();
    };
  }, [isMenuOpen, slideAnim]);

  const loadUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Batch AsyncStorage operations for better performance
      const keys = ["userEmail", "userToken", "userRole", "tokenExpiry"];
      const values = await AsyncStorage.multiGet(keys);
      const data = Object.fromEntries(values);
      
      const email = data.userEmail;
      const token = data.userToken;
      const role = data.userRole;
      const tokenExpiry = data.tokenExpiry;

      console.log("Driver Home - Auth check:", { email, token: !!token, role });

      // Check token expiry first
      if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
        console.log("Token expired, redirecting to auth");
        await AsyncStorage.multiRemove(keys);
        router.replace("/auth/signin");
        return;
      }

      if (!token) {
        console.log("No token found, redirecting to auth");
        router.replace("/auth/signin");
        return;
      }

      if (role !== "driver") {
        console.log("User is not a driver, redirecting to role selection");
        router.replace("/auth/role-selection");
        return;
      }

      setUserEmail(email || "driver@brillprime.com");
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Error loading user data:", error);
      showError("Error", "Failed to load user data. Please try signing in again.");
      router.replace("/auth/signin");
    } finally {
      setIsLoading(false);
    }
  }, [router, showError]);

  const getCurrentLocation = useCallback(async () => {
    try {
      // Check if location permissions are already granted
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Location permission not granted');
        return;
      }

      // Use lower accuracy for faster response
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
        maximumAge: 60000, // Use cached location if less than 1 minute old
      });
      
      const { latitude, longitude } = location.coords;
      setRegion(prevRegion => ({
        ...prevRegion,
        latitude,
        longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }));
      setIsLocationSet(true);
    } catch (error) {
      console.error("Error getting location:", error);
      // Set default Nigeria location on error
      setRegion(prevRegion => ({
        ...prevRegion,
        latitude: 9.0765,
        longitude: 7.3986,
      }));
    }
  }, []);

  const toggleMenu = () => {
    const sidebarWidth = Math.min(280, screenDimensions.width * 0.8);
    const toValue = isMenuOpen ? -sidebarWidth : 0;
    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleStatusChange = (status: string) => {
    setDriverStatus(status);
    showSuccess("Status Updated", `You are now ${status.replace('-', ' ')}`);
  };

  const handleGoBack = () => {
    router.push('/dashboard/driver');
  };

  const handleViewOrders = () => {
    router.push('/orders/consumer-orders');
  };

  const handleMenuItemPress = (item: string) => {
    toggleMenu();
    
    switch (item) {
      case "Profile":
        router.push("/profile");
        break;
      case "Earnings":
        router.push("/transactions");
        break;
      case "Vehicle Info":
        showInfo("Vehicle Info", "Vehicle information management coming soon!");
        break;
      case "Route Planner":
        showInfo("Route Planner", "Smart route optimization coming soon!");
        break;
      case "Settings":
        router.push("/account");
        break;
      case "Support":
        router.push("/support");
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
          showSuccess("Signed Out", "You have been successfully signed out.");
        } catch (error) {
          console.error("Error signing out:", error);
          showError("Sign Out Error", "There was an error signing out. Please try again.");
        }
      }
    );
  };

  // Memoize responsive calculations to prevent unnecessary recalculations
  const responsiveValues = useMemo(() => {
    const isSmallScreen = screenDimensions.width < 400;
    const isMediumScreen = screenDimensions.width >= 400 && screenDimensions.width < 600;
    const responsivePadding = Math.max(15, screenDimensions.width * 0.04);
    const progressSize = Math.min(screenDimensions.width * 0.7, 300);
    const responsiveFontSize = {
      title: isSmallScreen ? 16 : 18,
      regular: isSmallScreen ? 14 : 16,
      small: isSmallScreen ? 12 : 14,
      large: isSmallScreen ? 20 : 24,
    };
    
    return { isSmallScreen, isMediumScreen, responsivePadding, progressSize, responsiveFontSize };
  }, [screenDimensions.width]);

  const styles = useMemo(() => 
    getResponsiveStyles(screenDimensions, responsiveValues.progressSize, responsiveValues.responsivePadding, responsiveValues.responsiveFontSize),
    [screenDimensions, responsiveValues]
  );

  // Show loading screen
  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 18, color: '#4682B4', marginBottom: 10 }}>Loading...</Text>
        <Text style={{ fontSize: 14, color: '#666' }}>Setting up driver dashboard</Text>
      </View>
    );
  }

  // Show error if not authenticated
  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Text style={{ fontSize: 18, color: '#e74c3c', marginBottom: 10, textAlign: 'center' }}>
          Authentication Required
        </Text>
        <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 }}>
          Please sign in to access the driver dashboard
        </Text>
        <TouchableOpacity 
          style={{
            backgroundColor: '#4682B4',
            paddingHorizontal: 30,
            paddingVertical: 12,
            borderRadius: 25
          }}
          onPress={() => router.replace("/auth/signin")}
        >
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="transparent" translucent />
      
      {/* Live Map Background */}
      <View style={styles.mapBackground}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={{ width: '100%', height: '100%' }}
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
          onMapReady={() => console.log('Map is ready')}
          onError={(error) => console.error('Map error:', error)}
        >
          {availableOrders.map((order) => (
            <Marker
              key={order.id}
              coordinate={{
                latitude: order.latitude,
                longitude: order.longitude,
              }}
              title={order.name}
              description={`${order.type} - ${order.amount}`}
              pinColor={order.type === 'fuel' ? 'red' : order.type === 'delivery' ? 'green' : 'blue'}
            />
          ))}
        </MapView>
      </View>

      {/* Overlay Content */}
      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
            <Ionicons name={isMenuOpen ? "close" : "menu"} size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Status Tabs */}
        <View style={styles.statusTabs}>
          <TouchableOpacity 
            style={[styles.tab, driverStatus === 'available' && styles.activeTab]}
            onPress={() => handleStatusChange('available')}
          >
            <Text style={[styles.tabText, driverStatus === 'available' && styles.activeTabText]}>
              Available
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, driverStatus === 'on-delivery' && styles.activeTab]}
            onPress={() => handleStatusChange('on-delivery')}
          >
            <Text style={[styles.tabText, driverStatus === 'on-delivery' && styles.activeTabText]}>
              On delivery
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, driverStatus === 'off-duty' && styles.activeTab]}
            onPress={() => handleStatusChange('off-duty')}
          >
            <Text style={[styles.tabText, driverStatus === 'off-duty' && styles.activeTabText]}>
              Off duty
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Circular Progress Display */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressRing, styles.outerRing]} />
            <View style={[styles.progressRing, styles.middleRing]} />
            <View style={[styles.progressRing, styles.innerRing]} />
            
            {/* Truck Icon */}
            <View style={styles.truckIcon}>
              <Ionicons name="car-outline" size={progressSize * 0.12} color="#4682B4" />
            </View>
            
            {/* Stats in the center */}
            <View style={styles.centerStats}>
              <Text style={styles.totalEnergyText}>Total Earnings</Text>
              <Text style={styles.earningsAmount}>₹{todayStats.totalEarnings}</Text>
              <Text style={styles.deliveriesText}>{todayStats.deliveriesCompleted} deliveries</Text>
            </View>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{todayStats.rating}⭐</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{todayStats.totalDistance}km</Text>
                <Text style={styles.statLabel}>Distance</Text>
              </View>
            </View>
            
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{todayStats.totalFuel}L</Text>
                <Text style={styles.statLabel}>Fuel Saved</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{availableOrders.length}</Text>
                <Text style={styles.statLabel}>Available</Text>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Available Orders Preview */}
          <View style={styles.ordersPreview}>
            <Text style={styles.ordersTitle}>Nearby Orders</Text>
            {availableOrders.slice(0, 2).map((order) => (
              <View key={order.id} style={styles.orderItem}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderName}>{order.name}</Text>
                  <Text style={styles.orderType}>{order.type}</Text>
                </View>
                <Text style={styles.orderAmount}>{order.amount}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Bottom Action Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity style={styles.viewOrdersButton} onPress={handleViewOrders}>
            <Ionicons name="list-outline" size={20} color="white" style={styles.buttonIcon} />
            <Text style={styles.viewOrdersText}>View all orders</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation Sidebar */}
      <Animated.View style={[styles.sidebar, { right: slideAnim }]}>
        <View style={styles.sidebarContent}>
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              <Ionicons name="person" size={30} color="#4682B4" />
            </View>
            <Text style={styles.profileName}>Driver Dashboard</Text>
            <Text style={styles.profileEmail}>{userEmail}</Text>
          </View>
          
          {/* Menu Items */}
          <View style={styles.menuList}>
            {['Profile', 'Earnings', 'Vehicle Info', 'Route Planner', 'Settings', 'Support'].map((item) => (
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

          {/* Bottom Sign Out Button */}
          <View style={styles.bottomButtons}>
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

const getResponsiveStyles = (screenDimensions: any, progressSize: number, responsivePadding: number, responsiveFontSize: any) => {
  const { width, height } = screenDimensions;
  const isSmallScreen = width < 400;
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f0f0f0',
    },
    mapBackground: {
      width: '100%',
      height: '100%',
      position: 'absolute',
    },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: responsivePadding,
      paddingTop: 50,
      paddingBottom: 10,
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
      shadowRadius: 4,
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
      shadowRadius: 4,
      elevation: 3,
    },
    statusTabs: {
      flexDirection: 'row',
      paddingHorizontal: responsivePadding,
      marginBottom: 20,
      gap: 10,
    },
    tab: {
      flex: 1,
      height: 35,
      borderRadius: 30,
      borderWidth: 1,
      borderColor: '#4682B4',
      backgroundColor: 'white',
      alignItems: 'center',
      justifyContent: 'center',
    },
    activeTab: {
      backgroundColor: '#4682B4',
    },
    tabText: {
      fontSize: responsiveFontSize.small,
      fontWeight: '500',
      color: '#4682B4',
    },
    activeTabText: {
      color: 'white',
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: responsivePadding,
      paddingBottom: 100,
    },
    progressContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      height: progressSize + 50,
      marginVertical: 20,
      position: 'relative',
    },
    progressRing: {
      position: 'absolute',
      borderRadius: progressSize / 2,
    },
    outerRing: {
      width: progressSize,
      height: progressSize,
      backgroundColor: 'rgba(70, 130, 180, 0.15)',
    },
    middleRing: {
      width: progressSize * 0.7,
      height: progressSize * 0.7,
      backgroundColor: 'rgba(70, 130, 180, 0.25)',
    },
    innerRing: {
      width: progressSize * 0.4,
      height: progressSize * 0.4,
      backgroundColor: 'rgba(70, 130, 180, 0.35)',
    },
    truckIcon: {
      position: 'absolute',
      top: progressSize * 0.2,
      right: progressSize * 0.2,
    },
    centerStats: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    totalEnergyText: {
      fontSize: responsiveFontSize.small,
      fontWeight: '600',
      color: '#333',
      marginBottom: 5,
    },
    earningsAmount: {
      fontSize: responsiveFontSize.large,
      fontWeight: '800',
      color: '#4682B4',
      marginBottom: 5,
    },
    deliveriesText: {
      fontSize: responsiveFontSize.small,
      color: '#666',
    },
    statsContainer: {
      marginVertical: 20,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 15,
      marginBottom: 15,
    },
    statCard: {
      flex: 1,
      backgroundColor: 'white',
      padding: 15,
      borderRadius: 15,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    statNumber: {
      fontSize: responsiveFontSize.regular,
      fontWeight: 'bold',
      color: '#4682B4',
      marginBottom: 5,
    },
    statLabel: {
      fontSize: responsiveFontSize.small,
      color: '#666',
    },
    divider: {
      height: 5,
      width: 60,
      backgroundColor: '#D9D9D9',
      borderRadius: 5,
      alignSelf: 'center',
      marginVertical: 20,
    },
    ordersPreview: {
      backgroundColor: 'white',
      borderRadius: 15,
      padding: 15,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    ordersTitle: {
      fontSize: responsiveFontSize.regular,
      fontWeight: '600',
      color: '#333',
      marginBottom: 15,
    },
    orderItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    orderInfo: {
      flex: 1,
    },
    orderName: {
      fontSize: responsiveFontSize.regular,
      fontWeight: '600',
      color: '#333',
      marginBottom: 2,
    },
    orderType: {
      fontSize: responsiveFontSize.small,
      color: '#666',
      textTransform: 'capitalize',
    },
    orderAmount: {
      fontSize: responsiveFontSize.regular,
      fontWeight: 'bold',
      color: '#4682B4',
    },
    bottomContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'white',
      paddingHorizontal: responsivePadding,
      paddingVertical: 20,
      paddingBottom: 30,
      borderTopWidth: 1,
      borderTopColor: '#f0f0f0',
    },
    viewOrdersButton: {
      backgroundColor: '#4682B4',
      borderRadius: 30,
      paddingVertical: 15,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#4682B4',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    buttonIcon: {
      marginRight: 8,
    },
    viewOrdersText: {
      color: 'white',
      fontSize: responsiveFontSize.regular,
      fontWeight: '600',
    },
    sidebar: {
      position: 'absolute',
      top: 0,
      width: Math.min(280, width * 0.8),
      height: '100%',
      backgroundColor: 'white',
      zIndex: 20,
      shadowColor: '#000',
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
    profileSection: {
      alignItems: 'center',
      marginBottom: 30,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    profileImageContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#f0f8ff',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    profileName: {
      fontSize: responsiveFontSize.regular,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 5,
    },
    profileEmail: {
      fontSize: responsiveFontSize.small,
      color: '#666',
    },
    menuList: {
      flex: 1,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 15,
      paddingHorizontal: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    menuItemText: {
      fontSize: responsiveFontSize.regular,
      color: '#333',
      fontWeight: '500',
    },
    bottomButtons: {
      paddingBottom: 30,
    },
    signOutButton: {
      backgroundColor: '#fff5f5',
      borderWidth: 1,
      borderColor: '#e74c3c',
      borderRadius: 25,
      paddingVertical: 12,
      alignItems: 'center',
    },
    signOutButtonText: {
      color: '#e74c3c',
      fontSize: responsiveFontSize.regular,
      fontWeight: '500',
    },
    menuOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      zIndex: 15,
    },
  });
};
