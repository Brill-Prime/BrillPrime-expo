import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Platform,
  Dimensions,
  Image
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Mock merchant data - in a real app, this would come from API
const MERCHANT_DATA = {
  "1": {
    id: "1",
    name: "Lagos Fuel Station",
    type: "fuel",
    address: "Plot 15, Victoria Island, Lagos, Nigeria",
    phone: "+234-800-FUEL-001",
    email: "info@lagosfuel.com",
    description: "Premium fuel station providing high-quality petrol, diesel, and automotive services. We pride ourselves on fast service and competitive prices.",
    rating: 4.5,
    reviewCount: 127,
    distance: "2.3 km",
    isOpen: true,
    operatingHours: {
      monday: "06:00 - 22:00",
      tuesday: "06:00 - 22:00", 
      wednesday: "06:00 - 22:00",
      thursday: "06:00 - 22:00",
      friday: "06:00 - 22:00",
      saturday: "07:00 - 21:00",
      sunday: "07:00 - 20:00"
    },
    services: ["Premium Petrol", "Diesel", "Car Wash", "Minor Repairs", "Tire Pressure Check"],
    commodities: [
      { name: "Premium Petrol", price: "₦650/L", availability: "In Stock" },
      { name: "Diesel", price: "₦750/L", availability: "In Stock" },
      { name: "Engine Oil", price: "₦3,500", availability: "Limited Stock" }
    ],
    images: [
      "https://images.unsplash.com/photo-1545262810-77515befe149?w=400",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400"
    ]
  },
  "2": {
    id: "2", 
    name: "Victoria Island Market",
    type: "market",
    address: "Tiamiyu Savage Street, Victoria Island, Lagos, Nigeria",
    phone: "+234-800-MARKET-01",
    email: "contact@vimarket.com",
    description: "Fresh groceries, local produce, and everyday essentials. Your one-stop shop for quality food items at affordable prices.",
    rating: 4.2,
    reviewCount: 89,
    distance: "1.8 km",
    isOpen: true,
    operatingHours: {
      monday: "07:00 - 19:00",
      tuesday: "07:00 - 19:00",
      wednesday: "07:00 - 19:00", 
      thursday: "07:00 - 19:00",
      friday: "07:00 - 19:00",
      saturday: "07:00 - 20:00",
      sunday: "08:00 - 18:00"
    },
    services: ["Fresh Produce", "Groceries", "Local Ingredients", "Bulk Orders", "Home Delivery"],
    commodities: [
      { name: "Fresh Tomatoes", price: "₦800/kg", availability: "In Stock" },
      { name: "Rice (50kg)", price: "₦45,000", availability: "In Stock" },
      { name: "Onions", price: "₦600/kg", availability: "In Stock" }
    ],
    images: [
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400",
      "https://images.unsplash.com/photo-1543083115-a0b5a0b7b16a?w=400"
    ]
  },
  "3": {
    id: "3",
    name: "Ikeja Shopping Mall", 
    type: "shopping",
    address: "Allen Avenue, Ikeja, Lagos, Nigeria",
    phone: "+234-800-SHOP-001",
    email: "info@ikejamall.com",
    description: "Modern shopping center featuring fashion, electronics, restaurants, and entertainment. Over 100 stores under one roof.",
    rating: 4.7,
    reviewCount: 203,
    distance: "5.1 km",
    isOpen: true,
    operatingHours: {
      monday: "10:00 - 21:00",
      tuesday: "10:00 - 21:00",
      wednesday: "10:00 - 21:00",
      thursday: "10:00 - 21:00", 
      friday: "10:00 - 22:00",
      saturday: "09:00 - 22:00",
      sunday: "11:00 - 20:00"
    },
    services: ["Fashion Retail", "Electronics", "Food Court", "Entertainment", "Parking"],
    commodities: [
      { name: "Samsung TV 55\"", price: "₦650,000", availability: "In Stock" },
      { name: "iPhone 15", price: "₦1,200,000", availability: "Limited Stock" },
      { name: "Nike Sneakers", price: "₦85,000", availability: "In Stock" }
    ],
    images: [
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400",
      "https://images.unsplash.com/photo-1555529669-2269763671c5?w=400"
    ]
  }
};

