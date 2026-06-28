
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

interface TollOrderData {
  type: string;
  tollGate: {
    id: string;
    name: string;
    location: string;
    highway: string;
    distance: number;
    pricePerVehicle: {
      motorcycle: number;
      car: number;
      suv: number;
      truck: number;
    };
    operatingHours: string;
    estimatedTime: string;
  };
  vehicleType: {
    id: string;
    name: string;
    icon: string;
    description: string;
  };
  amount: number;
  orderDate: string;
}

interface PaymentMethod {
  id: string;
  type: string;
  title: string;
  icon: string;
  available: boolean;
}

export default function TollConfirmationScreen() {
  const router = useRouter();
  const [orderData, setOrderData] = useState<TollOrderData | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('card');
  const [loading, setLoading] = useState(false);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));

  const serviceFee = 100; // Small service fee for toll payments

  const paymentMethods: PaymentMethod[] = [
    { id: 'card', type: 'card', title: 'Credit/Debit Card', icon: 'card-outline', available: true },
    { id: 'bank', type: 'bank', title: 'Bank Transfer', icon: 'business-outline', available: true },
    { id: 'wallet', type: 'wallet', title: 'Digital Wallet', icon: 'wallet-outline', available: true },
    { id: 'cash', type: 'cash', title: 'Cash Payment', icon: 'cash-outline', available: false },
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
      const data = await AsyncStorage.getItem('pendingTollOrder');
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
    return orderData.amount + serviceFee;
  };

  const handlePaymentMethodSelect = (methodId: string) => {
    const method = paymentMethods.find(m => m.id === methodId);
    if (method && !method.available) {
      Alert.alert('Unavailable', `${method.title} is currently not available for toll payments.`);
      return;
    }
    setSelectedPaymentMethod(methodId);
  };

  const handleConfirmPayment = async () => {
    if (!orderData) return;
    
    setLoading(true);
    
    try {
      const finalOrder = {
        id: `TOLL${Date.now()}`,
        type: 'toll',
        ...orderData,
        paymentMethod: paymentMethods.find(m => m.id === selectedPaymentMethod)?.title,
        serviceFee,
        finalAmount: getTotalAmount(),
        status: 'completed',
        purchaseDate: new Date().toISOString(),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Valid for 24 hours
      };

      // Save order to storage (in real app, send to API)
      const existingOrders = await AsyncStorage.getItem('userOrders');
      const orders = existingOrders ? JSON.parse(existingOrders) : [];
      orders.push(finalOrder);
      await AsyncStorage.setItem('userOrders', JSON.stringify(orders));

      // Clear pending order
      await AsyncStorage.removeItem('pendingTollOrder');

      Alert.alert(
        'Payment Successful!',
        `Your toll pass #${finalOrder.id} has been purchased successfully. Valid until tomorrow.`,
        [
          {
            text: 'View Receipt',
            onPress: () => router.replace(`/orders/order-details?id=${finalOrder.id}`)
          }
        ]
      );
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert('Error', 'Failed to process payment. Please try again.');
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
        <Text style={styles.headerTitle}>Confirm Payment</Text>
        <TouchableOpacity onPress={handleEditOrder} style={styles.editButton}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: responsivePadding }}>
          
          {/* Toll Pass Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Toll Pass Details</Text>
            <View style={styles.tollCard}>
              <View style={styles.tollHeader}>
                <Text style={styles.tollIcon}>{orderData.vehicleType.icon}</Text>
                <View style={styles.tollInfo}>
                  <Text style={styles.tollName}>{orderData.tollGate.name}</Text>
                  <Text style={styles.tollLocation}>{orderData.tollGate.location}</Text>
                  <Text style={styles.tollHighway}>{orderData.tollGate.highway}</Text>
                </View>
                <View style={styles.vehicleInfo}>
                  <Text style={styles.vehicleType}>{orderData.vehicleType.name}</Text>
                  <Text style={styles.vehicleDesc}>{orderData.vehicleType.description}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Journey Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Journey Details</Text>
            <View style={styles.journeyCard}>
              <View style={styles.journeyRow}>
                <Ionicons name="location-outline" size={20} color="#666" />
                <Text style={styles.journeyLabel}>Distance:</Text>
                <Text style={styles.journeyValue}>{orderData.tollGate.distance} km</Text>
              </View>
              <View style={styles.journeyRow}>
                <Ionicons name="time-outline" size={20} color="#666" />
                <Text style={styles.journeyLabel}>Estimated Time:</Text>
                <Text style={styles.journeyValue}>{orderData.tollGate.estimatedTime}</Text>
              </View>
              <View style={styles.journeyRow}>
                <Ionicons name="calendar-outline" size={20} color="#666" />
                <Text style={styles.journeyLabel}>Valid Until:</Text>
                <Text style={styles.journeyValue}>Tomorrow</Text>
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
                  color={selectedPaymentMethod === method.id ? "#2f75c2" : "#666"} 
                />
                <Text style={[
                  styles.paymentText,
                  selectedPaymentMethod === method.id && styles.selectedPaymentText,
                  !method.available && styles.unavailablePaymentText
                ]}>
                  {method.title}
                </Text>
                {!method.available && (
                  <Text style={styles.unavailableLabel}>Not available</Text>
                )}
                {selectedPaymentMethod === method.id && method.available && (
                  <Ionicons name="checkmark-circle" size={20} color="#2f75c2" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Cost Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cost Breakdown</Text>
            <View style={styles.costCard}>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Toll Fee</Text>
                <Text style={styles.costValue}>₦{orderData.amount.toLocaleString()}</Text>
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

      {/* Confirm Payment Button */}
      <View style={[styles.footer, { paddingHorizontal: responsivePadding }]}>
        <TouchableOpacity 
          style={[styles.confirmButton, loading && styles.disabledButton]}
          onPress={handleConfirmPayment}
          disabled={loading}
        >
          <Text style={styles.confirmButtonText}>
            {loading ? 'Processing Payment...' : `Pay ₦${getTotalAmount().toLocaleString()}`}
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
    color: '#2f75c2',
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
  tollCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tollHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tollIcon: {
    fontSize: 40,
    marginRight: 15,
  },
  tollInfo: {
    flex: 1,
  },
  tollName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0c1a2a',
    marginBottom: 4,
    fontFamily: 'Montserrat',
  },
  tollLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
    fontFamily: 'Montserrat',
  },
  tollHighway: {
    fontSize: 12,
    color: '#2f75c2',
    fontFamily: 'Montserrat',
  },
  vehicleInfo: {
    alignItems: 'flex-end',
  },
  vehicleType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0c1a2a',
    fontFamily: 'Montserrat',
  },
  vehicleDesc: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Montserrat',
  },
  journeyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  journeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  journeyLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    width: 120,
    fontFamily: 'Montserrat',
  },
  journeyValue: {
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
    borderColor: '#2f75c2',
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
    color: '#2f75c2',
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
    color: '#2f75c2',
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
  confirmButton: {
    backgroundColor: '#4682B4',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Montserrat',
  },
});
