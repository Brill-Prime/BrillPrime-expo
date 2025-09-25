import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  Modal,
  ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from 'expo-location';
import MapView, { PROVIDER_GOOGLE } from '../../components/Map';
import { locationService } from '../../services/locationService';
import { Merchant } from '../../services/types';
import CommunicationModal from '../../components/CommunicationModal'; // Assuming this path is correct

const { width } = Dimensions.get('window');

// Enhanced mock data with more detailed information
const MOCK_MERCHANTS = [
  {
    id: "1",
    name: "Lagos Fuel Station",
    type: "fuel" as const,
    category: "fuel",
    address: "Victoria Island, Lagos",
    phone: "+234-800-123-4567",
    email: "info@lagosfuel.com",
    description: "Premium fuel station with 24/7 service",
    distance: "2.3 km",
    rating: 4.5,
    reviewCount: 124,
    latitude: 6.4281,
    longitude: 3.4219,
    priceRange: "medium",
    isOpen: true,
    operatingHours: {
      "Monday": "24 hours",
      "Tuesday": "24 hours",
      "Wednesday": "24 hours",
      "Thursday": "24 hours",
      "Friday": "24 hours",
      "Saturday": "24 hours",
      "Sunday": "24 hours"
    },
    services: ["24/7", "Car Wash", "ATM"],
    images: []
  },
  {
    id: "2",
    name: "Victoria Island Market",
    type: "market" as const,
    category: "groceries",
    address: "Victoria Island, Lagos",
    phone: "+234-800-123-4568",
    email: "info@vimarket.com",
    description: "Local market with fresh produce",
    distance: "1.8 km",
    rating: 4.2,
    reviewCount: 89,
    latitude: 6.4241,
    longitude: 3.4189,
    priceRange: "low",
    isOpen: true,
    operatingHours: {
      "Monday": "6:00 AM - 8:00 PM",
      "Tuesday": "6:00 AM - 8:00 PM",
      "Wednesday": "6:00 AM - 8:00 PM",
      "Thursday": "6:00 AM - 8:00 PM",
      "Friday": "6:00 AM - 8:00 PM",
      "Saturday": "6:00 AM - 9:00 PM",
      "Sunday": "7:00 AM - 7:00 PM"
    },
    services: ["Fresh Produce", "Local Vendors"],
    images: []
  },
  {
    id: "3",
    name: "Ikeja Shopping Mall",
    type: "shopping" as const,
    category: "retail",
    address: "Ikeja, Lagos",
    phone: "+234-800-123-4569",
    email: "info@ikejamall.com",
    description: "Modern shopping mall with diverse stores",
    distance: "5.1 km",
    rating: 4.7,
    reviewCount: 203,
    latitude: 6.5927,
    longitude: 3.3615,
    priceRange: "high",
    isOpen: true,
    operatingHours: {
      "Monday": "10:00 AM - 10:00 PM",
      "Tuesday": "10:00 AM - 10:00 PM",
      "Wednesday": "10:00 AM - 10:00 PM",
      "Thursday": "10:00 AM - 10:00 PM",
      "Friday": "10:00 AM - 11:00 PM",
      "Saturday": "9:00 AM - 11:00 PM",
      "Sunday": "11:00 AM - 9:00 PM"
    },
    services: ["Air Conditioned", "Food Court", "Parking"],
    images: []
  },
  {
    id: "4",
    name: "Lekki Phase 1 Fuel",
    type: "fuel" as const,
    category: "fuel",
    address: "Lekki, Lagos",
    phone: "+234-800-123-4570",
    email: "info@lekkifuel.com",
    description: "Premium fuel station in Lekki",
    distance: "4.2 km",
    rating: 4.3,
    reviewCount: 67,
    latitude: 6.4474,
    longitude: 3.5614,
    priceRange: "medium",
    isOpen: false,
    operatingHours: {
      "Monday": "6:00 AM - 10:00 PM",
      "Tuesday": "6:00 AM - 10:00 PM",
      "Wednesday": "6:00 AM - 10:00 PM",
      "Thursday": "6:00 AM - 10:00 PM",
      "Friday": "6:00 AM - 10:00 PM",
      "Saturday": "6:00 AM - 10:00 PM",
      "Sunday": "7:00 AM - 9:00 PM"
    },
    services: ["Premium Fuel", "Quick Service"],
    images: []
  },
  {
    id: "5",
    name: "Computer Village",
    type: "shopping" as const,
    category: "electronics",
    address: "Ikeja, Lagos",
    phone: "+234-800-123-4571",
    email: "info@compvillage.com",
    description: "Electronics and tech hub",
    distance: "6.8 km",
    rating: 4.1,
    reviewCount: 156,
    latitude: 6.5492,
    longitude: 3.3619,
    priceRange: "medium",
    isOpen: true,
    operatingHours: {
      "Monday": "8:00 AM - 8:00 PM",
      "Tuesday": "8:00 AM - 8:00 PM",
      "Wednesday": "8:00 AM - 8:00 PM",
      "Thursday": "8:00 AM - 8:00 PM",
      "Friday": "8:00 AM - 8:00 PM",
      "Saturday": "8:00 AM - 9:00 PM",
      "Sunday": "10:00 AM - 6:00 PM"
    },
    services: ["Tech Repair", "Wholesale", "Gadgets"],
    images: []
  },
  {
    id: "6",
    name: "Palms Shopping Mall",
    type: "shopping" as const,
    category: "retail",
    address: "Lekki, Lagos",
    phone: "+234-800-123-4572",
    email: "info@palmsmall.com",
    description: "Premium shopping destination",
    distance: "3.9 km",
    rating: 4.6,
    reviewCount: 298,
    latitude: 6.4167,
    longitude: 3.5405,
    priceRange: "high",
    isOpen: true,
    operatingHours: {
      "Monday": "10:00 AM - 10:00 PM",
      "Tuesday": "10:00 AM - 10:00 PM",
      "Wednesday": "10:00 AM - 10:00 PM",
      "Thursday": "10:00 AM - 10:00 PM",
      "Friday": "10:00 AM - 11:00 PM",
      "Saturday": "9:00 AM - 11:00 PM",
      "Sunday": "11:00 AM - 9:00 PM"
    },
    services: ["Cinema", "Restaurants", "Brand Stores"],
    images: []
  },
  {
    id: "7",
    name: "Mainland Market",
    type: "market" as const,
    category: "groceries",
    address: "Yaba, Lagos",
    phone: "+234-800-123-4573",
    email: "info@mainlandmarket.com",
    description: "Local market for bulk purchases",
    distance: "7.2 km",
    rating: 3.9,
    reviewCount: 45,
    latitude: 6.5158,
    longitude: 3.3696,
    priceRange: "low",
    isOpen: true,
    operatingHours: {
      "Monday": "6:00 AM - 7:00 PM",
      "Tuesday": "6:00 AM - 7:00 PM",
      "Wednesday": "6:00 AM - 7:00 PM",
      "Thursday": "6:00 AM - 7:00 PM",
      "Friday": "6:00 AM - 7:00 PM",
      "Saturday": "6:00 AM - 8:00 PM",
      "Sunday": "7:00 AM - 6:00 PM"
    },
    services: ["Bulk Purchase", "Local Items"],
    images: []
  },
  {
    id: "8",
    name: "Express Fuel Stop",
    type: "fuel" as const,
    category: "fuel",
    address: "Surulere, Lagos",
    phone: "+234-800-123-4574",
    email: "info@expressfuel.com",
    description: "Quick fuel service station",
    distance: "8.5 km",
    rating: 4.0,
    reviewCount: 78,
    latitude: 6.4969,
    longitude: 3.3515,
    priceRange: "low",
    isOpen: true,
    operatingHours: {
      "Monday": "6:00 AM - 9:00 PM",
      "Tuesday": "6:00 AM - 9:00 PM",
      "Wednesday": "6:00 AM - 9:00 PM",
      "Thursday": "6:00 AM - 9:00 PM",
      "Friday": "6:00 AM - 9:00 PM",
      "Saturday": "6:00 AM - 9:00 PM",
      "Sunday": "7:00 AM - 8:00 PM"
    },
    services: ["Quick Fill", "Mobile Payment"],
    images: []
  }
];

