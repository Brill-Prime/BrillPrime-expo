import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions, TextInput } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image'; // Use expo-image for better image handling
import * as Location from 'expo-location';
pop
const { width } = Dimensions.get('window');

type Merchant = {
  name: string;
  commodity: string;
  distance: string;
};

export default function ConsumerDashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [region, setRegion] = useState({
    latitude: 6.5244,
    longitude: 3.3792,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [showMap, setShowMap] = useState(false);

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

  const handleMenuPress = () => {
    Alert.alert(
      "Menu",
      "What would you like to do?",
      [
        { text: "Profile", onPress: () => console.log("Navigating to Profile...") },
        { text: "Settings", onPress: () => console.log("Navigating to Settings...") },
        { text: "Sign Out", onPress: handleSignOut, style: "destructive" },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const handleSetAutomatically = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Location permission is required to set your location automatically.');
      return;
    }
    let location = await Location.getCurrentPositionAsync({});
    setUserLocation({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
    setRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
    setShowMap(true);
  };

  // Dummy merchant data for demonstration
  useEffect(() => {
    setMerchants([
      { name: 'Merchant A', commodity: 'Fuel', distance: '1.2km' },
      { name: 'Merchant B', commodity: 'Food', distance: '2.5km' },
      { name: 'Merchant C', commodity: 'Water', distance: '0.8km' },
    ]);
  }, []);

  return (
    <View style={styles.container}>
      {/* Background Map - Use MapView if possible, else fallback to static image */}
      {showMap ? (
        <View style={{ flex: 1 }}>
          <MapView
            style={styles.mapImage}
            region={region}
            showsUserLocation={true}
          >
            {userLocation && (
              <Marker
                coordinate={userLocation}
                title="Your Location"
              />
            )}
          </MapView>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a commodity..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <ScrollView style={styles.merchantList}>
            {merchants
              .filter(m => m.commodity.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((m, idx) => (
                <View key={idx} style={styles.merchantItem}>
                  <Text style={styles.merchantName}>{m.name}</Text>
                  <Text style={styles.merchantCommodity}>{m.commodity}</Text>
                  <Text style={styles.merchantDistance}>{m.distance}</Text>
                </View>
              ))}
          </ScrollView>
        </View>
      ) : (
        // Fallback static image
        <Image
          style={styles.mapImage}
          source={require('../../assets/images/map_background.png')}
          contentFit="cover"
          transition={1000}
        />
      )}

      {/* Content Area */}
      <View style={styles.content}>
        <Image
          style={styles.locationIcon}
          source={require('../../assets/images/globe_img.png')}
        />
        <Text style={styles.title}>Where are you?</Text>
        <Text style={styles.description}>Set your location so you can see merchants available around you</Text>

        <TouchableOpacity style={styles.autoButton} onPress={handleSetAutomatically}>
          <Text style={styles.autoButtonText}>Set automatically</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.laterButton} onPress={() => router.push('/search')}>
          <Text style={styles.laterButtonText}>Set later</Text>
        </TouchableOpacity>
      </View>

      {/* Header Overlay */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.backButtonIcon}>&lt;</Text>
        </TouchableOpacity>
        <View style={styles.userInfo}>
          {/* Removed greeting text as requested */}
          <Text style={styles.email}>{userEmail}</Text>
        </View>
        {/* Functional Menu Bar */}
        <View style={styles.menuBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
            <TouchableOpacity style={styles.menuButton} onPress={() => router.push('/profile')}>
              <Ionicons name="person" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuButton} onPress={() => router.push('/settings')}>
              <Ionicons name="settings" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuButton} onPress={handleSignOut}>
              <Ionicons name="log-out" size={24} color="white" />
            </TouchableOpacity>
            {/* Add more menu buttons here as needed */}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapImage: {
    ...StyleSheet.absoluteFillObject,
    height: 474,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 483,
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    paddingHorizontal: 30,
    paddingTop: 80,
    alignItems: 'center',
  },
  locationIcon: {
    position: 'absolute',
    top: -50,
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2c3e50',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    fontWeight: '300',
    color: '#000',
    textAlign: 'center',
    marginBottom: 30,
  },
  autoButton: {
    width: 256,
    height: 48,
    backgroundColor: '#667eea',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  autoButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '500',
  },
  laterButton: {
    width: 256,
    height: 48,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#7f8c8d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  laterButtonText: {
    color: '#2c3e50',
    fontSize: 20,
    fontWeight: '500',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backButtonIcon: {
    fontSize: 24,
    color: '#000',
    top: -2,
  },
  userInfo: {
    alignItems: 'flex-start',
    flex: 1,
    marginLeft: 10,
  },
  email: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  menuBar: {
    flexDirection: "row",
    alignItems: "center",
    width: 200, // Increased width for better fit
    justifyContent: 'flex-end',
  },
  menuButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  searchContainer: {
    position: 'absolute',
    top: 480,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 2,
  },
  searchInput: {
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 20,
    fontSize: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  merchantList: {
    position: 'absolute',
    top: 540,
    left: 0,
    right: 0,
    maxHeight: 200,
    paddingHorizontal: 20,
  },
  merchantItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  merchantName: {
    fontWeight: '700',
    fontSize: 16,
    color: '#333',
  },
  merchantCommodity: {
    fontSize: 14,
    color: '#555',
  },
  merchantDistance: {
    fontSize: 12,
    color: '#888',
  },
});
