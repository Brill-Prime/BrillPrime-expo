
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FuelType {
  id: string;
  name: string;
  rate: number;
  unit: string;
  icon: string;
  available: boolean;
}

interface DeliveryOption {
  id: 'yourself' | 'someone';
  title: string;
  icon: string;
}

export default function FuelOrderScreen() {
  const router = useRouter();
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState<'yourself' | 'someone'>('yourself');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedFuelType, setSelectedFuelType] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('');
  const [userLocation, setUserLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const deliveryOptions: DeliveryOption[] = [
    { id: 'yourself', title: 'For yourself', icon: 'person-outline' },
    { id: 'someone', title: 'For someone', icon: 'people-outline' }
  ];

  const fuelTypes: FuelType[] = [
    { id: 'petrol', name: 'Petrol', rate: 850, unit: 'ltr', icon: '⛽', available: true },
    { id: 'diesel', name: 'Diesel', rate: 920, unit: 'ltr', icon: '🚛', available: true },
    { id: 'cng', name: 'CNG', rate: 450, unit: 'Kg', icon: '🔋', available: false },
    { id: 'lpg', name: 'LPG', rate: 650, unit: 'Kg', icon: '🔥', available: true }
  ];

  useEffect(() => {
    loadUserLocation();
    
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const loadUserLocation = async () => {
    try {
      const savedLocation = await AsyncStorage.getItem('userLocation');
      if (savedLocation) {
        setUserLocation(savedLocation);
        setDeliveryAddress(savedLocation);
      }
    } catch (error) {
      console.error('Error loading user location:', error);
    }
  };

  const handleDeliveryOptionChange = (option: 'yourself' | 'someone') => {
    setSelectedDeliveryOption(option);
    if (option === 'yourself' && userLocation) {
      setDeliveryAddress(userLocation);
    } else if (option === 'someone') {
      setDeliveryAddress('');
    }
  };

  const handleFuelTypeSelect = (fuelId: string) => {
    const fuel = fuelTypes.find(f => f.id === fuelId);
    if (fuel && !fuel.available) {
      Alert.alert('Unavailable', `${fuel.name} is currently not available in your area.`);
      return;
    }
    setSelectedFuelType(fuelId);
  };

  const calculateTotal = () => {
    if (!selectedFuelType || !quantity) return 0;
    const fuel = fuelTypes.find(f => f.id === selectedFuelType);
    return fuel ? fuel.rate * parseFloat(quantity || '0') : 0;
  };

  const validateOrder = () => {
    if (!deliveryAddress.trim()) {
      Alert.alert('Address Required', 'Please enter a delivery address.');
      return false;
    }
    
    if (!selectedFuelType) {
      Alert.alert('Fuel Type Required', 'Please select a fuel type.');
      return false;
    }
    
    const quantityNum = parseFloat(quantity);
    if (!quantity || quantityNum <= 0) {
      Alert.alert('Quantity Required', 'Please enter a valid quantity.');
      return false;
    }
    
    if (quantityNum < 5) {
      Alert.alert('Minimum Order', 'Minimum order quantity is 5 litres/kg.');
      return false;
    }
    
    if (quantityNum > 200) {
      Alert.alert('Maximum Order', 'Maximum order quantity is 200 litres/kg.');
      return false;
    }
    
    return true;
  };

  const handleNext = async () => {
    if (!validateOrder()) return;
    
    setLoading(true);
    
    try {
      const selectedFuel = fuelTypes.find(f => f.id === selectedFuelType);
      const orderData = {
        deliveryType: selectedDeliveryOption,
        deliveryAddress: deliveryAddress.trim(),
        fuelType: selectedFuel,
        quantity: parseFloat(quantity),
        totalAmount: calculateTotal(),
        orderDate: new Date().toISOString(),
      };
      
      // Save order data for the next step
      await AsyncStorage.setItem('pendingFuelOrder', JSON.stringify(orderData));
      
      // Navigate to order confirmation/payment screen
      router.push('/checkout/fuel-confirmation');
      
    } catch (error) {
      console.error('Error processing order:', error);
      Alert.alert('Error', 'Failed to process order. Please try again.');
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
        <Text style={styles.headerTitle}>Order Fuel Delivery</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: responsivePadding }}>
          
          {/* Delivery Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Option</Text>
            <View style={styles.deliveryOptions}>
              {deliveryOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.deliveryOption,
                    selectedDeliveryOption === option.id && styles.selectedDeliveryOption
                  ]}
                  onPress={() => handleDeliveryOptionChange(option.id)}
                >
                  <Ionicons 
                    name={option.icon as any} 
                    size={32} 
                    color={selectedDeliveryOption === option.id ? "#2f75c2" : "#666"} 
                  />
                  <Text style={[
                    styles.deliveryOptionText,
                    selectedDeliveryOption === option.id && styles.selectedDeliveryOptionText
                  ]}>
                    {option.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Delivery Address */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TextInput
              style={styles.addressInput}
              placeholder="Choose your location..."
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Fuel Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fuel Type</Text>
            <View style={styles.fuelTypes}>
              {fuelTypes.map((fuel) => (
                <TouchableOpacity
                  key={fuel.id}
                  style={[
                    styles.fuelType,
                    selectedFuelType === fuel.id && styles.selectedFuelType,
                    !fuel.available && styles.unavailableFuelType
                  ]}
                  onPress={() => handleFuelTypeSelect(fuel.id)}
                  disabled={!fuel.available}
                >
                  <Text style={styles.fuelIcon}>{fuel.icon}</Text>
                  <Text style={[
                    styles.fuelName,
                    selectedFuelType === fuel.id && styles.selectedFuelName,
                    !fuel.available && styles.unavailableFuelName
                  ]}>
                    {fuel.name}
                  </Text>
                  <Text style={[
                    styles.fuelRate,
                    !fuel.available && styles.unavailableFuelRate
                  ]}>
                    {fuel.available ? `Rate: ₦${fuel.rate}/${fuel.unit}` : 'Unavailable'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Quantity Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <View style={styles.quantitySection}>
              <TextInput
                style={styles.quantityInput}
                placeholder="0"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
              />
              <Text style={styles.quantityUnit}>
                {selectedFuelType ? 
                  `${fuelTypes.find(f => f.id === selectedFuelType)?.unit}(s)` : 
                  'Unit(s)'
                }
              </Text>
            </View>

            {/* Total Amount Display */}
            {quantity && selectedFuelType && (
              <View style={styles.totalDisplay}>
                <Text style={styles.totalLabel}>Total Amount:</Text>
                <Text style={styles.totalAmount}>₦{calculateTotal().toLocaleString()}</Text>
              </View>
            )}
          </View>

          {/* Order Guidelines */}
          <View style={styles.guidelines}>
            <Text style={styles.guidelinesTitle}>Order Guidelines:</Text>
            <Text style={styles.guidelineText}>• Minimum order: 5 litres/kg</Text>
            <Text style={styles.guidelineText}>• Maximum order: 200 litres/kg</Text>
            <Text style={styles.guidelineText}>• Delivery time: 30-45 minutes</Text>
            <Text style={styles.guidelineText}>• Payment on delivery available</Text>
          </View>

          {/* Next Button */}
          <TouchableOpacity 
            style={[
              styles.nextButton,
              (!deliveryAddress || !selectedFuelType || !quantity || loading) && styles.disabledButton
            ]}
            onPress={handleNext}
            disabled={!deliveryAddress || !selectedFuelType || !quantity || loading}
          >
            <Text style={styles.nextButtonText}>
              {loading ? 'Processing...' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 15,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0c1a2a',
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Montserrat',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#0c1a2a',
    fontFamily: 'Montserrat',
  },
  deliveryOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  deliveryOption: {
    flex: 1,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  selectedDeliveryOption: {
    borderColor: '#2f75c2',
    backgroundColor: '#f0f7ff',
  },
  deliveryOptionText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontFamily: 'Montserrat',
  },
  selectedDeliveryOptionText: {
    color: '#2f75c2',
    fontWeight: '600',
  },
  addressInput: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 25,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    fontFamily: 'Montserrat',
    textAlignVertical: 'top',
  },
  fuelTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  fuelType: {
    width: '48%',
    padding: 15,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  selectedFuelType: {
    borderColor: '#2f75c2',
    backgroundColor: '#f0f7ff',
  },
  unavailableFuelType: {
    backgroundColor: '#f8f8f8',
    opacity: 0.6,
  },
  fuelIcon: {
    fontSize: 30,
    marginBottom: 8,
  },
  fuelName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: '#333',
    fontFamily: 'Montserrat',
  },
  selectedFuelName: {
    color: '#2f75c2',
    fontWeight: '600',
  },
  unavailableFuelName: {
    color: '#999',
  },
  fuelRate: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Montserrat',
  },
  unavailableFuelRate: {
    color: '#999',
  },
  quantitySection: {
    alignItems: 'center',
  },
  quantityInput: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 25,
    padding: 15,
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: '#fff',
    width: '100%',
    fontFamily: 'Montserrat',
  },
  quantityUnit: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    fontFamily: 'Montserrat',
  },
  totalDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    padding: 15,
    backgroundColor: '#f0f7ff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2f75c2',
  },
  totalLabel: {
    fontSize: 16,
    color: '#2f75c2',
    fontFamily: 'Montserrat',
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 18,
    color: '#2f75c2',
    fontFamily: 'Montserrat',
    fontWeight: '700',
  },
  guidelines: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  guidelinesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0c1a2a',
    marginBottom: 10,
    fontFamily: 'Montserrat',
  },
  guidelineText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    fontFamily: 'Montserrat',
  },
  nextButton: {
    backgroundColor: '#2f75c2',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    marginBottom: 30,
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Montserrat',
  },
});
