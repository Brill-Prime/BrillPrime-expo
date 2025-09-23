import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FuelOrderData {
  deliveryType: 'yourself' | 'someone';
  deliveryAddress: string;
  fuelType: {
    id: string;
    name: string;
    rate: number;
    unit: string;
    icon: string;
  };
  quantity: number;
  totalAmount: number;
  orderDate: string;
}

interface PaymentMethod {
  id: string;
  type: string;
  title: string;
  icon: string;
  available: boolean;
}

export default function FuelConfirmationScreen() {
  const router = useRouter();
  const [orderData, setOrderData] = useState<FuelOrderData | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('card');
  const [loading, setLoading] = useState(false);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));

  const deliveryFee = 500;
  const serviceFee = 200;

  const paymentMethods: PaymentMethod[] = [
    { id: 'card', type: 'card', title: 'Credit/Debit Card', icon: 'card-outline', available: true },
    { id: 'bank', type: 'bank', title: 'Bank Transfer', icon: 'business-outline', available: true },
    { id: 'cash', type: 'cash', title: 'Cash on Delivery', icon: 'cash-outline', available: true },
    { id: 'wallet', type: 'wallet', title: 'Digital Wallet', icon: 'wallet-outline', available: false },
  ];

  useEffect(() => {
    loadOrderData();

    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const loadOrderData = async () => {
    try {
      const data = await AsyncStorage.getItem('pendingFuelOrder');
      if (data) {
        setOrderData(JSON.parse(data));
      } else {
        Alert.alert('Error', 'Order data not found');
        router.back();
      }
    } catch (error) {
      console.error('Error loading order data:', error);
      Alert.alert('Error', 'Failed to load order details');
      router.back();
    }
  };

  const getTotalAmount = () => {
    if (!orderData) return 0;
    return orderData.totalAmount + deliveryFee + serviceFee;
  };

  const handlePaymentMethodSelect = (methodId: string) => {
    const method = paymentMethods.find(m => m.id === methodId);
    if (method && !method.available) {
      Alert.alert('Unavailable', `${method.title} is currently not available.`);
      return;
    }
    setSelectedPaymentMethod(methodId);
  };

  const handlePlaceOrder = async () => {
    if (!orderData) return;

    setLoading(true);

    try {
      const finalOrder = {
        id: `FUEL${Date.now()}`,
        type: 'fuel',
        ...orderData,
        paymentMethod: paymentMethods.find(m => m.id === selectedPaymentMethod)?.title,
        deliveryFee,
        serviceFee,
        finalAmount: getTotalAmount(),
        status: 'pending',
        estimatedDelivery: new Date(Date.now() + 45 * 60000).toISOString(), // 45 minutes from now
      };

      // Save order to storage (in real app, send to API)
      const existingOrders = await AsyncStorage.getItem('userOrders');
      const orders = existingOrders ? JSON.parse(existingOrders) : [];
      orders.push(finalOrder);
      await AsyncStorage.setItem('userOrders', JSON.stringify(orders));

      // Clear pending order
      await AsyncStorage.removeItem('pendingFuelOrder');

      Alert.alert(
        'Order Placed Successfully!',
        `Your fuel order #${finalOrder.id} has been placed. Expected delivery in 45 minutes.`,
        [
          {
            text: 'Track Order',
            onPress: () => router.replace(`/orders/order-details?id=${finalOrder.id}`)
          }
        ]
      );
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditOrder = () => {
    router.back();
  };

  if (!orderData) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading order details...</Text>
      </View>
    );
  }

  const responsivePadding = Math.max(20, screenDimensions.width * 0.05);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: responsivePadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#0c1a2a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Order</Text>
        <TouchableOpacity onPress={handleEditOrder} style={styles.editButton}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: responsivePadding }}>

          {/* Order Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderIcon}>{orderData.fuelType.icon}</Text>
                <View style={styles.orderInfo}>
                  <Text style={styles.fuelName}>{orderData.fuelType.name}</Text>
                  <Text style={styles.fuelDetails}>
                    {orderData.quantity} {orderData.fuelType.unit}(s) × ₦{orderData.fuelType.rate}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>₦{orderData.totalAmount.toLocaleString()}</Text>
              </View>
            </View>
          </View>

          {/* Delivery Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Details</Text>
            <View style={styles.deliveryCard}>
              <View style={styles.deliveryRow}>
                <Ionicons name="person-outline" size={20} color="#666" />
                <Text style={styles.deliveryLabel}>Delivery Type:</Text>
                <Text style={styles.deliveryValue}>
                  {orderData.deliveryType === 'yourself' ? 'For yourself' : 'For someone'}
                </Text>
              </View>
              <View style={styles.deliveryRow}>
                <Ionicons name="location-outline" size={20} color="#666" />
                <Text style={styles.deliveryLabel}>Address:</Text>
                <Text style={styles.deliveryValue}>{orderData.deliveryAddress}</Text>
              </View>
              <View style={styles.deliveryRow}>
                <Ionicons name="time-outline" size={20} color="#666" />
                <Text style={styles.deliveryLabel}>Estimated Time:</Text>
                <Text style={styles.deliveryValue}>30-45 minutes</Text>
              </View>
            </View>
          </View>

          {/* Payment Method */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethod,
                  selectedPaymentMethod === method.id && styles.selectedPaymentMethod,
                  !method.available && styles.unavailablePaymentMethod
                ]}
                onPress={() => handlePaymentMethodSelect(method.id)}
                disabled={!method.available}
              >
                <Ionicons 
                  name={method.icon as any} 
                  size={24} 
                  color={selectedPaymentMethod === method.id ? "#4682B4" : "#666"} 
                />
                <Text style={[
                  styles.paymentText,
                  selectedPaymentMethod === method.id && styles.selectedPaymentText,
                  !method.available && styles.unavailablePaymentText
                ]}>
                  {method.title}
                </Text>
                {!method.available && (
                  <Text style={styles.unavailableLabel}>Unavailable</Text>
                )}
                {selectedPaymentMethod === method.id && method.available && (
                  <Ionicons name="checkmark-circle" size={20} color="#4682B4" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Cost Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cost Breakdown</Text>
            <View style={styles.costCard}>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Fuel Cost</Text>
                <Text style={styles.costValue}>₦{orderData.totalAmount.toLocaleString()}</Text>
              </View>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Delivery Fee</Text>
                <Text style={styles.costValue}>₦{deliveryFee.toLocaleString()}</Text>
              </View>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Service Fee</Text>
                <Text style={styles.costValue}>₦{serviceFee.toLocaleString()}</Text>
              </View>
              <View style={[styles.costRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>₦{getTotalAmount().toLocaleString()}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={[styles.footer, { paddingHorizontal: responsivePadding }]}>
        <TouchableOpacity 
          style={[styles.placeOrderButton, loading && styles.disabledButton]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          <Text style={styles.placeOrderText}>
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
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0c1a2a',
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Montserrat',
  },
  editButton: {
    padding: 8,
  },
  editButtonText: {
    color: '#4682B4',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Montserrat',
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
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderIcon: {
    fontSize: 40,
    marginRight: 15,
  },
  orderInfo: {
    flex: 1,
  },
  fuelName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0c1a2a',
    marginBottom: 4,
    fontFamily: 'Montserrat',
  },
  fuelDetails: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Montserrat',
  },
  itemTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4682B4',
    fontFamily: 'Montserrat',
  },
  deliveryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deliveryLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    width: 100,
    fontFamily: 'Montserrat',
  },
  deliveryValue: {
    fontSize: 14,
    color: '#0c1a2a',
    flex: 1,
    fontFamily: 'Montserrat',
  },
  paymentMethod: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedPaymentMethod: {
    borderColor: '#4682B4',
    backgroundColor: '#f8f9ff',
  },
  unavailablePaymentMethod: {
    opacity: 0.6,
    backgroundColor: '#f8f8f8',
  },
  paymentText: {
    fontSize: 16,
    color: '#0c1a2a',
    marginLeft: 15,
    flex: 1,
    fontFamily: 'Montserrat',
  },
  selectedPaymentText: {
    color: '#4682B4',
    fontWeight: '600',
  },
  unavailablePaymentText: {
    color: '#999',
  },
  unavailableLabel: {
    fontSize: 12,
    color: '#999',
    marginRight: 10,
    fontFamily: 'Montserrat',
  },
  costCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  costLabel: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Montserrat',
  },
  costValue: {
    fontSize: 16,
    color: '#0c1a2a',
    fontFamily: 'Montserrat',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0c1a2a',
    fontFamily: 'Montserrat',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4682B4',
    fontFamily: 'Montserrat',
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
  placeOrderButton: {
    backgroundColor: '#4682B4',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Montserrat',
  },
});