const MOCK_COMMODITIES = [
  {
    id: 1,
    name: "Premium Petrol",
    category: "fuel",
    merchants: ["Lagos Fuel Station", "Lekki Phase 1 Fuel"],
    price: "₦650/L",
    priceValue: 650,
    availability: "In Stock",
    description: "High quality premium petrol"
  },
  {
    id: 2,
    name: "Fresh Tomatoes",
    category: "food",
    merchants: ["Victoria Island Market", "Mainland Market"],
    price: "₦800/kg",
    priceValue: 800,
    availability: "In Stock",
    description: "Fresh local tomatoes"
  },
  {
    id: 3,
    name: "Rice (50kg)",
    category: "food",
    merchants: ["Victoria Island Market"],
    price: "₦45,000",
    priceValue: 45000,
    availability: "Limited Stock",
    description: "Premium long grain rice"
  },
  {
    id: 4,
    name: "iPhone 15",
    category: "electronics",
    merchants: ["Computer Village", "Palms Shopping Mall"],
    price: "₦1,200,000",
    priceValue: 1200000,
    availability: "In Stock",
    description: "Latest iPhone model"
  },
  {
    id: 5,
    name: "Samsung TV 55\"",
    category: "electronics",
    merchants: ["Computer Village", "Palms Shopping Mall"],
    price: "₦650,000",
    priceValue: 650000,
    availability: "In Stock",
    description: "4K Smart TV"
  },
  {
    id: 6,
    name: "Diesel",
    category: "fuel",
    merchants: ["Lagos Fuel Station", "Express Fuel Stop"],
    price: "₦750/L",
    priceValue: 750,
    availability: "In Stock",
    description: "Clean diesel fuel"
  },
  {
    id: 7,
    name: "Bread (Loaf)",
    category: "food",
    merchants: ["Victoria Island Market", "Mainland Market"],
    price: "₦500",
    priceValue: 500,
    availability: "In Stock",
    description: "Fresh baked bread"
  }
];

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"merchants" | "commodities">("merchants");
  const [filteredMerchants, setFilteredMerchants] = useState(MOCK_MERCHANTS);
  const [filteredCommodities, setFilteredCommodities] = useState(MOCK_COMMODITIES);
  const [userLocation, setUserLocation] = useState<any>(null); // Modified to support location object
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'fuel' | 'food' | 'groceries'>('all');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false); // Added loading state
  const [showMap, setShowMap] = useState(false); // State to toggle map view
  const [nearbyMerchants, setNearbyMerchants] = useState<Merchant[]>([]); // State for nearby merchants
  const [showCommunicationModal, setShowCommunicationModal] = useState(false); // State for communication modal
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null); // State for selected merchant for modal
  const [userCoordinates, setUserCoordinates] = useState<{latitude: number; longitude: number} | null>(null); // User coordinates state

  // Enhanced filter states
  const [filters, setFilters] = useState({
    maxDistance: 10, // km
    minRating: 0,
    priceRange: 'all', // 'low', 'medium', 'high', 'all'
    category: 'all' as 'fuel' | 'groceries' | 'food' | 'all', // 'fuel', 'groceries', 'electronics', 'retail', 'all'
    sortBy: 'distance', // 'distance', 'rating', 'name', 'price'
    onlyOpen: false,
    hasFeatures: [] as string[]
  });

  // Search suggestions based on popular searches
  const POPULAR_SEARCHES = [
    "Petrol", "Diesel", "Rice", "iPhone", "Samsung", "Bread", "Tomatoes",
    "Fuel Station", "Market", "Electronics", "Shopping Mall"
  ];

  useEffect(() => {
    loadUserData();
    loadSearchHistory();
    loadFavorites();
    loadUserLocation(); // Load user location on component mount
  }, []);

  useEffect(() => {
    filterResults();
    updateSearchSuggestions();
  }, [searchQuery, activeTab, filters, userCoordinates, selectedCategory]); // Added selectedCategory dependency

  // Load merchants and commodities from API
  useEffect(() => {
    if (activeTab === "merchants") {
      loadMerchants();
    } else {
      loadCommodities();
    }
  }, [activeTab, userCoordinates]); // Re-fetch when tab or user location changes

  const loadUserData = async () => {
    try {
      const savedLocation = await AsyncStorage.getItem("userLocation");
      const savedAddress = await AsyncStorage.getItem("userAddress");

      if (savedLocation) {
        const coordinates = JSON.parse(savedLocation);
        setUserCoordinates(coordinates);
        setUserLocation(savedAddress || "Your Location");
      }
    } catch (error) {
      console.error("Error loading user location:", error);
    }
  };

  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('searchHistory');
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error("Error loading search history:", error);
    }
  };

  const loadFavorites = async () => {
    try {
      const favs = await AsyncStorage.getItem('favorites');
      if (favs) {
        setFavorites(JSON.parse(favs));
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  };

  const updateSearchSuggestions = () => {
    if (searchQuery.length > 0) {
      const suggestions = POPULAR_SEARCHES.filter(search =>
        search.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5);
      setSearchSuggestions(suggestions);
    } else {
      setSearchSuggestions([]);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const filterMerchants = () => {
    let filtered = MOCK_MERCHANTS.filter(merchant =>
      merchant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      merchant.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      merchant.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      merchant.services.some((feature: string) => feature.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(merchant => {
        switch (selectedCategory) {
          case 'fuel': return merchant.type === 'fuel';
          case 'food': return merchant.type === 'market' && merchant.category === 'groceries'; // Assuming market with groceries is food
          case 'groceries': return merchant.type === 'market' && merchant.category === 'groceries';
          default: return true;
        }
      });
    }

    // Apply other filters
    filtered = filtered.filter(merchant => {
      const distance = parseFloat(merchant.distance.replace(' km', ''));
      const passesDistance = distance <= filters.maxDistance;
      const passesRating = merchant.rating >= filters.minRating;
      const passesCategory = filters.category === 'all' || merchant.category === filters.category;
      const passesPriceRange = filters.priceRange === 'all' || merchant.priceRange === filters.priceRange;
      const passesOpenStatus = !filters.onlyOpen || merchant.isOpen;

      return passesDistance && passesRating && passesCategory && passesPriceRange && passesOpenStatus;
    });

    // Calculate real distances if user location is available
    if (userCoordinates) {
      filtered = filtered.map(merchant => {
        const realDistance = calculateDistance(
          userCoordinates.latitude,
          userCoordinates.longitude,
          merchant.latitude,
          merchant.longitude
        );
        return {
          ...merchant,
          distance: `${realDistance.toFixed(1)} km`,
          realDistance
        };
      });
    }

    // Sort results
    filtered = filtered.sort((a, b) => {
      if (filters.sortBy === 'distance') {
        const distA = userCoordinates ? (a as any).realDistance : parseFloat(a.distance);
        const distB = userCoordinates ? (b as any).realDistance : parseFloat(b.distance);
        return distA - distB;
      } else if (filters.sortBy === 'rating') {
        return b.rating - a.rating;
      } else {
        return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  };

  const filterCommodities = () => {
    let filtered = MOCK_COMMODITIES.filter(commodity =>
      commodity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      commodity.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      commodity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      commodity.merchants.some(merchant => merchant.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(commodity => {
        switch (selectedCategory) {
          case 'fuel': return commodity.category === 'fuel';
          case 'food': return commodity.category === 'food' || commodity.category === 'beverages';
          case 'groceries': return commodity.category === 'groceries' || commodity.category === 'household';
          default: return true;
        }
      });
    }

    // Apply other filters for commodities
    if (filters.category !== 'all') {
      filtered = filtered.filter(commodity => commodity.category === filters.category);
    }
    if (filters.priceRange !== 'all') {
      filtered = filtered.filter(commodity => {
        if (filters.priceRange === 'low') return commodity.priceValue < 1000;
        if (filters.priceRange === 'medium') return commodity.priceValue >= 1000 && commodity.priceValue < 50000;
        if (filters.priceRange === 'high') return commodity.priceValue >= 50000;
        return true;
      });
    }

    // Sort commodities
    if (filters.sortBy === 'price') {
      filtered = filtered.sort((a, b) => a.priceValue - b.priceValue);
    } else if (filters.sortBy === 'name') {
      filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  };

  const filterResults = () => {
    if (activeTab === "merchants") {
      setFilteredMerchants(filterMerchants());
    } else {
      setFilteredCommodities(filterCommodities());
    }

    // Save search to history if it's not empty and not already in history
    if (searchQuery.trim() && !searchHistory.includes(searchQuery.trim())) {
      const newHistory = [searchQuery.trim(), ...searchHistory.slice(0, 4)]; // Keep last 5 searches
      setSearchHistory(newHistory);
      AsyncStorage.setItem('searchHistory', JSON.stringify(newHistory));
    }
  };


  const handleGoBack = () => {
    router.back();
  };

  const handleMerchantPress = (merchant: Merchant) => {
    // In addition to navigating, open the communication modal
    setSelectedMerchant(merchant);
    setShowCommunicationModal(true);
    // router.push(`/merchant/${merchant.id}`); // Navigation might be handled within the modal or after selection
  };

  const handleCommodityPress = (commodity: any) => {
    router.push(`/commodity/${commodity.id}`);
  };

  const handleHistorySelect = (historyItem: string) => {
    setSearchQuery(historyItem);
    setShowHistory(false);
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setSearchQuery(suggestion);
    setSearchSuggestions([]);
  };

  const clearSearchHistory = async () => {
    setSearchHistory([]);
    await AsyncStorage.removeItem('searchHistory');
  };

  const toggleFavorite = async (id: number) => {
    const newFavorites = favorites.includes(id)
      ? favorites.filter(fav => fav !== id)
      : [...favorites, id];

    setFavorites(newFavorites);
    await AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  const handleNearMe = async () => {
    if (userCoordinates) {
      // Already have location, just sort by distance
      setFilters({ ...filters, sortBy: 'distance' });
      Alert.alert("Near Me", "Results sorted by distance from your location.");
      return;
    }

    setIsLoadingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Denied", "Location permission is required for GPS-based sorting.");
        setIsLoadingLocation(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };

      setUserCoordinates(coordinates); // Set userCoordinates
      await AsyncStorage.setItem("userLocation", JSON.stringify(coordinates));

      // Get address
      let addressInfo = "Your Location";
      try {
        let reverseGeocode = await Location.reverseGeocodeAsync(coordinates);
        if (reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          addressInfo = `${address.city || address.subregion || address.region}, ${address.country}`;
        }
      } catch (geoError) {
        console.log("Geocoding failed, using default address");
      }

      setUserLocation(addressInfo);
      await AsyncStorage.setItem("userAddress", addressInfo);
      setFilters({ ...filters, sortBy: 'distance' });

      setIsLoadingLocation(false);
      Alert.alert("Success!", `Location updated to ${addressInfo}. Results sorted by distance.`);
    } catch (error) {
      console.error("Error getting location:", error);
      setIsLoadingLocation(false);
      Alert.alert("Error", "Unable to get your location. Please try again.");
    }
  };

  const resetFilters = () => {
    setFilters({
      maxDistance: 10,
      minRating: 0,
      priceRange: 'all',
      category: 'all',
      sortBy: 'distance',
      onlyOpen: false,
      hasFeatures: []
    });
    setSelectedCategory('all'); // Reset selected category as well
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "fuel": return "car";
      case "market":
      case "groceries": return "basket";
      case "shopping":
      case "retail": return "storefront";
      case "electronics": return "phone-portrait";
      case "food": return "restaurant";
      default: return "business";
    }
  };

  const renderMerchantItem = (merchant: Merchant) => (
    <TouchableOpacity
      key={merchant.id}
      style={styles.resultItem}
      onPress={() => handleMerchantPress(merchant)}
    >
      <View style={styles.resultIcon}>
        <Ionicons name={getIconForType(merchant.type)} size={24} color="#4682B4" />
      </View>
      <View style={styles.resultContent}>
        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>{merchant.name}</Text>
          <TouchableOpacity onPress={() => toggleFavorite(parseInt(merchant.id))}>
            <Ionicons
              name={favorites.includes(merchant.id) ? "heart" : "heart-outline"}
              size={20}
              color={favorites.includes(merchant.id) ? "#e74c3c" : "#ccc"}
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.resultSubtitle}>{merchant.address}</Text>
        <View style={styles.resultMeta}>
          <Text style={styles.resultDistance}>{merchant.distance}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{merchant.rating} ({merchant.reviewCount})</Text>
          </View>
          <View style={[styles.statusDot, {
            backgroundColor: merchant.isOpen ? '#4CAF50' : '#f44336'
          }]} />
        </View>
        <View style={styles.featuresContainer}>
          {merchant.services.slice(0, 2).map((feature: string, index: number) => (
            <View key={index} style={styles.featureTag}>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
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
        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>{commodity.name}</Text>
          <View style={[styles.availabilityBadge, {
            backgroundColor: commodity.availability === 'In Stock' ? '#e8f5e8' : '#fff3e0'
          }]}>
            <Text style={[styles.availabilityText, {
              color: commodity.availability === 'In Stock' ? '#2e7d32' : '#f57c00'
            }]}>
              {commodity.availability}
            </Text>
          </View>
        </View>
        <Text style={styles.resultSubtitle}>{commodity.description}</Text>
        <Text style={styles.merchantsText}>Available at {commodity.merchants.length} location(s)</Text>
        <Text style={styles.priceText}>{commodity.price}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  const loadMerchants = async () => {
    try {
      setLoading(true);
      // Simulate API call with mock data if actual service is not available
      setFilteredMerchants(MOCK_MERCHANTS);
    } catch (error) {
      console.error('Error loading merchants:', error);
      setFilteredMerchants(MOCK_MERCHANTS); // Fallback on error
    } finally {
      setLoading(false);
    }
  };

  const loadCommodities = async () => {
    try {
      setLoading(true);
      // Simulate API call with mock data
      setFilteredCommodities(MOCK_COMMODITIES);
    } catch (error) {
      console.error('Error loading commodities:', error);
      setFilteredCommodities(MOCK_COMMODITIES); // Fallback on error
    } finally {
      setLoading(false);
    }
  };

  // --- New functions for live location tracking ---
  const loadUserLocation = async () => {
    const hasPermission = await locationService.requestLocationPermission();
    if (hasPermission) {
      const location = await locationService.getCurrentLocation();
      if (location) {
        setUserLocation(location);
        loadNearbyMerchants(location.latitude, location.longitude);
      }
    } else {
      Alert.alert(
        'Location Permission Required',
        'Please enable location access to find nearby merchants.',
        [{ text: 'OK' }]
      );
    }
  };

  const loadNearbyMerchants = async (latitude: number, longitude: number) => {
    const response = await locationService.getNearbyMerchantsLive(latitude, longitude, 10);
    if (response.success && response.data) {
      setNearbyMerchants(response.data);
    }
  };
  // --- End of new functions ---

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
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(!showFilters)}>
          <Ionicons name="options-outline" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowMap(!showMap)}
          style={styles.mapToggle}
        >
          <Ionicons name={showMap ? "list" : "map"} size={24} color="#007bff" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${activeTab === "merchants" ? "merchants" : "commodities"}...`}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setShowHistory(text.length === 0 && searchHistory.length > 0); // Show history if search is cleared
            }}
            onFocus={() => setShowHistory(searchHistory.length > 0 && searchQuery.length === 0)}
            returnKeyType="search"
            onSubmitEditing={filterResults} // Trigger filter on submit
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => { setSearchQuery(""); filterResults(); }}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setShowHistory(!showHistory)}>
              <Ionicons name="time" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.searchActions}>
          <TouchableOpacity
            style={[styles.actionButton, isLoadingLocation && styles.disabledButton]}
            onPress={handleNearMe}
            disabled={isLoadingLocation}
          >
            {isLoadingLocation ? (
              <ActivityIndicator size={16} color="#4682B4" />
            ) : (
              <Ionicons name="location" size={16} color="#4682B4" />
            )}
            <Text style={styles.actionButtonText}>Near Me</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, showFilters && styles.activeActionButton]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="options" size={16} color={showFilters ? "#fff" : "#4682B4"} />
            <Text style={[styles.actionButtonText, showFilters && styles.activeActionButtonText]}>
              Filters
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Suggestions */}
        {searchQuery.length > 0 && searchSuggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {searchSuggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionItem}
                onPress={() => handleSuggestionSelect(suggestion)}
              >
                <Ionicons name="search" size={16} color="#999" />
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Search History */}
        {showHistory && searchHistory.length > 0 && searchQuery.length === 0 && (
          <View style={styles.historyContainer}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Recent Searches</Text>
              <TouchableOpacity onPress={clearSearchHistory}>
                <Text style={styles.clearHistoryText}>Clear</Text>
              </TouchableOpacity>
            </View>
            {searchHistory.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.historyItem}
                onPress={() => handleHistorySelect(item)}
              >
                <Ionicons name="time" size={16} color="#999" />
                <Text style={styles.historyItemText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Enhanced Filters */}
        {showFilters && (
          <View style={styles.filtersContainer}>
            <View style={styles.filtersHeader}>
              <Text style={styles.filtersTitle}>Filters</Text>
              <TouchableOpacity onPress={resetFilters}>
                <Text style={styles.resetFiltersText}>Reset</Text>
              </TouchableOpacity>
            </View>

            {/* Category Filter */}
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
                <View style={styles.categoryButtons}>
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'fuel', label: 'Fuel Stations' },
                    { key: 'food', label: 'Food & Drinks' },
                    { key: 'groceries', label: 'Groceries' }
                  ].map(category => (
                    <TouchableOpacity
                      key={category.key}
                      style={[
                        styles.filterChip,
                        selectedCategory === category.key && styles.activeFilterChip
                      ]}
                      onPress={() => setSelectedCategory(category.key)}
                    >
                      <Text style={[
                        styles.filterChipText,
                        selectedCategory === category.key && styles.activeFilterChipText
                      ]}>
                        {category.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Additional Filters (Max Distance, Min Rating, etc.) */}
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Max Distance: {filters.maxDistance} km</Text>
              <View style={styles.distanceButtons}>
                {[2, 5, 10, 20].map(distance => (
                  <TouchableOpacity
                    key={distance}
                    style={[
                      styles.filterChip,
                      filters.maxDistance === distance && styles.activeFilterChip
                    ]}
                    onPress={() => setFilters({ ...filters, maxDistance: distance })}
                  >
                    <Text style={[
                      styles.filterChipText,
                      filters.maxDistance === distance && styles.activeFilterChipText
                    ]}>
                      {distance}km
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Minimum Rating</Text>
              <View style={styles.ratingButtons}>
                {[0, 3, 4, 4.5].map(rating => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styles.filterChip,
                      filters.minRating === rating && styles.activeFilterChip
                    ]}
                    onPress={() => setFilters({ ...filters, minRating: rating })}
                  >
                    <Ionicons name="star" size={14} color={filters.minRating === rating ? "#fff" : "#FFD700"} />
                    <Text style={[
                      styles.filterChipText,
                      filters.minRating === rating && styles.activeFilterChipText
                    ]}>
                      {rating === 0 ? 'Any' : rating}+
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Price Range</Text>
              <View style={styles.priceButtons}>
                {[
                  { key: 'all', label: 'All' },
                  { key: 'low', label: 'Under ₦1K' },
                  { key: 'medium', label: '₦1K-₦50K' },
                  { key: 'high', label: 'Over ₦50K' }
                ].map(price => (
                  <TouchableOpacity
                    key={price.key}
                    style={[
                      styles.filterChip,
                      filters.priceRange === price.key && styles.activeFilterChip
                    ]}
                    onPress={() => setFilters({ ...filters, priceRange: price.key })}
                  >
                    <Text style={[
                      styles.filterChipText,
                      filters.priceRange === price.key && styles.activeFilterChipText
                    ]}>
                      {price.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {activeTab === 'merchants' && (
              <View style={styles.filterRow}>
                <View style={styles.toggleContainer}>
                  <Text style={styles.filterLabel}>Only show open locations</Text>
                  <TouchableOpacity
                    style={[styles.toggle, filters.onlyOpen && styles.activeToggle]}
                    onPress={() => setFilters({ ...filters, onlyOpen: !filters.onlyOpen })}
                  >
                    <View style={[styles.toggleDot, filters.onlyOpen && styles.activeToggleDot]} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Sort By</Text>
              <View style={styles.sortButtons}>
                {[
                  { key: 'distance', label: 'Distance' },
                  { key: 'rating', label: 'Rating' },
                  { key: 'name', label: 'Name' },
                  ...(activeTab === 'commodities' ? [{ key: 'price', label: 'Price' }] : [])
                ].map(sort => (
                  <TouchableOpacity
                    key={sort.key}
                    style={[
                      styles.filterChip,
                      filters.sortBy === sort.key && styles.activeFilterChip
                    ]}
                    onPress={() => setFilters({ ...filters, sortBy: sort.key })}
                  >
                    <Text style={[
                      styles.filterChipText,
                      filters.sortBy === sort.key && styles.activeFilterChipText
                    ]}>
                      {sort.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Map View or Tabs */}
      {showMap && userLocation ? (
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            showsUserLocation={true}
            showMerchants={true}
          />
        </View>
      ) : (
        <>
          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "merchants" && styles.activeTab]}
              onPress={() => { setActiveTab("merchants"); filterResults(); }} // Re-apply filters on tab change
            >
              <Text style={[styles.tabText, activeTab === "merchants" && styles.activeTabText]}>
                Merchants ({filteredMerchants.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "commodities" && styles.activeTab]}
              onPress={() => { setActiveTab("commodities"); filterResults(); }} // Re-apply filters on tab change
            >
              <Text style={[styles.tabText, activeTab === "commodities" && styles.activeTabText]}>
                Commodities ({filteredCommodities.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Results */}
          <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
            {/* Nearby Merchants Section */}
            {nearbyMerchants.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Nearby Merchants</Text>
                {nearbyMerchants.slice(0, 3).map((merchant) => (
                  <TouchableOpacity
                    key={merchant.id}
                    style={styles.merchantCard}
                    onPress={() => router.push(`/merchant/${merchant.id}`)}
                  >
                    <View style={styles.merchantInfo}>
                      <Text style={styles.merchantName}>{merchant.name}</Text>
                      <Text style={styles.merchantType}>{merchant.type}</Text>
                      <Text style={styles.merchantAddress}>
                        {merchant.address?.street || 'Address not available'}
                      </Text>
                      <View style={styles.merchantStatus}>
                        <View style={[
                          styles.statusDot,
                          { backgroundColor: merchant.isOpen ? '#28a745' : '#dc3545' }
                        ]} />
                        <Text style={styles.statusText}>
                          {merchant.isOpen ? 'Open' : 'Closed'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.distanceContainer}>
                      <Text style={styles.distance}>
                        {userLocation && merchant.address?.coordinates
                          ? `${locationService.calculateDistance(
                              userLocation.latitude,
                              userLocation.longitude,
                              merchant.address.coordinates.latitude,
                              merchant.address.coordinates.longitude
                            ).toFixed(1)} km`
                          : 'N/A'
                        }
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Regular Search Results */}
            {activeTab === "merchants" ? (
              filteredMerchants.length > 0 ? (
                filteredMerchants.map(renderMerchantItem)
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="search" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>No merchants found</Text>
                  <Text style={styles.emptySubtext}>Try adjusting your filters or search term</Text>
                </View>
              )
            ) : (
              filteredCommodities.length > 0 ? (
                filteredCommodities.map(renderCommodityItem)
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="search" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>No commodities found</Text>
                  <Text style={styles.emptySubtext}>Try adjusting your filters or search term</Text>
                </View>
              )
            )}
          </ScrollView>
        </>
      )}

      {/* Communication Modal */}
      <CommunicationModal
        visible={showCommunicationModal}
        onClose={() => setShowCommunicationModal(false)}
        contactName={selectedMerchant?.name || 'Merchant'}
        contactPhone={selectedMerchant?.phone} // Assuming merchants have a 'phone' property
        contactRole="merchant"
        onChatPress={() => {
          if (selectedMerchant) {
            router.push(`/chat/conv_merchant_${selectedMerchant.id}`);
          }
          setShowCommunicationModal(false);
        }}
      />
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
    flexDirection: 'column',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  filterButton: {
    padding: 8,
  },
  mapToggle: {
    padding: 8,
    marginLeft: 10,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
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
  searchActions: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  activeActionButton: {
    backgroundColor: '#4682B4',
  },
  disabledButton: {
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#4682B4',
    fontWeight: '500',
  },
  activeActionButtonText: {
    color: '#fff',
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    marginTop: 10,
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  suggestionText: {
    fontSize: 14,
    color: '#666',
  },
  historyContainer: {
    backgroundColor: '#fff',
    marginTop: 10,
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  clearHistoryText: {
    fontSize: 12,
    color: '#4682B4',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  historyItemText: {
    fontSize: 14,
    color: '#666',
  },
  filtersContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  filtersScroll: {
    paddingHorizontal: Math.max(16, width * 0.04),
  },
  filterChip: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  activeFilterChip: {
    backgroundColor: '#4682B4',
    borderColor: '#4682B4',
  },
  filterChipText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterChipText: {
    color: 'white',
    fontWeight: '600',
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  resetFiltersText: {
    fontSize: 12,
    color: '#4682B4',
  },
  filterRow: {
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  filterScrollView: {
    marginTop: 5,
  },
  categoryButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  distanceButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  priceButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  activeToggle: {
    backgroundColor: '#4682B4',
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  activeToggleDot: {
    alignSelf: 'flex-end',
  },
  sortButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  merchantCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  merchantInfo: {
    flex: 1,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  merchantType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  merchantAddress: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  merchantStatus: {
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
    fontSize: 12,
    color: '#666',
  },
  distanceContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 16,
  },
  distance: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007bff',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
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
    marginBottom: 8,
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
  featuresContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  featureTag: {
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  featureText: {
    fontSize: 10,
    color: '#4682B4',
  },
  availabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  availabilityText: {
    fontSize: 10,
    fontWeight: '500',
  },
  merchantsText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
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
    textAlign: 'center',
  },
});