import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions, TextInput } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get('window');

type Merchant = {
  name: string;
  commodity: string;
  distance: string;
  rating: number;
};

export default function ConsumerHome() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [merchants, setMerchants] = useState<Merchant[]>([]);

  useEffect(() => {
    loadUserData();
    loadMerchants();
  }, []);

  const loadUserData = async () => {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      setUserEmail(email || "user@brillprime.com");
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const loadMerchants = () => {
    // Sample merchant data
    setMerchants([
      { name: 'FreshMart Store', commodity: 'Groceries', distance: '0.5km', rating: 4.8 },
      { name: 'Tech Hub Electronics', commodity: 'Electronics', distance: '1.2km', rating: 4.6 },
      { name: 'Fashion Plaza', commodity: 'Clothing', distance: '0.8km', rating: 4.7 },
      { name: 'QuickBite Restaurant', commodity: 'Food & Dining', distance: '0.3km', rating: 4.9 },
      { name: 'Wellness Pharmacy', commodity: 'Healthcare', distance: '1.5km', rating: 4.5 },
      { name: 'AutoCare Services', commodity: 'Automotive', distance: '2.0km', rating: 4.4 },
    ]);
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

  const handleMerchantPress = (merchant: Merchant) => {
    Alert.alert(
      merchant.name,
      `Category: ${merchant.commodity}\nDistance: ${merchant.distance}\nRating: ${merchant.rating}/5.0`,
      [
        { text: "View Details", onPress: () => console.log("View merchant details") },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const filteredMerchants = merchants.filter(merchant =>
    merchant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    merchant.commodity.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Welcome Back! 👋</Text>
            <Text style={styles.email}>{userEmail}</Text>
          </View>
          <TouchableOpacity style={styles.menuButton} onPress={handleSignOut}>
            <Ionicons name="menu-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <Text style={styles.sectionTitle}>Find Nearby Merchants</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search merchants or categories..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionScroll}>
          {[
            { icon: "storefront-outline", label: "All Stores", color: "#667eea" },
            { icon: "restaurant-outline", label: "Food", color: "#f093fb" },
            { icon: "car-outline", label: "Transport", color: "#4facfe" },
            { icon: "medical-outline", label: "Health", color: "#a8e6cf" },
            { icon: "shirt-outline", label: "Fashion", color: "#ffd93d" },
            { icon: "phone-portrait-outline", label: "Tech", color: "#ff7e5f" },
          ].map((action, index) => (
            <TouchableOpacity key={index} style={styles.actionButton}>
              <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                <Ionicons name={action.icon as any} size={24} color="white" />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Merchants List */}
      <View style={styles.merchantsSection}>
        <Text style={styles.sectionTitle}>Nearby Merchants</Text>
        <ScrollView style={styles.merchantsList} showsVerticalScrollIndicator={false}>
          {filteredMerchants.map((merchant, index) => (
            <TouchableOpacity
              key={index}
              style={styles.merchantCard}
              onPress={() => handleMerchantPress(merchant)}
            >
              <View style={styles.merchantInfo}>
                <Text style={styles.merchantName}>{merchant.name}</Text>
                <Text style={styles.merchantCategory}>{merchant.commodity}</Text>
                <View style={styles.merchantDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="location-outline" size={14} color="#6B7280" />
                    <Text style={styles.detailText}>{merchant.distance}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.detailText}>{merchant.rating}</Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  searchSection: {
    padding: 20,
    backgroundColor: "white",
    marginHorizontal: 16,
    marginTop: -10,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
  },
  quickActions: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  actionScroll: {
    paddingVertical: 8,
  },
  actionButton: {
    alignItems: "center",
    marginRight: 16,
    width: 70,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    textAlign: "center",
  },
  merchantsSection: {
    flex: 1,
    padding: 16,
  },
  merchantsList: {
    flex: 1,
  },
  merchantCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  merchantInfo: {
    flex: 1,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  merchantCategory: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  merchantDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  detailText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },
});