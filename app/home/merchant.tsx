import React, { useEffect, useState, useRef } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  Animated,
  StatusBar,
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
    userId: "23 AD647",
    companyName: "Total Energy",
    status: "Available"
  });
  const [activeTab, setActiveTab] = useState("Available");
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
    showInfo("Status Updated", `You are now ${tab.toLowerCase()}`);
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

      {/* Full Screen Map */}
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
          title="Your Location"
        />
      </MapView>

      {/* Menu Button */}
      <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
        <View style={styles.menuLine} />
        <View style={styles.menuLine} />
        <View style={styles.menuLine} />
      </TouchableOpacity>

      {/* Status Tabs */}
      <View style={styles.tabsContainer}>
        {["Available", "On delivery", "Off duty"].map((tab) => (
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

      {/* Circular Progress Container */}
      <View style={styles.progressContainer}>
        <View style={styles.progressRingOuter} />
        <View style={styles.progressRingMiddle} />
        <View style={styles.progressRingInner} />

        {/* Truck Icon */}
        <View style={styles.truckIconContainer}>
          <Ionicons name="car" size={32} color="#4682B4" />
        </View>
      </View>

      {/* Company Name */}
      <Text style={styles.companyName}>Total Energy</Text>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Bottom Button */}
      <TouchableOpacity style={styles.bottomButton} onPress={handleViewOrders}>
        <Ionicons name="cube-outline" size={20} color="white" style={styles.packageIcon} />
        <Text style={styles.bottomButtonText}>View orders</Text>
      </TouchableOpacity>

      {/* Navigation Sidebar */}
      <Animated.View style={[styles.sidebar, { right: slideAnim }]}>
        <View style={styles.sidebarContent}>
          {/* Profile Section */}
          <View style={styles.sidebarProfile}>
            <View style={styles.sidebarProfileImage}>
              <Ionicons name="business" size={30} color="#4682B4" />
            </View>
            <Text style={styles.sidebarProfileName}>{merchantData.companyName}</Text>
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
  },
  map: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  loadingText: {
    fontSize: 18,
    color: '#333',
    fontFamily: 'Montserrat-Medium',
  },
  menuButton: {
    position: 'absolute',
    left: 15,
    top: 60,
    width: 24,
    height: 24,
    zIndex: 10,
    justifyContent: 'space-between',
  },
  menuLine: {
    width: '100%',
    height: 2,
    backgroundColor: '#333',
  },
  tabsContainer: {
    position: 'absolute',
    left: 15,
    top: 120,
    flexDirection: 'row',
    gap: 10,
    zIndex: 10,
  },
  tab: {
    width: 120,
    height: 35,
    borderRadius: 30,
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
  progressContainer: {
    position: 'absolute',
    left: width * 0.13,
    top: height * 0.33,
    width: width * 0.85,
    height: width * 0.85,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  progressRingOuter: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: width * 0.425,
    backgroundColor: 'rgba(70, 130, 180, 0.25)',
  },
  progressRingMiddle: {
    position: 'absolute',
    width: '62%',
    height: '62%',
    borderRadius: width * 0.264,
    backgroundColor: 'rgba(70, 130, 180, 0.5)',
  },
  progressRingInner: {
    position: 'absolute',
    width: '24%',
    height: '24%',
    borderRadius: width * 0.102,
    backgroundColor: 'rgba(70, 130, 180, 0.75)',
  },
  truckIconContainer: {
    position: 'absolute',
    transform: [{ rotate: '-47deg' }],
  },
  companyName: {
    position: 'absolute',
    left: 45,
    top: height * 0.56,
    fontSize: 8,
    fontWeight: '600',
    color: 'black',
    zIndex: 10,
    fontFamily: 'Montserrat-SemiBold',
  },
  divider: {
    position: 'absolute',
    left: width * 0.43,
    top: height * 0.62,
    width: 60,
    height: 5,
    backgroundColor: '#D9D9D9',
    borderRadius: 5,
    zIndex: 10,
  },
  bottomButton: {
    position: 'absolute',
    left: 30,
    bottom: 60,
    width: width - 60,
    height: 54,
    backgroundColor: '#4682B4',
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    gap: 10,
  },
  bottomButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Montserrat-Regular',
  },
  packageIcon: {
    marginRight: 5,
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