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
import { Svg, Path } from 'react-native-svg';

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
    reviews: [
      { name: "John Doe", rating: 5, comment: "Excellent service and competitive prices. Highly recommended!", date: "2 days ago" },
      { name: "Sarah Johnson", rating: 4, comment: "Good fuel quality but sometimes busy during peak hours.", date: "1 week ago" },
      { name: "Mike Chen", rating: 5, comment: "Clean facility and friendly staff. Always my go-to station.", date: "2 weeks ago" }
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
    reviews: [
      { name: "Adaora Okafor", rating: 4, comment: "Fresh produce and reasonable prices. Love shopping here.", date: "3 days ago" },
      { name: "David Williams", rating: 5, comment: "Great selection of local ingredients. Very authentic!", date: "1 week ago" }
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
    reviews: [
      { name: "Grace Okoro", rating: 5, comment: "Amazing shopping experience! Great variety of stores and excellent customer service.", date: "1 day ago" },
      { name: "James Smith", rating: 4, comment: "Good mall with lots of options. Parking can be challenging during weekends.", date: "4 days ago" },
      { name: "Fatima Abdul", rating: 5, comment: "Love the food court and the electronics section. Always find what I need.", date: "1 week ago" }
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
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="business-outline" size={64} color="#ccc" />
        <Text style={styles.loadingText}>Loading merchant details...</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCall = () => {
    if (!merchant.phone) {
      Alert.alert("Error", "Phone number not available");
      return;
    }
    
    Alert.alert(
      "Call Merchant",
      `Would you like to call ${merchant.name}?\n${merchant.phone}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Call Now",
          onPress: () => {
            const phoneUrl = `tel:${merchant.phone.replace(/[^0-9+]/g, '')}`;
            Linking.canOpenURL(phoneUrl).then((supported) => {
              if (supported) {
                Linking.openURL(phoneUrl);
              } else {
                Alert.alert("Error", "Phone calling is not supported on this device");
              }
            }).catch(() => {
              Alert.alert("Error", "Unable to make phone call");
            });
          }
        }
      ]
    );
  };

  const handleEmail = () => {
    if (!merchant.email) {
      Alert.alert("Error", "Email address not available");
      return;
    }
    
    const emailUrl = `mailto:${merchant.email}?subject=Inquiry about ${merchant.name}&body=Hello, I would like to inquire about your services.`;
    Linking.canOpenURL(emailUrl).then((supported) => {
      if (supported) {
        Linking.openURL(emailUrl);
      } else {
        Alert.alert("Error", "Email client is not available on this device");
      }
    }).catch(() => {
      Alert.alert("Error", "Unable to open email client");
    });
  };

  const handleDirections = () => {
    if (!merchant.address) {
      Alert.alert("Error", "Address not available");
      return;
    }
    
    const address = encodeURIComponent(merchant.address);
    const mapsUrl = Platform.OS === 'ios' 
      ? `http://maps.apple.com/?daddr=${address}`
      : `https://www.google.com/maps/dir/?api=1&destination=${address}`;
    
    Linking.canOpenURL(mapsUrl).then((supported) => {
      if (supported) {
        Linking.openURL(mapsUrl);
      } else {
        Alert.alert("Error", "Maps application is not available on this device");
      }
    }).catch(() => {
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
      case "electronics": return "phone-portrait";
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
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <Path
              d="M20 11H7.414L13.707 4.707L12.293 3.293L4.586 11L4 11.586L4.586 12.172L12.293 19.879L13.707 18.465L7.414 12.172H20V11Z"
              fill="#333"
            />
          </Svg>
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
              <TouchableOpacity key={index} style={styles.imageWrapper} onPress={() => setSelectedImageIndex(index)}>
                <Image 
                  source={{ uri: image }} 
                  style={styles.merchantImage}
                  defaultSource={require('../../assets/images/logo.png')}
                />
                <View style={styles.imageOverlay}>
                  <Ionicons name={getIconForType(merchant.type)} size={32} color="rgba(255,255,255,0.8)" />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {merchant.images.length > 1 && (
            <View style={styles.imageIndicators}>
              {merchant.images.map((_: string, index: number) => (
                <View 
                  key={index} 
                  style={[
                    styles.indicator, 
                    selectedImageIndex === index && styles.activeIndicator
                  ]} 
                />
              ))}
            </View>
          )}
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

        {/* Customer Reviews */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Reviews</Text>
          {merchant.reviews && merchant.reviews.length > 0 ? (
            merchant.reviews.map((review: any, index: number) => (
              <View key={index} style={styles.reviewRow}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>{review.name}</Text>
                  <View style={styles.reviewStars}>
                    {renderStars(review.rating)}
                  </View>
                </View>
                <Text style={styles.reviewText}>{review.comment}</Text>
                <Text style={styles.reviewDate}>{review.date}</Text>
              </View>
            ))
          ) : (
            <View style={styles.noReviewsContainer}>
              <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
              <Text style={styles.noReviewsText}>No reviews yet</Text>
              <Text style={styles.noReviewsSubtext}>Be the first to leave a review!</Text>
            </View>
          )}
          {merchant.reviews && merchant.reviews.length > 0 && (
            <TouchableOpacity style={styles.viewAllReviewsButton} onPress={() => {
              Alert.alert(
                "All Reviews",
                `View all ${merchant.reviewCount || merchant.reviews.length} reviews for ${merchant.name}`,
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "View All", onPress: () => {
                    Alert.alert("Coming Soon", "Full reviews screen will be available in the next update!");
                  }}
                ]
              );
            }}>
              <Text style={styles.viewAllReviewsText}>View All {merchant.reviewCount || merchant.reviews.length} Reviews</Text>
              <Ionicons name="chevron-forward" size={16} color="#4682B4" />
            </TouchableOpacity>
          )}
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
  imageWrapper: {
    width: width,
    height: 200,
    position: 'relative',
  },
  merchantImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f7ff',
  },
  imageOverlay: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 8,
    borderRadius: 20,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  activeIndicator: {
    backgroundColor: 'white',
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 20,
  },
  retryButton: {
    backgroundColor: '#4682B4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  reviewRow: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  reviewStars: {
    flexDirection: 'row',
  },
  reviewText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  noReviewsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noReviewsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginTop: 15,
  },
  noReviewsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  viewAllReviewsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  viewAllReviewsText: {
    fontSize: 14,
    color: '#4682B4',
    fontWeight: '500',
    marginRight: 6,
  },
});