export default function MerchantDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [merchant, setMerchant] = useState<any>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (id && MERCHANT_DATA[id as keyof typeof MERCHANT_DATA]) {
      setMerchant(MERCHANT_DATA[id as keyof typeof MERCHANT_DATA]);
    } else {
      Alert.alert("Error", "Merchant not found", [
        { text: "Go Back", onPress: () => router.back() }
      ]);
    }
  }, [id]);

  if (!merchant) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading merchant details...</Text>
      </View>
    );
  }

  const handleCall = () => {
    Alert.alert(
      "Call Merchant",
      `Would you like to call ${merchant.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Call Now",
          onPress: () => {
            const phoneUrl = Platform.OS === 'ios' ? `tel:${merchant.phone}` : `tel:${merchant.phone}`;
            Linking.openURL(phoneUrl).catch(() => {
              Alert.alert("Error", "Unable to make phone call");
            });
          }
        }
      ]
    );
  };

  const handleEmail = () => {
    const emailUrl = `mailto:${merchant.email}?subject=Inquiry about ${merchant.name}`;
    Linking.openURL(emailUrl).catch(() => {
      Alert.alert("Error", "Unable to open email client");
    });
  };

  const handleDirections = () => {
    const address = encodeURIComponent(merchant.address);
    const mapsUrl = Platform.OS === 'ios' 
      ? `http://maps.apple.com/?daddr=${address}`
      : `https://www.google.com/maps/dir/?api=1&destination=${address}`;
    
    Linking.openURL(mapsUrl).catch(() => {
      Alert.alert("Error", "Unable to open maps application");
    });
  };

  const getCurrentDay = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()];
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "fuel": return "car";
      case "market": return "basket";
      case "shopping": return "storefront";
      default: return "business";
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Ionicons key={i} name="star" size={16} color="#FFD700" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Ionicons key="half" name="star-half" size={16} color="#FFD700" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Ionicons key={`empty-${i}`} name="star-outline" size={16} color="#FFD700" />);
    }

    return stars;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Image source={require('../../assets/images/back_arrow.svg')} style={{ width: 24, height: 24 }} resizeMode="contain" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{merchant.name}</Text>
          <Text style={styles.headerSubtitle}>{merchant.distance} away</Text>
        </View>
        <View style={styles.statusIndicator}>
          <View style={[styles.statusDot, { backgroundColor: merchant.isOpen ? '#4CAF50' : '#f44336' }]} />
          <Text style={[styles.statusText, { color: merchant.isOpen ? '#4CAF50' : '#f44336' }]}>
            {merchant.isOpen ? 'Open' : 'Closed'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {merchant.images.map((image: string, index: number) => (
              <View key={index} style={styles.imagePlaceholder}>
                <View style={styles.imageIcon}>
                  <Ionicons name={getIconForType(merchant.type)} size={48} color="#4682B4" />
                </View>
                <Text style={styles.imagePlaceholderText}>{merchant.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.merchantName}>{merchant.name}</Text>
          <Text style={styles.merchantDescription}>{merchant.description}</Text>
          
          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>
              {renderStars(merchant.rating)}
            </View>
            <Text style={styles.ratingText}>{merchant.rating}/5.0 ({merchant.reviewCount} reviews)</Text>
          </View>
        </View>

        {/* Contact & Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact & Location</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="location" size={20} color="#4682B4" />
            <Text style={styles.infoText}>{merchant.address}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="call" size={20} color="#4682B4" />
            <Text style={styles.infoText}>{merchant.phone}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="mail" size={20} color="#4682B4" />
            <Text style={styles.infoText}>{merchant.email}</Text>
          </View>
        </View>

        {/* Operating Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Operating Hours</Text>
          {Object.entries(merchant.operatingHours).map(([day, hours]) => (
            <View key={day} style={[styles.hoursRow, day === getCurrentDay() && styles.todayRow]}>
              <Text style={[styles.dayText, day === getCurrentDay() && styles.todayText]}>
                {day.charAt(0).toUpperCase() + day.slice(1)}
              </Text>
              <Text style={[styles.hoursText, day === getCurrentDay() && styles.todayText]}>
                {hours}
              </Text>
            </View>
          ))}
        </View>

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.servicesContainer}>
            {merchant.services.map((service: string, index: number) => (
              <View key={index} style={styles.serviceTag}>
                <Text style={styles.serviceText}>{service}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Available Commodities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Items</Text>
          {merchant.commodities.map((commodity: any, index: number) => (
            <View key={index} style={styles.commodityRow}>
              <View style={styles.commodityInfo}>
                <Text style={styles.commodityName}>{commodity.name}</Text>
                <Text style={styles.commodityPrice}>{commodity.price}</Text>
              </View>
              <View style={[
                styles.availabilityTag,
                { backgroundColor: commodity.availability === 'In Stock' ? '#e8f5e8' : '#fff3e0' }
              ]}>
                <Text style={[
                  styles.availabilityText,
                  { color: commodity.availability === 'In Stock' ? '#4CAF50' : '#FF9800' }
                ]}>
                  {commodity.availability}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Spacer for bottom actions */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
          <Ionicons name="call" size={20} color="#4682B4" />
          <Text style={styles.actionText}>Call</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleEmail}>
          <Ionicons name="mail" size={20} color="#4682B4" />
          <Text style={styles.actionText}>Email</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionButton, styles.primaryAction]} onPress={handleDirections}>
          <Ionicons name="navigate" size={20} color="white" />
          <Text style={[styles.actionText, styles.primaryActionText]}>Directions</Text>
        </TouchableOpacity>
      </View>
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusIndicator: {
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    height: 200,
    backgroundColor: 'white',
  },
  imagePlaceholder: {
    width: width,
    height: 200,
    backgroundColor: '#f0f7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageIcon: {
    marginBottom: 10,
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: '#4682B4',
    fontWeight: '500',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  merchantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  merchantDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 15,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  todayRow: {
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 10,
    borderRadius: 5,
    borderBottomColor: 'transparent',
  },
  dayText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  todayText: {
    color: '#4682B4',
    fontWeight: '600',
  },
  hoursText: {
    fontSize: 15,
    color: '#666',
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceTag: {
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#4682B4',
  },
  serviceText: {
    fontSize: 14,
    color: '#4682B4',
    fontWeight: '500',
  },
  commodityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commodityInfo: {
    flex: 1,
  },
  commodityName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  commodityPrice: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 2,
  },
  availabilityTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bottomActions: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4682B4',
    backgroundColor: 'white',
  },
  primaryAction: {
    backgroundColor: '#4682B4',
    borderColor: '#4682B4',
  },
  actionText: {
    fontSize: 16,
    color: '#4682B4',
    fontWeight: '500',
    marginLeft: 6,
  },
  primaryActionText: {
    color: 'white',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 100,
  },
});