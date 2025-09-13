import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Dimensions 
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get('window');

// Mock data for merchants and commodities
const MOCK_MERCHANTS = [
  { id: 1, name: "Lagos Fuel Station", type: "fuel", location: "Victoria Island, Lagos", distance: "2.3 km", rating: 4.5 },
  { id: 2, name: "Victoria Island Market", type: "market", location: "Victoria Island, Lagos", distance: "1.8 km", rating: 4.2 },
  { id: 3, name: "Ikeja Shopping Mall", type: "shopping", location: "Ikeja, Lagos", distance: "5.1 km", rating: 4.7 },
  { id: 4, name: "Lekki Phase 1 Fuel", type: "fuel", location: "Lekki, Lagos", distance: "4.2 km", rating: 4.3 },
  { id: 5, name: "Computer Village", type: "electronics", location: "Ikeja, Lagos", distance: "6.8 km", rating: 4.1 },
  { id: 6, name: "Palms Shopping Mall", type: "shopping", location: "Lekki, Lagos", distance: "3.9 km", rating: 4.6 },
];

const MOCK_COMMODITIES = [
  { id: 1, name: "Premium Petrol", category: "fuel", merchants: ["Lagos Fuel Station", "Lekki Phase 1 Fuel"], price: "₦650/L" },
  { id: 2, name: "Fresh Tomatoes", category: "food", merchants: ["Victoria Island Market"], price: "₦800/kg" },
  { id: 3, name: "Rice (50kg)", category: "food", merchants: ["Victoria Island Market"], price: "₦45,000" },
  { id: 4, name: "iPhone 15", category: "electronics", merchants: ["Computer Village", "Palms Shopping Mall"], price: "₦1,200,000" },
  { id: 5, name: "Samsung TV 55\"", category: "electronics", merchants: ["Computer Village", "Palms Shopping Mall"], price: "₦650,000" },
  { id: 6, name: "Diesel", category: "fuel", merchants: ["Lagos Fuel Station"], price: "₦750/L" },
];

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"merchants" | "commodities">("merchants");
  const [filteredMerchants, setFilteredMerchants] = useState(MOCK_MERCHANTS);
  const [filteredCommodities, setFilteredCommodities] = useState(MOCK_COMMODITIES);
  const [userLocation, setUserLocation] = useState("Lagos, Nigeria");

  useEffect(() => {
    loadUserLocation();
  }, []);

  useEffect(() => {
    filterResults();
  }, [searchQuery, activeTab]);

  const loadUserLocation = async () => {
    try {
      const savedAddress = await AsyncStorage.getItem("userAddress");
      if (savedAddress) {
        setUserLocation(savedAddress);
      }
    } catch (error) {
      console.error("Error loading user location:", error);
    }
  };

  const filterResults = () => {
    const query = searchQuery.toLowerCase().trim();
    
    if (activeTab === "merchants") {
      if (query === "") {
        setFilteredMerchants(MOCK_MERCHANTS);
      } else {
        const filtered = MOCK_MERCHANTS.filter(merchant =>
          merchant.name.toLowerCase().includes(query) ||
          merchant.type.toLowerCase().includes(query) ||
          merchant.location.toLowerCase().includes(query)
        );
        setFilteredMerchants(filtered);
      }
    } else {
      if (query === "") {
        setFilteredCommodities(MOCK_COMMODITIES);
      } else {
        const filtered = MOCK_COMMODITIES.filter(commodity =>
          commodity.name.toLowerCase().includes(query) ||
          commodity.category.toLowerCase().includes(query) ||
          commodity.merchants.some(merchant => merchant.toLowerCase().includes(query))
        );
        setFilteredCommodities(filtered);
      }
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleMerchantPress = (merchant: any) => {
    // Navigate to merchant detail page
    router.push(`/merchant/${merchant.id}`);
  };

  const handleCommodityPress = (commodity: any) => {
    Alert.alert(
      commodity.name,
      `Category: ${commodity.category}\nPrice: ${commodity.price}\nAvailable at: ${commodity.merchants.join(", ")}\n\nWould you like to view more details?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "View Details", onPress: () => Alert.alert("Coming Soon", "Commodity details coming soon!") }
      ]
    );
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "fuel": return "car";
      case "market": return "basket";
      case "shopping": return "storefront";
      case "electronics": return "phone-portrait";
      case "food": return "restaurant";
      default: return "business";
    }
  };

  const renderMerchantItem = (merchant: any) => (
    <TouchableOpacity 
      key={merchant.id} 
      style={styles.resultItem}
      onPress={() => handleMerchantPress(merchant)}
    >
      <View style={styles.resultIcon}>
        <Ionicons name={getIconForType(merchant.type)} size={24} color="#4682B4" />
      </View>
      <View style={styles.resultContent}>
        <Text style={styles.resultTitle}>{merchant.name}</Text>
        <Text style={styles.resultSubtitle}>{merchant.location}</Text>
        <View style={styles.resultMeta}>
          <Text style={styles.resultDistance}>{merchant.distance}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{merchant.rating}</Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  const renderCommodityItem = (commodity: any) => (
    <TouchableOpacity 
      key={commodity.id} 
      style={styles.resultItem}
      onPress={() => handleCommodityPress(commodity)}
    >
      <View style={styles.resultIcon}>
        <Ionicons name={getIconForType(commodity.category)} size={24} color="#4682B4" />
      </View>
      <View style={styles.resultContent}>
        <Text style={styles.resultTitle}>{commodity.name}</Text>
        <Text style={styles.resultSubtitle}>Available at {commodity.merchants.length} location(s)</Text>
        <Text style={styles.priceText}>{commodity.price}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Search</Text>
          <Text style={styles.headerSubtitle}>Near {userLocation}</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${activeTab === "merchants" ? "merchants" : "commodities"}...`}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "merchants" && styles.activeTab]}
          onPress={() => setActiveTab("merchants")}
        >
          <Text style={[styles.tabText, activeTab === "merchants" && styles.activeTabText]}>
            Merchants
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "commodities" && styles.activeTab]}
          onPress={() => setActiveTab("commodities")}
        >
          <Text style={[styles.tabText, activeTab === "commodities" && styles.activeTabText]}>
            Commodities
          </Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        {activeTab === "merchants" ? (
          filteredMerchants.length > 0 ? (
            filteredMerchants.map(renderMerchantItem)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="search" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No merchants found</Text>
              <Text style={styles.emptySubtext}>Try a different search term</Text>
            </View>
          )
        ) : (
          filteredCommodities.length > 0 ? (
            filteredCommodities.map(renderCommodityItem)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="search" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No commodities found</Text>
              <Text style={styles.emptySubtext}>Try a different search term</Text>
            </View>
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#4682B4',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#4682B4',
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resultIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultDistance: {
    fontSize: 12,
    color: '#4682B4',
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  priceText: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
});