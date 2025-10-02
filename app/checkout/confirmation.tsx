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
  notes?: string;
}

interface PaymentMethod {
  id: string;
  type: string;
  title: string;
  icon: string;
  available: boolean;
}

export default function ConfirmationScreen() {
  const router = useRouter();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('card');
  const [loading, setLoading] = useState(false);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  const [orderStatus, setOrderStatus] = useState<'idle' | 'success' | 'failed'>('idle'); // Added to track order status

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
      const pendingOrder = await AsyncStorage.getItem('pendingOrder');
      if (pendingOrder) {
        setOrderData(JSON.parse(pendingOrder));
      } else {
        Alert.alert('Error', 'No order data found');
        router.back();
      }
    } catch (error) {
      console.error('Error loading order data:', error);
      Alert.alert('Error', 'Failed to load order data');
      router.back();
    }
  };

  const getSubtotal = () => {
    if (!orderData) return 0;
    return orderData.unitPrice * orderData.quantity;
  };

  const getTotalAmount = () => {
    return getSubtotal() + deliveryFee + serviceFee;
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

  const handleConfirmOrder = async () => {
    if (!orderData) return;

    setLoading(true);
    setOrderStatus('idle');

    try {
      // Create order with all details
      const finalOrder = {
        id: `ORD${Date.now()}`,
        commodityId: orderData.commodityId,
        commodityName: orderData.commodityName,
        commodityType: orderData.commodityType,
        merchantId: orderData.merchantId,
        merchantName: orderData.merchantName,
        deliveryType: orderData.deliveryType,
        recipientName: orderData.recipientName,
        recipientPhone: orderData.recipientPhone,
        quantity: orderData.quantity,
        unit: orderData.unit,
        unitPrice: orderData.unitPrice,
        subtotal: getSubtotal(),
        deliveryFee,
        serviceFee,
        totalAmount: getTotalAmount(),
        deliveryAddress: orderData.location,
        notes: orderData.notes,
        paymentMethod: paymentMethods.find(m => m.id === selectedPaymentMethod)?.title || 'Card Payment',
        status: 'pending',
        orderDate: new Date().toISOString(),
        estimatedDelivery: new Date(Date.now() + 45 * 60000).toISOString(),
        location: orderData.location,
        itemType: orderData.commodityType,
      };

      // Save order
      const existingOrders = await AsyncStorage.getItem('userOrders');
      const orders = existingOrders ? JSON.parse(existingOrders) : [];
      orders.push(finalOrder);
      await AsyncStorage.setItem('userOrders', JSON.stringify(orders));
      await AsyncStorage.setItem('lastOrderId', finalOrder.id);

      // Clear pending order
      await AsyncStorage.removeItem('pendingOrder');

      setOrderStatus('success');
    } catch (error) {
      console.error('Error confirming order:', error);
      setOrderStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle order status feedback
  useEffect(() => {
    if (orderStatus === 'success') {
      Alert.alert(
        'Order Confirmed!',
        `Your order has been placed successfully.`,
        [
          {
            text: 'View Order',
            onPress: async () => {
              const lastOrderId = await AsyncStorage.getItem('lastOrderId');
              if (lastOrderId) {
                router.replace(`/orders/order-details?id=${lastOrderId}`);
              } else {
                router.replace('/orders'); // Fallback if order ID is not found
              }
            }
          }
        ]
      );
      // Clear pending order after successful confirmation
      AsyncStorage.removeItem('pendingOrder');
    } else if (orderStatus === 'failed') {
      Alert.alert(
        'Order Failed',
        'There was an issue placing your order. Please check your details and try again.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  }, [orderStatus, router]);


  if (!orderData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading order details...</Text>
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
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: responsivePadding }}>
          {/* Order Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.cardTitle}>Order Summary</Text>
            <View style={styles.orderItem}>
              <Ionicons 
                name={getCommodityIcon(orderData.commodityType)} 
                size={40} 
                color="#2e67c7" 
              />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{orderData.commodityName}</Text>
                <Text style={styles.merchantName}>From {orderData.merchantName}</Text>
                <Text style={styles.itemQuantity}>
                  {orderData.quantity} {orderData.unit} × ₦{orderData.unitPrice}
                </Text>
              </View>
              <Text style={styles.itemTotal}>₦{getSubtotal().toLocaleString()}</Text>
            </View>
          </View>

          {/* Delivery Details */}
          <View style={styles.summaryCard}>
            <Text style={styles.cardTitle}>Delivery Details</Text>

            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={20} color="#666" />
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Delivery Type</Text>
                <Text style={styles.detailValue}>
                  {orderData.deliveryType === 'yourself' ? 'For Yourself' : 'For Someone Else'}
                </Text>
              </View>
            </View>

            {orderData.deliveryType === 'someone_else' && (
              <>
                <View style={styles.detailRow}>
                  <Ionicons name="person-circle-outline" size={20} color="#666" />
                  <View style={styles.detailInfo}>
                    <Text style={styles.detailLabel}>Recipient</Text>
                    <Text style={styles.detailValue}>{orderData.recipientName}</Text>
                    <Text style={styles.detailSubvalue}>{orderData.recipientPhone}</Text>
                  </View>
                </View>
              </>
            )}

            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={20} color="#666" />
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>{orderData.location}</Text>
              </View>
            </View>

            {orderData.notes && (
              <View style={styles.detailRow}>
                <Ionicons name="document-text-outline" size={20} color="#666" />
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>Special Instructions</Text>
                  <Text style={styles.detailValue}>{orderData.notes}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Payment Method */}
          <View style={styles.summaryCard}>
            <Text style={styles.cardTitle}>Payment Method</Text>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentOption,
                  selectedPaymentMethod === method.id && styles.selectedPayment,
                  !method.available && styles.disabledPayment
                ]}
                onPress={() => method.available && setSelectedPaymentMethod(method.id)}
                disabled={!method.available}
              >
                <Ionicons 
                  name={method.icon as any} 
                  size={24} 
                  color={method.available ? (selectedPaymentMethod === method.id ? '#2e67c7' : '#666') : '#ccc'} 
                />
                <Text style={[
                  styles.paymentText,
                  selectedPaymentMethod === method.id && styles.selectedPaymentText,
                  !method.available && styles.disabledPaymentText
                ]}>
                  {method.title}
                </Text>
                {!method.available && (
                  <Text style={styles.unavailableText}>Unavailable</Text>
                )}
                {selectedPaymentMethod === method.id && method.available && (
                  <Ionicons name="checkmark-circle" size={20} color="#2e67c7" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Price Breakdown */}
          <View style={styles.priceCard}>
            <Text style={styles.cardTitle}>Price Breakdown</Text>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Subtotal</Text>
              <Text style={styles.priceValue}>₦{getSubtotal().toLocaleString()}</Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Delivery Fee</Text>
              <Text style={styles.priceValue}>₦{deliveryFee.toLocaleString()}</Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Service Fee</Text>
              <Text style={styles.priceValue}>₦{serviceFee.toLocaleString()}</Text>
            </View>

            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₦{getTotalAmount().toLocaleString()}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Confirm Button */}
      <View style={[styles.footer, { paddingHorizontal: responsivePadding }]}>
        <TouchableOpacity 
          style={[styles.confirmButton, loading && styles.disabledButton]}
          onPress={handleConfirmOrder}
          disabled={loading || orderStatus !== 'idle'} // Disable if processing or already responded
        >
          <Text style={styles.confirmButtonText}>
            {loading ? 'Processing...' : `Confirm Order - ₦${getTotalAmount().toLocaleString()}`}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
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
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0c1a2a',
    marginBottom: 15,
    fontFamily: 'Montserrat-Bold',
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 15,
  },
  itemName: {
    fontSize: 16,
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
  itemQuantity: {
    fontSize: 14,
    color: '#2e67c7',
    fontFamily: 'Montserrat-Medium',
  },
  itemTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0c1a2a',
    fontFamily: 'Montserrat-Bold',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  detailInfo: {
    flex: 1,
    marginLeft: 15,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'Montserrat-Medium',
  },
  detailValue: {
    fontSize: 16,
    color: '#0c1a2a',
    fontFamily: 'Montserrat-Regular',
  },
  detailSubvalue: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Montserrat-Regular',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPayment: {
    borderColor: '#2e67c7',
    backgroundColor: '#f0f7ff',
  },
  disabledPayment: {
    opacity: 0.5,
  },
  paymentText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
    flex: 1,
    fontFamily: 'Montserrat-Regular',
  },
  selectedPaymentText: {
    color: '#2e67c7',
    fontFamily: 'Montserrat-SemiBold',
  },
  disabledPaymentText: {
    color: '#999',
  },
  unavailableText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    fontFamily: 'Montserrat-Regular',
  },
  priceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    color: '#2e67c7',
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
  confirmButton: {
    backgroundColor: '#4682B4',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Montserrat-Bold',
  },
});