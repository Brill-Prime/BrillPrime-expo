import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";


export default function DriverDashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [todayStats, setTodayStats] = useState({ deliveries: 0, earnings: 0, rating: 0 });

  useEffect(() => {
    loadUserData();
    fetchDriverData();
  }, []);

  const loadUserData = async () => {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      setUserEmail(email || "driver@brillprime.com");
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const fetchDriverData = async () => {
    // Placeholder for fetching real data
    // In a real app, this would involve API calls
    setAvailableOrders([
      { id: 'order123', customer: 'John Doe', distance: '2.5 km', status: 'Pending' },
      { id: 'order124', customer: 'Jane Smith', distance: '1.8 km', status: 'Pending' },
    ]);
    setActiveOrders([
      { id: 'order456', customer: 'Alice Brown', distance: '3.1 km', status: 'In Transit' },
    ]);
    setTodayStats({ deliveries: 8, earnings: 1240, rating: 4.8 });
  };

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline);
    Alert.alert(
      isOnline ? "Going Offline" : "Going Online",
      isOnline ? "You're now offline and won't receive new delivery requests." : "You're now online and ready to receive delivery requests!"
    );
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

  const handleFeaturePress = (feature: string) => {
    switch (feature) {
      case 'Available Jobs':
        router.push('/orders/driver-orders');
        break;
      case 'My Deliveries':
        if (activeOrders.length > 0) {
          router.push({
            pathname: '/orders/order-tracking',
            params: { orderId: activeOrders[0].id }
          });
        } else {
          Alert.alert('No Active Orders', 'You don\'t have any active deliveries.');
        }
        break;
      case 'Earnings':
        router.push('/driver/earnings-details');
        break;
      case 'Route Planner':
        if (activeOrders.length > 0) {
          router.push({
            pathname: '/orders/order-tracking',
            params: { orderId: activeOrders[0].id }
          });
        } else {
          Alert.alert('No Active Orders', 'You don\'t have any active deliveries to plan a route for.');
        }
        break;
      case 'Vehicle Info':
        router.push('/driver/vehicle-management');
        break;
      case 'Help & Support':
        router.push('/support');
        break;
      default:
        Alert.alert('Feature', `Opening ${feature}...`);
    }
  };

  const features = [
    { id: 'available-orders', title: "Available Jobs", description: "Find deliveries", icon: "location" as const, color: "#4682B4", route: "/orders/driver-orders" },
    { id: 'my-deliveries', title: "My Deliveries", description: "Current orders", icon: "cube" as const, color: "#f093fb", route: "/orders/driver-orders" },
    { id: 'earnings', title: "Earnings", description: "Track your income", icon: "cash" as const, color: "#4facfe", route: "/driver/earnings-details" },
    { id: 'navigation', title: "Route Planner", description: "Optimize your routes", icon: "map" as const, color: "#ff7e5f", route: "/store-locator" },
    { id: 'vehicle-info', title: "Vehicle Info", description: "Manage your vehicle", icon: "car" as const, color: "#a8e6cf", route: "/profile/vehicle" },
    { id: 'support', title: "Help & Support", description: "Get assistance", icon: "headset" as const, color: "#ffd93d", route: "/support" }
  ];

  return (
    <LinearGradient
      colors={['#0B1A51', '#1e3a8a']}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/home/consumer')}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.greeting}>Ready to Drive! </Text>
            <Ionicons name="car-sport" size={24} color="white" />
          </View>
          <Text style={styles.email}>{userEmail}</Text>
        </View>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statusContainer}>
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>Driver Status</Text>
            <TouchableOpacity
              style={[styles.statusToggle, isOnline && styles.onlineToggle]}
              onPress={toggleOnlineStatus}
            >
              <View style={[styles.toggleCircle, isOnline && styles.onlineCircle]} />
            </TouchableOpacity>
            <Text style={[styles.statusText, isOnline && styles.onlineText]}>
              {isOnline ? "ONLINE" : "OFFLINE"}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Your Dashboard</Text>

        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <TouchableOpacity
              key={index}
              style={styles.featureCard}
              onPress={() => handleFeaturePress(feature.title)}
            >
              <View style={[styles.featureIcon, { backgroundColor: feature.color }]}>
                <Ionicons name={feature.icon} size={32} color="white" />
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Today's Summary</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{todayStats.deliveries}</Text>
              <Text style={styles.statLabel}>Deliveries</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>₹{todayStats.earnings.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Earnings</Text>
            </View>
            <View style={styles.statCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.statNumber}>{todayStats.rating.toFixed(1)} </Text>
                <Ionicons name="star" size={20} color="#FFD700" />
              </View>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>

          <View style={styles.recentDeliveries}>
            <Text style={styles.sectionSubTitle}>Recent Deliveries</Text>
            {activeOrders.length > 0 ? activeOrders.map((order, index) => (
              <View key={index} style={styles.deliveryItem}>
                <Text style={styles.deliveryText}>Order #{order.id} - {order.distance}</Text>
                <View style={[styles.statusBadge, order.status === 'In Transit' ? styles.inTransitBadge : null]}>
                  <Text style={styles.deliveryStatusText}>{order.status}</Text>
                </View>
              </View>
            )) : (
              <Text style={{ textAlign: 'center', color: '#7f8c8d' }}>No active deliveries.</Text>
            )}
             {availableOrders.length > 0 && (
              <View style={styles.deliveryItem}>
                <Text style={styles.deliveryText}>New Order Available: #{availableOrders[0].id}</Text>
                <View style={[styles.statusBadge, {backgroundColor: '#ffd93d'}]}>
                  <Text style={styles.deliveryStatusText}>New</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    marginRight: 15,
    paddingVertical: 8,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  headerTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  email: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  signOutButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  signOutText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  content: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  statusContainer: {
    marginBottom: 30,
  },
  statusCard: {
    backgroundColor: "white",
    padding: 25,
    borderRadius: 25,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#4682B4",
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 15,
  },
  statusToggle: {
    width: 60,
    height: 30,
    backgroundColor: "#e9ecef",
    borderRadius: 15,
    justifyContent: "center",
    marginBottom: 10,
  },
  onlineToggle: {
    backgroundColor: "#4682B4",
  },
  toggleCircle: {
    width: 26,
    height: 26,
    backgroundColor: "white",
    borderRadius: 13,
    marginLeft: 2,
  },
  onlineCircle: {
    marginLeft: 32,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#7f8c8d",
  },
  onlineText: {
    color: "#4682B4",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 20,
  },
  sectionSubTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 15,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
    marginBottom: 30,
  },
  featureCard: {
    width: "47%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 25,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#4682B4",
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 5,
  },
  featureDescription: {
    fontSize: 12,
    color: "#7f8c8d",
    textAlign: "center",
  },
  statsContainer: {
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    padding: 15,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#4682B4",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4682B4",
  },
  statLabel: {
    fontSize: 12,
    color: "#2c3e50",
    marginTop: 2,
  },
  recentDeliveries: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#4682B4",
  },
  deliveryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  deliveryText: {
    fontSize: 14,
    color: "#2c3e50",
    fontWeight: "500",
  },
  statusBadge: {
    backgroundColor: "#a8e6cf",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  inTransitBadge: {
    backgroundColor: "#ffd93d",
  },
  deliveryStatusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2c3e50",
  },
});