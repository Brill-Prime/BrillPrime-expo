import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, Animated } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from '@expo/vector-icons';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

export default function ConsumerHome() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useState(new Animated.Value(-250))[0];
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
    const toValue = isMenuOpen ? -250 : 0;
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
      case "Dashboard":
        router.push("/dashboard/consumer");
        break;
      case "Orders":
        // Future implementation
        Alert.alert("Coming Soon", "Orders feature will be available soon!");
        break;
      case "Favorites":
        // Future implementation
        Alert.alert("Coming Soon", "Favorites feature will be available soon!");
        break;
      case "Profile":
        // Future implementation
        Alert.alert("Coming Soon", "Profile feature will be available soon!");
        break;
      case "Settings":
        // Future implementation
        Alert.alert("Coming Soon", "Settings feature will be available soon!");
        break;
      case "Support":
        // Future implementation
        Alert.alert("Coming Soon", "Support feature will be available soon!");
        break;
      default:
        Alert.alert("Navigation", `Navigating to ${item}`);
    }
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
          <Ionicons name="chevron-back" size={24} color="#666" />
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
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>Navigation</Text>
            <Text style={styles.sidebarEmail}>{userEmail}</Text>
          </View>
          
          <View style={styles.sidebarMenuItems}>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => handleMenuItemPress("Dashboard")}
            >
              <Ionicons name="home-outline" size={20} color="#4682B4" />
              <Text style={styles.menuItemText}>Dashboard</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => handleMenuItemPress("Orders")}
            >
              <Ionicons name="receipt-outline" size={20} color="#4682B4" />
              <Text style={styles.menuItemText}>My Orders</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => handleMenuItemPress("Favorites")}
            >
              <Ionicons name="heart-outline" size={20} color="#4682B4" />
              <Text style={styles.menuItemText}>Favorites</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => handleMenuItemPress("Profile")}
            >
              <Ionicons name="person-outline" size={20} color="#4682B4" />
              <Text style={styles.menuItemText}>Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => handleMenuItemPress("Settings")}
            >
              <Ionicons name="settings-outline" size={20} color="#4682B4" />
              <Text style={styles.menuItemText}>Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => handleMenuItemPress("Support")}
            >
              <Ionicons name="help-circle-outline" size={20} color="#4682B4" />
              <Text style={styles.menuItemText}>Support</Text>
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
            <Ionicons name="location" size={24} color="#4682B4" />
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
    width: width,
    height: height * 0.53,
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
    width: 250,
    height: height,
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
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  sidebarHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 20,
    marginBottom: 30,
  },
  sidebarTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4682B4',
    marginBottom: 5,
  },
  sidebarEmail: {
    fontSize: 14,
    color: '#666',
  },
  sidebarMenuItems: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 5,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
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
    height: height * 0.54,
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
    paddingHorizontal: 30,
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
    width: 268,
    gap: 20,
  },
  setAutomaticallyBtn: {
    width: 268,
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
    width: 268,
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