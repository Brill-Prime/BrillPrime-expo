import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Svg, Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// Mock commodity data
const COMMODITY_DATA = {
  "1": {
    id: "1",
    name: "Premium Petrol",
    category: "fuel",
    description: "High-quality premium unleaded petrol with enhanced engine cleaning additives. Suitable for all modern vehicles and provides optimal engine performance.",
    image: require('../../assets/images/consumer_order_fuel_icon.png'),
    unit: "per Liter",
    availability: "In Stock",
    merchants: [
      {
        id: "1",
        name: "Lagos Fuel Station",
        distance: "2.3 km",
        price: "₦650",
        originalPrice: "₦680",
        rating: 4.5,
        address: "Victoria Island, Lagos",
        isOpen: true,
        deliveryTime: "15-20 mins",
        stock: "Available"
      },
      {
        id: "4",
        name: "Lekki Phase 1 Fuel",
        distance: "4.2 km", 
        price: "₦645",
        originalPrice: "₦670",
        rating: 4.3,
        address: "Lekki Phase 1, Lagos",
        isOpen: true,
        deliveryTime: "25-30 mins",
        stock: "Available"
      },
      {
        id: "7",
        name: "Ikeja Fuel Hub",
        distance: "6.8 km",
        price: "₦660",
        originalPrice: "₦685",
        rating: 4.1,
        address: "Ikeja, Lagos",
        isOpen: false,
        deliveryTime: "35-40 mins",
        stock: "Limited"
      }
    ],
    specifications: [
      { label: "Octane Rating", value: "91 RON" },
      { label: "Sulfur Content", value: "< 50 ppm" },
      { label: "Additives", value: "Engine Cleaning Formula" },
      { label: "Storage", value: "Cool, dry place" }
    ],
    reviews: [
      { name: "Ahmed K.", rating: 5, comment: "Best fuel quality in Lagos. My car runs smoother.", date: "3 days ago" },
      { name: "Grace O.", rating: 4, comment: "Good price and availability. Fast delivery service.", date: "1 week ago" }
    ]
  },
  "2": {
    id: "2",
    name: "Fresh Tomatoes",
    category: "food",
    description: "Farm-fresh, locally sourced tomatoes. Perfect for cooking, salads, and garnishing. Rich in vitamins and antioxidants.",
    image: require('../../assets/images/order_fuel_icon.png'), // Using placeholder image
    unit: "per Kg",
    availability: "In Stock",
    merchants: [
      {
        id: "2",
        name: "Victoria Island Market",
        distance: "1.8 km",
        price: "₦800",
        originalPrice: "₦900",
        rating: 4.2,
        address: "Victoria Island, Lagos",
        isOpen: true,
        deliveryTime: "20-25 mins",
        stock: "Available"
      }
    ],
    specifications: [
      { label: "Origin", value: "Local Farms, Ogun State" },
      { label: "Grade", value: "Premium Grade A" },
      { label: "Shelf Life", value: "5-7 days" },
      { label: "Storage", value: "Cool, dry place" }
    ],
    reviews: [
      { name: "Kemi A.", rating: 5, comment: "Very fresh and tasty tomatoes. Great for stew!", date: "2 days ago" }
    ]
  }
};

