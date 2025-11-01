import React, { useEffect, useState, useRef, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions,
  Animated,
  StatusBar,
  ScrollView,
  FlatList
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAlert } from '../../components/AlertProvider';
import MapView, { PROVIDER_GOOGLE, Marker } from '../../components/Map';
import * as Location from 'expo-location';
import QRScannerIcon from '../../components/QRScannerIcon';
import SimpleArrowIcon from '../../components/SimpleArrowIcon';

const { width, height } = Dimensions.get('window');

export default function MerchantHome() {
  const router = useRouter();
  const { showConfirmDialog, showError, showSuccess, showInfo } = useAlert();
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("Merchant");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [merchantData, setMerchantData] = useState({
    userId: "MER123456",
    businessName: "Prime Merchant",
    category: "General Store",
    address: "Jahi, Abuja",
    status: "Open",
    activeOrders: 24,
    todaysSales: 45000,
    rating: 4.8
  });
  const slideAnim = useRef(new Animated.Value(-280)).current;
  const [region, setRegion] = useState({
    latitude: 9.0765, // Abuja, Nigeria
    longitude: 7.3986,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });
  const [recentOrders] = useState([
    { id: "ORD1234", customer: "John Doe", items: 2, status: "Processing" },
    { id: "ORD1233", customer: "Jane Smith", items: 1, status: "Delivered" },
    { id: "ORD1232", customer: "Alex Johnson", items: 3, status: "Cancelled" },
    { id: "ORD1231", customer: "Sarah Wilson", items: 1, status: "Processing" },
    { id: "ORD1230", customer: "Mike Brown", items: 4, status: "Delivered" },
  ]);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    loadUserData();
    loadCurrentLocation();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadUserData = useCallback(async () => {
    try {
      const [email, name] = await Promise.all([
        AsyncStorage.getItem("userEmail"),
        AsyncStorage.getItem("userName")
      ]);

      setUserEmail(email || "merchant@brillprime.com");
      setUserName(name || "Merchant");

      // Load notification count
      await loadNotificationCount();
    } catch (error) {
      console.error("Error loading user data:", error);
      setUserEmail("merchant@brillprime.com");
      setUserName("Merchant");
    } finally {
      setIsLoading(false);
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

  const loadCurrentLocation = async () => {
    try {
      const savedLocation = await AsyncStorage.getItem("userLocation");
      if (savedLocation && isMountedRef.current) {
        const location = JSON.parse(savedLocation);
        setRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } catch (error) {
      console.error("Error loading saved location:", error);
    }
  };

  const toggleMenu = useCallback(() => {
    const sidebarWidth = Math.min(280, width * 0.8);
    const toValue = isMenuOpen ? -sidebarWidth : 0;
    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsMenuOpen(!isMenuOpen);
  }, [isMenuOpen, slideAnim]);

  const handleMenuItemPress = useCallback((item: string) => {
    toggleMenu();
    setTimeout(() => {
      switch (item) {
        case "Dashboard":
          router.push("/dashboard/merchant");
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
        case "Switch to Consumer":
          router.push("/home/consumer");
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
          showSuccess("Signed Out", "You have been successfully signed out.");
        } catch (error) {
          console.error("Error signing out:", error);
          showError("Sign Out Error", "There was an error signing out. Please try again.");
        }
      }
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Processing":
        return "#FFA500";
      case "Delivered":
        return "#28A745";
      case "Cancelled":
        return "#DC3545";
      default:
        return "#666";
    }
  };

  const renderOrderItem = ({ item }: { item: any }) => (
    <View style={styles.orderItem}>
      <View style={styles.orderInfo}>
        <Text style={styles.orderId}>#{item.id}</Text>
        <Text style={styles.orderCustomer}>{item.customer} • {item.items} items</Text>
      </View>
      <Text style={[styles.orderStatus, { color: getStatusColor(item.status) }]}>
        {item.status}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="transparent" translucent />

      {/* Map Background */}
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
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
        >
          <Marker
            coordinate={{
              latitude: region.latitude,
              longitude: region.longitude,
            }}
            title={merchantData.businessName}
            description="Your business location"
          />
        </MapView>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.push('/dashboard/merchant')} 
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={20} color="#333" />
        </TouchableOpacity>

        <View style={styles.headerButtonsContainer}>
          <TouchableOpacity 
            onPress={() => router.push('/notifications')} 
            style={styles.headerButton}
          >
            <Ionicons name="notifications" size={20} color="#333" />
            {unreadNotifications > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadNotifications}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleMenu} style={styles.headerButton}>
            <Ionicons name="menu" size={20} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Merchant Info Card */}
      <View style={styles.merchantCard}>
        <View style={styles.merchantIcon}>
          <Ionicons name="business" size={20} color="white" />
        </View>
        <View style={styles.merchantInfo}>
          <Text style={styles.merchantName}>{merchantData.businessName}</Text>
          <Text style={styles.merchantAddress}>{merchantData.address}</Text>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{merchantData.activeOrders}</Text>
          <Text style={styles.statLabel}>Active Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>₦{(merchantData.todaysSales / 1000).toFixed(0)}K</Text>
          <Text style={styles.statLabel}>Today's Sales</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{merchantData.rating}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      {/* Recent Orders List */}
      <View style={styles.orderListContainer}>
        <Text style={styles.orderListTitle}>Recent Orders</Text>
        <FlatList
          data={recentOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          style={styles.orderList}
        />
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => router.push('/merchant/add-commodity')}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={[styles.navItem, styles.activeNavItem]}>
          <Ionicons name="home" size={24} color="#4682B4" />
          <Text style={[styles.navLabel, styles.activeNavLabel]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/orders/consumer-orders')}
        >
          <Ionicons name="receipt-outline" size={24} color="#666" />
          <Text style={styles.navLabel}>Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/merchant/commodities')}
        >
          <Ionicons name="grid-outline" size={24} color="#666" />
          <Text style={styles.navLabel}>Products</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/profile')}
        >
          <Ionicons name="person-outline" size={24} color="#666" />
          <Text style={styles.navLabel}>Account</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation Sidebar */}
      <Animated.View style={[styles.sidebar, { right: slideAnim }]}>
        <View style={styles.sidebarContent}>
          {/* Profile Section */}
          <View style={styles.sidebarProfile}>
            <View style={styles.sidebarProfileImage}>
              <Ionicons name="business" size={30} color="#4682B4" />
            </View>
            <Text style={styles.sidebarProfileName}>{merchantData.businessName}</Text>
            <Text style={styles.sidebarProfileEmail}>{userEmail}</Text>
          </View>

          {/* Menu Items */}
          <View style={styles.menuList}>
            {['Dashboard', 'Profile', 'Notifications', 'Settings', 'Support'].map((item) => (
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
              style={styles.switchButton} 
              onPress={() => handleMenuItemPress("Switch to Driver")}
            >
              <Text style={styles.switchButtonText}>Switch to Driver</Text>
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
  loadingText: {
    fontSize: 18,
    color: '#333',
    fontFamily: 'Montserrat-Medium',
  },
  mapContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
    zIndex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    position: 'relative', // Needed for badge positioning
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Montserrat-Bold',
  },
  merchantCard: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 10,
  },
  merchantIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#4682B4',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  merchantInfo: {
    flex: 1,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    fontFamily: 'Montserrat-SemiBold',
  },
  merchantAddress: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Montserrat-Regular',
  },
  statsContainer: {
    position: 'absolute',
    top: 200,
    left: 20,
    right: 20,
    flexDirection: 'row',
    gap: 10,
    zIndex: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4682B4',
    marginBottom: 5,
    fontFamily: 'Montserrat-Bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Montserrat-Regular',
  },
  orderListContainer: {
    position: 'absolute',
    top: 300,
    left: 20,
    right: 20,
    bottom: 120,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 3,
    zIndex: 10,
  },
  orderListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    paddingLeft: 5,
    fontFamily: 'Montserrat-SemiBold',
  },
  orderList: {
    flex: 1,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    fontFamily: 'Montserrat-Medium',
  },
  orderCustomer: {
    fontSize: 12,
    color: '#666',
    marginTop: 3,
    fontFamily: 'Montserrat-Regular',
  },
  orderStatus: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Montserrat-SemiBold',
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 30,
    width: 60,
    height: 60,
    backgroundColor: '#4682B4',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4682B4',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 10,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 10,
  },
  navItem: {
    alignItems: 'center',
  },
  activeNavItem: {
    // Active state styling
  },
  navLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontFamily: 'Montserrat-Regular',
  },
  activeNavLabel: {
    color: '#4682B4',
    fontWeight: '600',
    fontFamily: 'Montserrat-SemiBold',
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