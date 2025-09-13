import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, Animated, Image } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from '@expo/vector-icons';
import MapView, { PROVIDER_GOOGLE, Marker } from '../../components/Map';
import * as Location from 'expo-location';

// Get initial screen dimensions
const getScreenDimensions = () => Dimensions.get('window');

export default function ConsumerHome() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [screenDimensions, setScreenDimensions] = useState(getScreenDimensions());
  const slideAnim = useState(new Animated.Value(-280))[0];
  const [region, setRegion] = useState({
    latitude: 6.5244, // Default to Lagos, Nigeria coordinates
    longitude: 3.3792,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [nearbyMerchants] = useState([
    { id: 1, name: "Lagos Fuel Station", latitude: 6.5244, longitude: 3.3792, type: "fuel" },
    { id: 2, name: "Victoria Island Market", latitude: 6.4281, longitude: 3.4219, type: "market" },
    { id: 3, name: "Ikeja Shopping Mall", latitude: 6.5927, longitude: 3.3615, type: "shopping" },
  ]);

  useEffect(() => {
    loadUserData();
    
    // Listen for screen dimension changes (orientation, window resize)
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
      // Adjust sidebar animation value based on new screen width
      const sidebarWidth = Math.min(280, window.width * 0.8);
      slideAnim.setValue(isMenuOpen ? 0 : -sidebarWidth);
    });

    return () => subscription?.remove();
  }, []);

  const loadUserData = async () => {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      setUserEmail(email || "user@brillprime.com");
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const handleGoBack = () => {
    Alert.alert(
      "Go Back",
      "Are you sure you want to go back?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: () => router.back()
        }
      ]
    );
  };

  const handleSetLocationAutomatically = () => {
    Alert.alert(
      "Location Access",
      "Allow Brill Prime to access your location to find nearby merchants?",
      [
        { text: "Not Now", style: "cancel" },
        {
          text: "Allow",
          onPress: async () => {
            try {
              // Request location permissions
              let { status } = await Location.requestForegroundPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert("Permission Denied", "Location permission is required to find nearby merchants.");
                return;
              }

              // Get current location
              let location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              });
              
              const { latitude, longitude } = location.coords;
              setRegion({
                latitude,
                longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              });
              
              Alert.alert("Success!", "Location has been set automatically. You can now discover merchants near you.");
            } catch (error) {
              console.error("Error getting location:", error);
              Alert.alert("Error", "Unable to get your location. Please try again or set manually.");
            }
          }
        }
      ]
    );
  };

  const handleSetLocationLater = () => {
    Alert.alert(
      "Set Location Later",
      "You can set your location anytime from the settings to discover nearby merchants.",
      [{ text: "OK" }]
    );
  };

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

  const handleMenuItemPress = (item: string) => {
    toggleMenu();
    
    switch (item) {
      case "Account":
        // Future implementation
        Alert.alert("Coming Soon", "Account management feature will be available soon!");
        break;
      case "Notifications":
        // Future implementation
        Alert.alert("Coming Soon", "Notifications feature will be available soon!");
        break;
      case "Transaction History":
        // Future implementation
        Alert.alert("Coming Soon", "Transaction history feature will be available soon!");
        break;
      case "Order History":
        router.push("/orders/consumer-orders");
        break;
      case "Support":
        // Future implementation
        Alert.alert("Coming Soon", "Support feature will be available soon!");
        break;
      case "About":
        // Future implementation
        Alert.alert("Coming Soon", "About page will be available soon!");
        break;
      case "Switch to Merchant":
        Alert.alert("Switch Role", "This feature will allow you to switch to merchant mode!");
        break;
      default:
        Alert.alert("Navigation", `Navigating to ${item}`);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(["userToken", "userEmail", "userRole"]);
              router.replace("/");
            } catch (error) {
              console.error("Error signing out:", error);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Real Map Background */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.mapBackground}
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
        {nearbyMerchants.map((merchant) => (
          <Marker
            key={merchant.id}
            coordinate={{
              latitude: merchant.latitude,
              longitude: merchant.longitude,
            }}
            title={merchant.name}
            description={`${merchant.type} location`}
            pinColor={merchant.type === 'fuel' ? 'red' : merchant.type === 'market' ? 'green' : 'blue'}
          />
        ))}
      </MapView>
      
      {/* Back Button */}
      <View style={styles.backButtonContainer}>
        <TouchableOpacity 
          style={styles.backButtonCircle} 
          onPress={handleGoBack}
          activeOpacity={0.8}
        >
          <Image source={require('../../assets/images/back_arrow.svg')} style={{ width: 24, height: 24 }} resizeMode="contain" />
        </TouchableOpacity>
      </View>

      {/* Hamburger Menu Button */}
      <View style={styles.hamburgerButtonContainer}>
        <TouchableOpacity 
          style={styles.hamburgerButton} 
          onPress={toggleMenu}
          activeOpacity={0.8}
        >
          <Ionicons name={isMenuOpen ? "close" : "menu"} size={24} color="#666" />
        </TouchableOpacity>
      </View>
      
      {/* Navigation Sidebar */}
      <Animated.View style={[styles.sidebar, { right: slideAnim }]}>
        <View style={styles.sidebarContent}>
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              <Image source={require('../../assets/images/account_circle.svg')} style={{ width: 50, height: 50 }} resizeMode="contain" />
            </View>
            <Text style={styles.profileName}>Hi, ANTHONY</Text>
          </View>
          
          {/* Menu Items */}
          <View style={styles.menuList}>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => handleMenuItemPress("Account")}
            >
              <Text style={styles.menuItemText}>Account</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => handleMenuItemPress("Notifications")}
            >
              <Text style={styles.menuItemText}>Notifications</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => handleMenuItemPress("Transaction History")}
            >
              <Text style={styles.menuItemText}>Transaction History</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => handleMenuItemPress("Order History")}
            >
              <Text style={styles.menuItemText}>Order History</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => handleMenuItemPress("Support")}
            >
              <Text style={styles.menuItemText}>Support</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => handleMenuItemPress("About")}
            >
              <Text style={styles.menuItemText}>About</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Bottom Buttons */}
          <View style={styles.bottomButtons}>
            <TouchableOpacity 
              style={styles.merchantButton} 
              onPress={() => handleMenuItemPress("Switch to Merchant")}
            >
              <Text style={styles.merchantButtonText}>Switch to Merchant</Text>
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

      {/* Location Setup Modal */}
      <View style={styles.locationModal}>
        {/* Location Icon */}
        <View style={styles.locationIcon}>
          <View style={styles.locationIconInner}>
            <Image source={require('../../assets/images/globe_img.png')} style={{ width: 24, height: 24 }} resizeMode="contain" />
          </View>
        </View>
        
        {/* Modal Content */}
        <View style={styles.modalContent}>
          <Text style={styles.whereAreYouText}>Where are you?</Text>
          <Text style={styles.descriptionText}>
            Set your location so you can see merchants available around you
          </Text>
          
          {/* Button Container */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.setAutomaticallyBtn} 
              onPress={handleSetLocationAutomatically}
              activeOpacity={0.9}
            >
              <Text style={styles.setAutomaticallyText}>Set automatically</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.setLaterBtn} 
              onPress={handleSetLocationLater}
              activeOpacity={0.9}
            >
              <Text style={styles.setLaterText}>Set later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  mapBackground: {
    width: '100%',
    height: '53%',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  backButtonContainer: {
    width: 60,
    height: 60,
    position: 'absolute',
    left: 30,
    top: 60,
    zIndex: 10,
  },
  backButtonCircle: {
    width: 60,
    height: 60,
    backgroundColor: 'white',
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hamburgerButtonContainer: {
    width: 60,
    height: 60,
    position: 'absolute',
    right: 30,
    top: 60,
    zIndex: 10,
  },
  hamburgerButton: {
    width: 60,
    height: 60,
    backgroundColor: 'white',
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    width: Math.min(280, Dimensions.get('window').width * 0.8),
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
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
    fontWeight: '600',
  },
  bottomButtons: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  merchantButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#2f75c2',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  merchantButtonText: {
    color: '#2f75c2',
    fontSize: 16,
    fontWeight: '500',
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
  locationModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '47%',
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
    paddingHorizontal: '8%',
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: 'center',
  },
  locationIcon: {
    width: 100,
    height: 100,
    position: 'absolute',
    top: -50,
    backgroundColor: '#4682B4',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4682B4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  locationIconInner: {
    width: 40,
    height: 40,
    backgroundColor: 'white',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    alignItems: 'center',
    width: '100%',
    flex: 1,
    justifyContent: 'center',
  },
  whereAreYouText: {
    color: '#010E42',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 15,
    textAlign: 'center',
  },
  descriptionText: {
    color: 'black',
    fontSize: 15,
    fontWeight: '200',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 20,
  },
  setAutomaticallyBtn: {
    width: '100%',
    height: 52,
    backgroundColor: '#4682B4',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4682B4',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  setAutomaticallyText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '500',
  },
  setLaterBtn: {
    width: '100%',
    height: 52,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#4682B4',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setLaterText: {
    color: '#131313',
    fontSize: 20,
    fontWeight: '500',
  },
});