export default function CommodityDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [commodity, setCommodity] = useState<any>(null);
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  const [quantity, setQuantity] = useState(1);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);

  useEffect(() => {
    loadCommodityDetails();
    loadCartItems();

    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    return () => subscription?.remove();
  }, [id]);

  const loadCommodityDetails = () => {
    if (id && COMMODITY_DATA[id as keyof typeof COMMODITY_DATA]) {
      const commodityData = COMMODITY_DATA[id as keyof typeof COMMODITY_DATA];
      setCommodity(commodityData);
      // Set cheapest available merchant as default
      const availableMerchants = commodityData.merchants.filter(m => m.isOpen);
      if (availableMerchants.length > 0) {
        const cheapest = availableMerchants.sort((a, b) => 
          parseInt(a.price.replace(/[^\d]/g, '')) - parseInt(b.price.replace(/[^\d]/g, ''))
        )[0];
        setSelectedMerchant(cheapest);
      } else {
        setSelectedMerchant(commodityData.merchants[0]);
      }
    }
  };

  const loadCartItems = async () => {
    try {
      const cartData = await AsyncStorage.getItem('cartItems');
      if (cartData) {
        setCartItems(JSON.parse(cartData));
      }
    } catch (error) {
      console.error('Error loading cart items:', error);
    }
  };

  const addToCart = async () => {
    if (!selectedMerchant || !commodity) {
      Alert.alert('Error', 'Please select a merchant first');
      return;
    }

    const cartItem = {
      id: `${commodity.id}_${selectedMerchant.id}_${Date.now()}`,
      commodityId: commodity.id,
      commodityName: commodity.name,
      merchantId: selectedMerchant.id,
      merchantName: selectedMerchant.name,
      price: parseFloat(selectedMerchant.price.replace('₦', '').replace(',', '')),
      quantity: quantity,
      unit: commodity.unit,
      image: commodity.image,
      category: commodity.category,
    };

    try {
      const updatedCart = [...cartItems, cartItem];
      await AsyncStorage.setItem('cartItems', JSON.stringify(updatedCart));
      setCartItems(updatedCart);
      setShowQuantityModal(false);

      Alert.alert(
        'Added to Cart', 
        `${quantity} ${commodity.unit} of ${commodity.name} added to cart`,
        [
          { text: 'Continue Shopping', style: 'cancel' },
          { text: 'View Cart', onPress: () => router.push('/cart') }
        ]
      );
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add item to cart');
    }
  };

  const handleAddToCart = () => {
    setShowQuantityModal(true);
  };

  const handleOrderNow = () => {
    if (!selectedMerchant || !selectedMerchant.isOpen) {
      Alert.alert('Error', 'Please select an available merchant first');
      return;
    }

    // Navigate to order screen with commodity details
    router.push({
      pathname: '/order',
      params: {
        commodityId: commodity.id,
        commodityName: commodity.name,
        commodityType: commodity.category,
        merchantId: selectedMerchant.id,
        merchantName: selectedMerchant.name,
        unitPrice: selectedMerchant.price.replace(/[^\d]/g, ''),
        unit: commodity.unit,
      }
    });
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleMerchantSelect = (merchant: any) => {
    setSelectedMerchant(merchant);
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= 99) {
      setQuantity(newQuantity);
    }
  };

  if (!commodity) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading commodity details...</Text>
      </View>
    );
  }

  const getTotalPrice = () => {
    if (!selectedMerchant) return 0;
    return parseInt(selectedMerchant.price.replace(/[^\d]/g, '')) * quantity;
  };

  const getBestPrice = () => {
    const prices = commodity.merchants.map((m: any) => parseInt(m.price.replace(/[^\d]/g, '')));
    return Math.min(...prices);
  };

  const renderMerchantItem = (merchant: any) => (
    <TouchableOpacity
      key={merchant.id}
      style={[
        styles.merchantCard,
        selectedMerchant?.id === merchant.id && styles.selectedMerchantCard,
        !merchant.isOpen && styles.closedMerchantCard
      ]}
      onPress={() => handleMerchantSelect(merchant)}
      disabled={!merchant.isOpen}
    >
      <View style={styles.merchantHeader}>
        <View style={styles.merchantInfo}>
          <Text style={[styles.merchantName, !merchant.isOpen && styles.closedText]}>
            {merchant.name}
          </Text>
          <Text style={[styles.merchantAddress, !merchant.isOpen && styles.closedText]}>
            {merchant.address} • {merchant.distance}
          </Text>
        </View>
        <View style={styles.merchantStatus}>
          {merchant.isOpen ? (
            <View style={styles.openBadge}>
              <Text style={styles.openText}>Open</Text>
            </View>
          ) : (
            <View style={styles.closedBadge}>
              <Text style={styles.closedBadgeText}>Closed</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.merchantDetails}>
        <View style={styles.priceContainer}>
          <Text style={[styles.currentPrice, !merchant.isOpen && styles.closedText]}>
            {merchant.price}/{commodity.unit.split(' ')[1]}
          </Text>
          {merchant.originalPrice !== merchant.price && (
            <Text style={styles.originalPrice}>₦{merchant.originalPrice}</Text>
          )}
        </View>

        <View style={styles.merchantMeta}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={[styles.ratingText, !merchant.isOpen && styles.closedText]}>
              {merchant.rating}
            </Text>
          </View>
          <Text style={[styles.deliveryTime, !merchant.isOpen && styles.closedText]}>
            {merchant.deliveryTime}
          </Text>
        </View>
      </View>

      {selectedMerchant?.id === merchant.id && merchant.isOpen && (
        <View style={styles.selectedIndicator}>
          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          <Text style={styles.selectedText}>Selected</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // Responsive styles
  const isSmallScreen = width < 768;
  const responsivePadding = isSmallScreen ? 15 : 20;
  const responsiveFontSize = {
    small: isSmallScreen ? 12 : 14,
    regular: isSmallScreen ? 14 : 16,
    large: isSmallScreen ? 18 : 20,
    xlarge: isSmallScreen ? 24 : 28,
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path
                d="M20 11H7.414L13.707 4.707L12.293 3.293L4.586 11L4 11.586L4.586 12.172L12.293 19.879L13.707 18.465L7.414 12.172H20V11Z"
                fill="#333"
              />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{commodity.name}</Text>
        </View>

        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image source={commodity.image} style={styles.productImage} resizeMode="contain" />
          <View style={styles.availabilityBadge}>
            <Text style={styles.availabilityText}>{commodity.availability}</Text>
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{commodity.name}</Text>
          <Text style={styles.productCategory}>{commodity.category.toUpperCase()}</Text>
          <Text style={styles.productDescription}>{commodity.description}</Text>

          <View style={styles.priceHighlight}>
            <Text style={styles.bestPriceLabel}>Best Price:</Text>
            <Text style={styles.bestPriceValue}>₦{getBestPrice()}/{commodity.unit.split(' ')[1]}</Text>
          </View>
        </View>

        {/* Quantity Selector */}
        <View style={styles.quantitySection}>
          <Text style={styles.sectionTitle}>Quantity</Text>
          <View style={styles.quantitySelector}>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
            >
              <Ionicons name="remove" size={20} color={quantity <= 1 ? "#ccc" : "#4682B4"} />
            </TouchableOpacity>
            <View style={styles.quantityDisplay}>
              <Text style={styles.quantityText}>{quantity}</Text>
              <Text style={styles.quantityUnit}>{commodity.unit}</Text>
            </View>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(1)}
              disabled={quantity >= 99}
            >
              <Ionicons name="add" size={20} color={quantity >= 99 ? "#ccc" : "#4682B4"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Available Merchants */}
        <View style={styles.merchantsSection}>
          <Text style={styles.sectionTitle}>Available at ({commodity.merchants.length} locations)</Text>
          {commodity.merchants.map(renderMerchantItem)}
        </View>

        {/* Specifications */}
        <View style={styles.specsSection}>
          <Text style={styles.sectionTitle}>Specifications</Text>
          {commodity.specifications.map((spec: any, index: number) => (
            <View key={index} style={styles.specRow}>
              <Text style={styles.specLabel}>{spec.label}</Text>
              <Text style={styles.specValue}>{spec.value}</Text>
            </View>
          ))}
        </View>

        {/* Reviews */}
        <View style={styles.reviewsSection}>
          <Text style={styles.sectionTitle}>Customer Reviews</Text>
          {commodity.reviews.map((review: any, index: number) => (
            <View key={index} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewerName}>{review.name}</Text>
                <Text style={styles.reviewDate}>{review.date}</Text>
              </View>
              <View style={styles.reviewRating}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Ionicons 
                    key={i} 
                    name="star" 
                    size={14} 
                    color={i < review.rating ? "#FFD700" : "#e0e0e0"} 
                  />
                ))}
              </View>
              <Text style={styles.reviewComment}>{review.comment}</Text>
            </View>
          ))}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>₦{getTotalPrice().toLocaleString()}</Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[
              styles.addToCartButton,
              (!selectedMerchant || !selectedMerchant.isOpen) && styles.disabledButton
            ]}
            onPress={handleAddToCart}
            disabled={!selectedMerchant || !selectedMerchant.isOpen}
          >
            <Ionicons name="cart" size={20} color="#fff" />
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.orderNowButton,
              (!selectedMerchant || !selectedMerchant.isOpen) && styles.disabledButton
            ]}
            onPress={handleOrderNow}
            disabled={!selectedMerchant || !selectedMerchant.isOpen}
          >
            <Ionicons name="flash" size={20} color="#fff" />
            <Text style={styles.orderNowText}>Order Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  imageContainer: {
    backgroundColor: 'white',
    alignItems: 'center',
    paddingVertical: 30,
    position: 'relative',
  },
  productImage: {
    width: 200,
    height: 200,
  },
  availabilityBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availabilityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  productInfo: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 10,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  productCategory: {
    fontSize: 12,
    color: '#4682B4',
    fontWeight: '600',
    marginBottom: 10,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  priceHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    padding: 12,
    borderRadius: 8,
  },
  bestPriceLabel: {
    fontSize: 14,
    color: '#4682B4',
    fontWeight: '500',
  },
  bestPriceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4682B4',
    marginLeft: 10,
  },
  quantitySection: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    padding: 5,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityDisplay: {
    alignItems: 'center',
    marginHorizontal: 30,
  },
  quantityText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  quantityUnit: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  merchantsSection: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 10,
  },
  merchantCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedMerchantCard: {
    borderColor: '#4CAF50',
    backgroundColor: '#f0fff0',
  },
  closedMerchantCard: {
    opacity: 0.6,
  },
  merchantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  merchantInfo: {
    flex: 1,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  merchantAddress: {
    fontSize: 12,
    color: '#666',
  },
  merchantStatus: {
    marginLeft: 10,
  },
  openBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  openText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500',
  },
  closedBadge: {
    backgroundColor: '#f44336',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  closedBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500',
  },
  closedText: {
    color: '#999',
  },
  merchantDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  merchantMeta: {
    alignItems: 'flex-end',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  deliveryTime: {
    fontSize: 12,
    color: '#4682B4',
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  selectedText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 5,
  },
  specsSection: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 10,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  specLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  specValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  reviewsSection: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 10,
  },
  reviewCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  reviewRating: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  reviewComment: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  bottomSpacing: {
    height: 100,
  },
  bottomBar: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  totalContainer: {
    marginBottom: 15,
  },
  totalLabel: {
    fontSize: 12,
    color: '#666',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  addToCartButton: {
    backgroundColor: '#4682B4',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  orderNowButton: {
    backgroundColor: '#2e67c7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  addToCartText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  orderNowText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 20,
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#2f75c2',
    borderRadius: 25,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  favoriteText: {
    color: '#2f75c2',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f39c12',
    borderRadius: 25,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  cartText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  orderButton: {
    backgroundColor: '#2f75c2',
    borderRadius: 25,
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    minWidth: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1b1b1b',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  quantityButton: {
    backgroundColor: '#2f75c2',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    width: 80,
    height: 40,
    textAlign: 'center',
    fontSize: 16,
    marginHorizontal: 15,
  },
  quantityUnit: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 15,
  },
  modalCancelButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalCancelText: {
    color: '#666',
    fontWeight: 'bold',
  },
  modalConfirmButton: {
    backgroundColor: '#2f75c2',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  modalConfirmText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});