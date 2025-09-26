
import React, { useEffect, useState, useRef } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions,
  Animated,
  StatusBar,
  ScrollView,
  Image
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAlert } from '../../components/AlertProvider';
import MapView, { PROVIDER_GOOGLE, Marker } from '../../components/Map';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

export default function MerchantHome() {
  const router = useRouter();
  const { showConfirmDialog, showError, showSuccess, showInfo } = useAlert();
  const [userEmail, setUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [merchantData, setMerchantData] = useState({
    userId: "MER123456",
    businessName: "Total Energy Station",
    category: "Fuel Station",
    status: "Open",
    todaysOrders: 12,
    pendingOrders: 3,
    revenue: 156000
  });
  const [activeTab, setActiveTab] = useState("Open");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-280)).current;
  const [region, setRegion] = useState({
    latitude: 9.0765, // Abuja, Nigeria
    longitude: 7.3986,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    loadUserData();
    loadCurrentLocation();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadUserData = async () => {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      setUserEmail(email || "merchant@brillprime.com");
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading user data:", error);
      setIsLoading(false);
    }
  };

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

  const toggleMenu = () => {
    const sidebarWidth = Math.min(280, width * 0.8);
    const toValue = isMenuOpen ? -sidebarWidth : 0;
    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleTabPress = (tab: string) => {
    setActiveTab(tab);
    setMerchantData(prev => ({ ...prev, status: tab }));
    showInfo("Status Updated", `Your business is now ${tab.toLowerCase()}`);
  };

  const handleViewOrders = () => {
    router.push('/orders/consumer-orders');
  };

  const handleManageCommodities = () => {
    router.push('/merchant/commodities');
  };

  const handleViewAnalytics = () => {
    router.push('/transactions');
  };

  const handleMenuItemPress = (item: string) => {
    toggleMenu();

    switch (item) {
      case "Profile":
        router.push("/profile");
        break;
      case "Analytics":
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
      case "Switch to Driver":
        router.push("/home/driver");
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

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Merchant Dashboard</Text>
        
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#333" />
          {merchantData.pendingOrders > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>{merchantData.pendingOrders}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Business Info Card */}
        <View style={styles.businessCard}>
          <View style={styles.businessIcon}>
            <Ionicons name="business" size={40} color="#4682B4" />
          </View>
          <View style={styles.businessInfo}>
            <Text style={styles.businessName}>{merchantData.businessName}</Text>
            <Text style={styles.businessCategory}>{merchantData.category}</Text>
            <Text style={styles.businessId}>ID: {merchantData.userId}</Text>
          </View>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { 
              backgroundColor: activeTab === "Open" ? '#4CAF50' : '#f44336' 
            }]} />
            <Text style={[styles.statusText, {
              color: activeTab === "Open" ? '#4CAF50' : '#f44336'
            }]}>{activeTab}</Text>
          </View>
        </View>

        {/* Status Tabs */}
        <View style={styles.tabsContainer}>
          {["Open", "Closed", "Busy"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab ? styles.activeTab : styles.inactiveTab
              ]}
              onPress={() => handleTabPress(tab)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab ? styles.activeTabText : styles.inactiveTabText
              ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{merchantData.todaysOrders}</Text>
              <Text style={styles.statLabel}>Today's Orders</Text>
              <Ionicons name="receipt-outline" size={24} color="#4682B4" />
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{merchantData.pendingOrders}</Text>
              <Text style={styles.statLabel}>Pending Orders</Text>
              <Ionicons name="time-outline" size={24} color="#FF9500" />
            </View>
          </View>
          <View style={styles.revenueCard}>
            <Text style={styles.revenueLabel}>Today's Revenue</Text>
            <Text style={styles.revenueAmount}>₦{merchantData.revenue.toLocaleString()}</Text>
            <Ionicons name="trending-up" size={28} color="#4CAF50" />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={handleViewOrders}>
              <Ionicons name="cube-outline" size={32} color="#4682B4" />
              <Text style={styles.actionText}>View Orders</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={handleManageCommodities}>
              <Ionicons name="grid-outline" size={32} color="#4682B4" />
              <Text style={styles.actionText}>Manage Products</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={handleViewAnalytics}>
              <Ionicons name="analytics-outline" size={32} color="#4682B4" />
              <Text style={styles.actionText}>Analytics</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/profile/edit')}>
              <Ionicons name="settings-outline" size={32} color="#4682B4" />
              <Text style={styles.actionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Map Section */}
        <View style={styles.mapSection}>
          <Text style={styles.sectionTitle}>Business Location</Text>
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
      </ScrollView>

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
            {['Profile', 'Analytics', 'Settings', 'Support'].map((item) => (
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuButton: {
    width: 24,
    height: 24,
    justifyContent: 'space-between',
  },
  menuLine: {
    width: '100%',
    height: 2,
    backgroundColor: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Montserrat-SemiBold',
  },
  notificationButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Montserrat-Bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  businessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  businessIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    fontFamily: 'Montserrat-SemiBold',
  },
  businessCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
    fontFamily: 'Montserrat-Regular',
  },
  businessId: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Montserrat-Regular',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Montserrat-Medium',
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    height: 45,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#4682B4',
  },
  inactiveTab: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#4682B4',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Montserrat-Medium',
  },
  activeTabText: {
    color: 'white',
  },
  inactiveTabText: {
    color: '#4682B4',
  },
  statsContainer: {
    marginBottom: 25,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    fontFamily: 'Montserrat-Bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Montserrat-Regular',
  },
  revenueCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  revenueLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Montserrat-Regular',
  },
  revenueAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    fontFamily: 'Montserrat-Bold',
  },
  quickActions: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    fontFamily: 'Montserrat-SemiBold',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionCard: {
    width: (width - 50) / 2,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    fontSize: 14,
    color: '#333',
    marginTop: 10,
    textAlign: 'center',
    fontFamily: 'Montserrat-Medium',
  },
  mapSection: {
    marginBottom: 20,
  },
  map: {
    height: 200,
    borderRadius: 15,
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
