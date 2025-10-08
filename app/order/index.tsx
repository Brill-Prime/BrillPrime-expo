
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OrderData {
  commodityId: string;
  commodityName: string;
  commodityType: string;
  merchantId: string;
  merchantName: string;
  deliveryType: 'yourself' | 'someone_else';
  recipientName?: string;
  recipientPhone?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  location: string;
  coordinates?: { latitude: number; longitude: number };
  notes?: string;
}

export default function OrderScreen() {
  const router = useRouter();
  const { commodityId, commodityName, commodityType, merchantId, merchantName, unitPrice, unit } = useLocalSearchParams();
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  
  // Order state
  const [deliveryType, setDeliveryType] = useState<'yourself' | 'someone_else'>('yourself');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserLocation();
    
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const loadUserLocation = async () => {
    try {
      const savedAddress = await AsyncStorage.getItem('userAddress');
      if (savedAddress) {
        setLocation(savedAddress);
      }
    } catch (error) {
      console.error('Error loading user location:', error);
    }
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= 100) {
      setQuantity(newQuantity);
    }
  };

  const getTotalAmount = () => {
    const price = parseFloat(unitPrice as string) || 0;
    return price * quantity;
  };

  const getDeliveryIcon = (type: string) => {
    return type === 'yourself' ? 'person-outline' : 'people-outline';
  };

  const getCommodityIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'fuel': return 'car-outline';
      case 'food': return 'restaurant-outline';
      case 'groceries': return 'bag-outline';
      case 'medicine': return 'medical-outline';
      case 'electronics': return 'phone-portrait-outline';
      default: return 'cube-outline';
    }
  };

  const validateOrder = () => {
    if (!location.trim()) {
      Alert.alert('Location Required', 'Please provide a delivery location');
      return false;
    }

    if (deliveryType === 'someone_else') {
      if (!recipientName.trim()) {
        Alert.alert('Recipient Name Required', 'Please provide the recipient\'s name');
        return false;
      }
      if (!recipientPhone.trim()) {
        Alert.alert('Recipient Phone Required', 'Please provide the recipient\'s phone number');
        return false;
      }
    }

    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateOrder()) return;

    setLoading(true);

    try {
      const orderData: OrderData = {
        commodityId: commodityId as string,
        commodityName: commodityName as string,
        commodityType: commodityType as string,
        merchantId: merchantId as string,
        merchantName: merchantName as string,
        deliveryType,
        recipientName: deliveryType === 'someone_else' ? recipientName : undefined,
        recipientPhone: deliveryType === 'someone_else' ? recipientPhone : undefined,
        quantity,
        unit: unit as string,
        unitPrice: parseFloat(unitPrice as string),
        location,
        notes,
      };

      // Save order data for confirmation screen
      await AsyncStorage.setItem('pendingOrder', JSON.stringify(orderData));

      // Navigate to confirmation screen
      router.push('/checkout/confirmation');
    } catch (error) {
      console.error('Error preparing order:', error);
      Alert.alert('Error', 'Failed to prepare order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const responsivePadding = Math.max(20, screenDimensions.width * 0.05);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: responsivePadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#0c1a2a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order {commodityName}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: responsivePadding }}>
          {/* Order Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.commodityHeader}>
              <Ionicons 
                name={getCommodityIcon(commodityType as string)} 
                size={40} 
                color="#2e67c7" 
              />
              <View style={styles.commodityInfo}>
                <Text style={styles.commodityName}>{commodityName}</Text>
                <Text style={styles.merchantName}>From {merchantName}</Text>
                <Text style={styles.unitPrice}>₦{unitPrice}/{unit}</Text>
              </View>
            </View>
          </View>

          {/* Delivery Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Who is this order for?</Text>
            <View style={styles.deliveryOptions}>
              <TouchableOpacity
                style={[
                  styles.deliveryOption,
                  deliveryType === 'yourself' && styles.activeOption
                ]}
                onPress={() => setDeliveryType('yourself')}
              >
                <Ionicons 
                  name={getDeliveryIcon('yourself')} 
                  size={32} 
                  color={deliveryType === 'yourself' ? '#2e67c7' : '#666'} 
                />
                <Text style={[
                  styles.optionTitle,
                  deliveryType === 'yourself' && styles.activeOptionText
                ]}>
                  For Yourself
                </Text>
                <Text style={styles.optionSubtitle}>
                  You'll receive this order
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.deliveryOption,
                  deliveryType === 'someone_else' && styles.activeOption
                ]}
                onPress={() => setDeliveryType('someone_else')}
              >
                <Ionicons 
                  name={getDeliveryIcon('someone_else')} 
                  size={32} 
                  color={deliveryType === 'someone_else' ? '#2e67c7' : '#666'} 
                />
                <Text style={[
                  styles.optionTitle,
                  deliveryType === 'someone_else' && styles.activeOptionText
                ]}>
                  For Someone Else
                </Text>
                <Text style={styles.optionSubtitle}>
                  Send to another person
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recipient Details (only if ordering for someone else) */}
          {deliveryType === 'someone_else' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recipient Details</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Recipient Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter recipient's full name"
                  value={recipientName}
                  onChangeText={setRecipientName}
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Recipient Phone</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter recipient's phone number"
                  value={recipientPhone}
                  onChangeText={setRecipientPhone}
                  keyboardType="phone-pad"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          )}

          {/* Quantity Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
              >
                <Ionicons 
                  name="remove" 
                  size={20} 
                  color={quantity <= 1 ? "#ccc" : "#2e67c7"} 
                />
              </TouchableOpacity>
              
              <View style={styles.quantityDisplay}>
                <Text style={styles.quantityText}>{quantity}</Text>
                <Text style={styles.quantityUnit}>{unit}</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={() => handleQuantityChange(1)}
              >
                <Ionicons name="add" size={20} color="#2e67c7" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Delivery Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Location</Text>
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={20} color="#2e67c7" />
              <TextInput
                style={styles.locationInput}
                placeholder="Enter delivery address"
                value={location}
                onChangeText={setLocation}
                placeholderTextColor="#999"
                multiline
              />
            </View>
          </View>

          {/* Special Instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Instructions (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add any special delivery instructions..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              placeholderTextColor="#999"
            />
          </View>

          {/* Price Summary */}
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Unit Price:</Text>
              <Text style={styles.priceValue}>₦{unitPrice}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Quantity:</Text>
              <Text style={styles.priceValue}>{quantity} {unit}</Text>
            </View>
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Amount:</Text>
              <Text style={styles.totalValue}>₦{getTotalAmount().toLocaleString()}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Order Button */}
      <View style={[styles.footer, { paddingHorizontal: responsivePadding }]}>
        <TouchableOpacity 
          style={[styles.orderButton, loading && styles.disabledButton]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          <Text style={styles.orderButtonText}>
            {loading ? 'Processing...' : `Place Order - ₦${getTotalAmount().toLocaleString()}`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    fontFamily: 'Montserrat-Regular',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0c1a2a',
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Montserrat-Bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  commodityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commodityInfo: {
    flex: 1,
    marginLeft: 15,
  },
  commodityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0c1a2a',
    marginBottom: 4,
    fontFamily: 'Montserrat-Bold',
  },
  merchantName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'Montserrat-Regular',
  },
  unitPrice: {
    fontSize: 16,
    color: '#2e67c7',
    fontWeight: '600',
    fontFamily: 'Montserrat-SemiBold',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0c1a2a',
    marginBottom: 15,
    fontFamily: 'Montserrat-Bold',
  },
  deliveryOptions: {
    flexDirection: 'row',
    gap: 15,
  },
  deliveryOption: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  activeOption: {
    borderColor: '#2e67c7',
    backgroundColor: '#f8f9ff',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
    marginBottom: 5,
    textAlign: 'center',
    fontFamily: 'Montserrat-SemiBold',
  },
  activeOptionText: {
    color: '#2e67c7',
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Montserrat-Regular',
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'Montserrat-SemiBold',
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
    padding: 15,
    fontSize: 16,
    color: '#333',
    fontFamily: 'Montserrat-Regular',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 50,
    padding: 10,
  },
  quantityButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  quantityDisplay: {
    alignItems: 'center',
    marginHorizontal: 30,
  },
  quantityText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0c1a2a',
    fontFamily: 'Montserrat-Bold',
  },
  quantityUnit: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Montserrat-Regular',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
    padding: 15,
  },
  locationInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
    fontFamily: 'Montserrat-Regular',
  },
  notesInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
    padding: 15,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
    fontFamily: 'Montserrat-Regular',
  },
  priceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Montserrat-Regular',
  },
  priceValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    fontFamily: 'Montserrat-SemiBold',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 15,
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0c1a2a',
    fontFamily: 'Montserrat-Bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4682B4',
    fontFamily: 'Montserrat-Bold',
  },
  footer: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  orderButton: {
    backgroundColor: '#4682B4',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
  },
  orderButtonHover: {
    backgroundColor: '#0B1A51',
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Montserrat-Bold',
  },
});
