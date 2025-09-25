
import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAlert } from '../../components/AlertProvider';
import { useAuth } from '../../hooks/useAuth';
import { PerformanceOptimizer } from '../../utils/performance';

// Safe Map component with error boundary
const SafeMapComponent = React.memo(() => {
  const [mapError, setMapError] = useState(false);
  
  try {
    // Only import Map on native platforms or when specifically needed
    if (Platform.OS === 'web') {
      return (
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map" size={40} color="#4682B4" />
          <Text style={styles.mapPlaceholderText}>Map View</Text>
        </View>
      );
    }
    
    const Map = require('../../components/Map').default;
    return <Map style={styles.map} />;
  } catch (error) {
    console.warn('Map component failed to load:', error);
    return (
      <View style={styles.mapPlaceholder}>
        <Ionicons name="map" size={40} color="#4682B4" />
        <Text style={styles.mapPlaceholderText}>Map Unavailable</Text>
      </View>
    );
  }
});

const { width, height } = Dimensions.get('window');

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
    status: "Online"
  });
  
  const [stats, setStats] = useState({
    totalTrips: 234,
    activeOrders: 3,
    todaysEarnings: 45000,
    weeklyRating: 4.8,
    pendingNotifications: 1
  });
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useState(new Animated.Value(-280))[0];

  // Memoized values
  const sidebarWidth = useMemo(() => Math.min(280, width * 0.8), [width]);

  // Load data with error handling
  const loadUserData = useCallback(async () => {
    try {
      const cachedData = PerformanceOptimizer.getCache('driverData');
      if (cachedData) {
        setUserEmail(cachedData.email || "driver@brillprime.com");
        setDriverData(prev => ({ ...prev, ...cachedData.driver }));
        setStats(prev => ({ ...prev, ...cachedData.stats }));
        return;
      }

      const email = await AsyncStorage.getItem("userEmail");
      const driverName = await AsyncStorage.getItem("userName");
      const savedStats = await AsyncStorage.getItem("driverStats");
      
      setUserEmail(email || "driver@brillprime.com");
      
      if (driverName) {
        setDriverData(prev => ({ ...prev, name: driverName }));
      }
      
      if (savedStats) {
        setStats(JSON.parse(savedStats));
      }

      // Cache the data
      PerformanceOptimizer.setCache('driverData', {
        email: email || "driver@brillprime.com",
        driver: driverData,
        stats: savedStats ? JSON.parse(savedStats) : stats
      });
    } catch (error) {
      console.error("Error loading user data:", error);
      showError("Loading Error", "Failed to load some data. Please refresh.");
    }
  }, [driverData, stats, showError]);

  const loadDriverStats = useCallback(async () => {
    try {
      // Simulate API call with cached data
      const cachedStats = PerformanceOptimizer.getCache('driverStats');
      if (cachedStats) {
        setStats(cachedStats);
        return;
      }

      // In real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newStats = {
        totalTrips: 234,
        activeOrders: 3,
        todaysEarnings: 45000,
        weeklyRating: 4.8,
        pendingNotifications: 1
      };
      
      setStats(newStats);
      PerformanceOptimizer.setCache('driverStats', newStats);
    } catch (error) {
      console.error("Error loading driver stats:", error);
    }
  }, []);

  // Initialize data
  const initializeData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadUserData(),
        loadDriverStats(),
        checkAuth()
      ]);
    } catch (error) {
      console.error("Error initializing data:", error);
      showError("Initialization Error", "Failed to load app data. Please restart the app.");
    } finally {
      setIsLoading(false);
    }
  }, [loadUserData, loadDriverStats, checkAuth, showError]);

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Clear cache for fresh data
      PerformanceOptimizer.clearCache();
      await initializeData();
    } finally {
      setRefreshing(false);
    }
  }, [initializeData]);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  // Menu toggle with animation
  const toggleMenu = useCallback(() => {
    const toValue = isMenuOpen ? -sidebarWidth : 0;
    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsMenuOpen(!isMenuOpen);
  }, [isMenuOpen, slideAnim, sidebarWidth]);

  // Navigation handlers
  const handleGoBack = useCallback(() => {
    router.push('/dashboard/driver');
  }, [router]);

  const handleManageTrips = useCallback(() => {
    router.push('/orders/driver-orders');
  }, [router]);

  const handleViewEarnings = useCallback(() => {
    router.push('/transactions');
  }, [router]);

  const handleMenuItemPress = useCallback((item: string) => {
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
  }, [toggleMenu, router, showInfo]);

  const handleSignOut = useCallback(async () => {
    showConfirmDialog(
      "Sign Out",
      "Are you sure you want to sign out?",
      async () => {
        try {
          await AsyncStorage.multiRemove(["userToken", "userEmail", "userRole"]);
          PerformanceOptimizer.clearCache();
          router.replace("/");
          showSuccess("Signed Out", "You have been successfully signed out.");
        } catch (error) {
          console.error("Error signing out:", error);
          showError("Sign Out Error", "There was an error signing out. Please try again.");
        }
      }
    );
  }, [showConfirmDialog, showSuccess, showError, router]);

  const renderStars = useCallback((rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Ionicons key={i} name="star" size={16} color="#FFD700" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Ionicons key="half" name="star-half" size={16} color="#FFD700" />);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Ionicons key={`empty-${i}`} name="star-outline" size={16} color="#FFD700" />);
    }
    
    return stars;
  }, []);

  // Loading state
  if (authLoading || isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#4682B4" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Authentication check
  if (!isAuthenticated) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="lock-closed" size={64} color="#ccc" />
        <Text style={styles.errorText}>Please sign in to continue</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.replace('/auth/signin')}>
          <Text style={styles.retryText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
          <Ionicons name={isMenuOpen ? "close" : "menu"} size={30} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileCircle}>
            <Ionicons name="car" size={40} color="#4682B4" />
          </View>
          
          <Text style={styles.userId}>Driver ID: {driverData.userId}</Text>
          <Text style={styles.driverName}>{driverData.name}</Text>
          <Text style={styles.vehicleInfo}>{driverData.vehicle}</Text>
          
          <View style={styles.ratingSection}>
            <View style={styles.starsContainer}>
              {renderStars(driverData.rating)}
            </View>
            <Text style={styles.ratingText}>{driverData.rating}/5.0</Text>
          </View>
          
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={[styles.statusText, { color: '#4CAF50' }]}>{driverData.status}</Text>
          </View>
        </View>

        {/* Map Section */}
        <View style={styles.mapSection}>
          <Text style={styles.sectionTitle}>Current Location</Text>
          <SafeMapComponent />
        </View>

        {/* Stats Dashboard */}
        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>Today's Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalTrips}</Text>
              <Text style={styles.statLabel}>Total Trips</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.activeOrders}</Text>
              <Text style={styles.statLabel}>Active Orders</Text>
            </View>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>₦{(stats.todaysEarnings / 1000).toFixed(0)}K</Text>
              <Text style={styles.statLabel}>Today's Earnings</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.weeklyRating}</Text>
              <Text style={styles.statLabel}>Weekly Rating</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.manageTripsBtn} 
          onPress={handleManageTrips}
          activeOpacity={0.8}
        >
          <Ionicons name="car" size={20} color="white" />
          <Text style={styles.buttonText}>Manage Trips</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.viewEarningsBtn} 
          onPress={handleViewEarnings}
          activeOpacity={0.8}
        >
          <Ionicons name="wallet" size={20} color="white" />
          <Text style={styles.buttonText}>View Earnings</Text>
        </TouchableOpacity>
      </View>

      {/* Notification Badge */}
      {stats.pendingNotifications > 0 && (
        <TouchableOpacity 
          style={styles.notificationBadge}
          onPress={() => router.push('/notifications')}
        >
          <View style={styles.badgeCircle}>
            <Text style={styles.badgeNumber}>{stats.pendingNotifications}</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Navigation Sidebar */}
      <Animated.View style={[styles.sidebar, { right: slideAnim }]}>
        <View style={styles.sidebarContent}>
          {/* Profile Section */}
          <View style={styles.sidebarProfile}>
            <View style={styles.sidebarProfileImage}>
              <Ionicons name="car" size={30} color="#4682B4" />
            </View>
            <Text style={styles.sidebarProfileName}>{driverData.name}</Text>
            <Text style={styles.sidebarProfileEmail}>{userEmail}</Text>
          </View>
          
          {/* Menu Items */}
          <View style={styles.menuList}>
            {['Profile', 'Earnings', 'Settings', 'Support'].map((item) => (
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

          {/* Bottom Buttons */}
          <View style={styles.sidebarBottom}>
            <TouchableOpacity 
              style={styles.switchButton} 
              onPress={() => handleMenuItemPress("Switch to Consumer")}
            >
              <Text style={styles.switchButtonText}>Switch to Consumer</Text>
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
    backgroundColor: '#f8f9fa',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Montserrat-Regular',
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#e74c3c',
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#4682B4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: 'white',
    fontFamily: 'Montserrat-Medium',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  profileCircle: {
    width: 100,
    height: 100,
    backgroundColor: 'white',
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  userId: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
    fontFamily: 'Montserrat-Medium',
  },
  driverName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0B1A51',
    marginBottom: 5,
    fontFamily: 'Montserrat-Bold',
  },
  vehicleInfo: {
    fontSize: 14,
    fontWeight: '300',
    color: '#555',
    marginBottom: 15,
    fontFamily: 'Montserrat-Light',
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Montserrat-Regular',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Montserrat-Medium',
  },
  mapSection: {
    backgroundColor: 'white',
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    fontFamily: 'Montserrat-SemiBold',
  },
  map: {
    height: 200,
    borderRadius: 15,
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: '#f0f8ff',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  mapPlaceholderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4682B4',
    fontFamily: 'Montserrat-Medium',
  },
  statsSection: {
    backgroundColor: 'white',
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
    fontFamily: 'Montserrat-SemiBold',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#4682B4',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#4682B4',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
    fontFamily: 'Montserrat-Bold',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Montserrat-Regular',
  },
  actionButtons: {
    paddingHorizontal: 30,
    paddingVertical: 20,
    paddingBottom: 30,
    backgroundColor: 'white',
    gap: 12,
  },
  manageTripsBtn: {
    width: '100%',
    height: 54,
    borderRadius: 30,
    backgroundColor: '#4682B4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#4682B4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  viewEarningsBtn: {
    width: '100%',
    height: 54,
    borderRadius: 30,
    backgroundColor: '#0B1A51',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#0B1A51',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Montserrat-Medium',
  },
  notificationBadge: {
    position: 'absolute',
    right: 30,
    bottom: 150,
    zIndex: 10,
  },
  badgeCircle: {
    width: 24,
    height: 24,
    backgroundColor: '#D9D9D9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  badgeNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
    fontFamily: 'Montserrat-Bold',
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
  sidebarProfile: {
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 20,
  },
  sidebarProfileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  sidebarProfileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    fontFamily: 'Montserrat-Bold',
  },
  sidebarProfileEmail: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Montserrat-Regular',
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
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    fontFamily: 'Montserrat-Medium',
  },
  sidebarBottom: {
    paddingBottom: 30,
  },
  switchButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#2f75c2',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  switchButtonText: {
    color: '#2f75c2',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Montserrat-Medium',
  },
  signOutButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e74c3c',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Montserrat-Medium',
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
