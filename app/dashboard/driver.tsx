import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Icons are assumed to be in components directory and are imported as default exports
import QRScannerIcon from '../../components/QRScannerIcon';
import SimpleArrowIcon from '../../components/SimpleArrowIcon';


export default function DriverDashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      setUserEmail(email || "driver@brillprime.com");
    } catch (error) {
      console.error("Error loading user data:", error);
    }
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

  const features = [
    { title: "Available Jobs", description: "Find deliveries", emoji: "📍", color: "#4682B4" },
    { title: "My Deliveries", description: "Current orders", emoji: "📦", color: "#f093fb" },
    { title: "Earnings", description: "Track your income", emoji: "💰", color: "#4facfe" },
    { title: "Route Planner", description: "Optimize your routes", emoji: "🗺️", color: "#ff7e5f" },
    { title: "Vehicle Info", description: "Manage your vehicle", emoji: "🚗", color: "#a8e6cf" },
    { title: "Help & Support", description: "Get assistance", emoji: "📞", color: "#ffd93d" }
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
          <Text style={styles.greeting}>Ready to Drive! 🚗</Text>
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
            <TouchableOpacity key={index} style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: feature.color }]}>
                <Text style={styles.featureEmoji}>{feature.emoji}</Text>
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
              <Text style={styles.statNumber}>8</Text>
              <Text style={styles.statLabel}>Deliveries</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>₹1,240</Text>
              <Text style={styles.statLabel}>Earnings</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>4.8⭐</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>

          <View style={styles.recentDeliveries}>
            <Text style={styles.sectionSubTitle}>Recent Deliveries</Text>
            <View style={styles.deliveryItem}>
              <Text style={styles.deliveryText}>Order #5678 - 2.5 km</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.deliveryStatusText}>Delivered</Text>
              </View>
            </View>
            <View style={styles.deliveryItem}>
              <Text style={styles.deliveryText}>Order #5677 - 1.8 km</Text>
              <View style={[styles.statusBadge, styles.inTransitBadge]}>
                <Text style={styles.deliveryStatusText}>In Transit</Text>
              </View>
            </View>
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