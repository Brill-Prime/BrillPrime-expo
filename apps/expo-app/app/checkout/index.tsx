import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ErrorBoundary from '../../components/ErrorBoundary';

interface CartItem {
  id: string;
  commodityName: string;
  merchantName: string;
  price: number;
  quantity: number;
  unit: string;
  category?: string; // Added for potential use in order creation
  merchantId?: string; // Added for potential use in order creation
}

interface Address {
  id: string;
  label: string;
  address: string;
  isDefault: boolean;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank' | 'cash'>('card');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));

  const deliveryFee = 500;
  const serviceFee = 200;

  useEffect(() => {
    loadCheckoutData();

    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const loadCheckoutData = async () => {
    try {
      const cartData = await AsyncStorage.getItem('cartItems');
      if (cartData) {
        setCartItems(JSON.parse(cartData));
      }

      // Load default address
      const savedAddress = await AsyncStorage.getItem('userAddress');
      if (savedAddress) {
        setSelectedAddress({
          id: '1',
          label: 'Current Location',
          address: savedAddress,
          isDefault: true
        });
      }
    } catch (error) {
      console.error('Error loading checkout data:', error);
    }
  };

  const getSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotal = () => {
    return getSubtotal() + deliveryFee + serviceFee;
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('Address Required', 'Please select a delivery address');
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'No items to checkout');
      return;
    }

    setLoading(true);

    try {
      const { orderService } = await import('../../services/orderService');
      const { locationService } = await import('../../services/locationService');
      
      // Get user location for driver assignment
      const userLocation = await AsyncStorage.getItem("userLocation");
      const coordinates = userLocation ? JSON.parse(userLocation) : null;
      
      // Create orders for each cart item
      const createdOrders = [];
      
      for (const item of cartItems) {
        const itemTotal = item.price * item.quantity;
        
        const orderData = {
          merchantId: item.merchantId || '',
          commodityId: item.commodityId || item.id,
          quantity: item.quantity,
          deliveryAddress: selectedAddress.address,
          deliveryType: 'yourself' as const,
          paymentMethod: paymentMethod === 'card' ? 'card' : 
                        paymentMethod === 'bank' ? 'bank_transfer' : 'cash',
          notes: deliveryNotes,
          coordinates: coordinates ? {
            latitude: coordinates.latitude,
            longitude: coordinates.longitude
          } : undefined
        };

        // Call backend to create order and assign driver
        const response = await orderService.createOrder(orderData);
        
        if (response.success && response.data) {
          // Backend will automatically find nearest driver
          createdOrders.push(response.data);
          
          // Save to local storage for offline access
          const existingOrders = await AsyncStorage.getItem('userOrders');
          const allOrders = existingOrders ? JSON.parse(existingOrders) : [];
          allOrders.push({
            ...response.data,
            commodityName: item.commodityName,
            merchantName: item.merchantName,
            unitPrice: item.price,
            subtotal: itemTotal,
            deliveryFee,
            serviceFee,
            totalAmount: itemTotal + deliveryFee + serviceFee,
            itemType: item.category || 'product',
          });
          await AsyncStorage.setItem('userOrders', JSON.stringify(allOrders));
        }
      }

      // Save last order ID for quick access
      if (createdOrders.length > 0) {
        await AsyncStorage.setItem('lastOrderId', createdOrders[0].id);
      }

      // Clear cart
      await AsyncStorage.multiRemove([
        'cartItems', 
        'checkoutItems', 
        'commoditiesCart'
      ]);

      Alert.alert(
        'Order Placed Successfully!',
        `${createdOrders.length} order(s) placed successfully. A driver has been assigned and will pick up your order shortly.`,
        [
          { text: 'Track Order', onPress: () => router.replace(`/orders/order-tracking?orderId=${createdOrders[0].id}`) },
          { text: 'View Orders', onPress: () => router.replace('/orders/consumer-orders') }
        ]
      );
    } catch (error) {
      console.error('Error completing checkout:', error);
      Alert.alert('Checkout Failed', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const responsivePadding = Math.max(20, screenDimensions.width * 0.05);

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: responsivePadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#1b1b1b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Delivery Address */}
        <View style={[styles.section, { marginHorizontal: responsivePadding }]}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <TouchableOpacity style={styles.addressCard}>
            <Ionicons name="location-outline" size={24} color="#2f75c2" />
            <View style={styles.addressInfo}>
              <Text style={styles.addressLabel}>
                {selectedAddress?.label || 'Select Address'}
              </Text>
              <Text style={styles.addressText}>
                {selectedAddress?.address || 'No address selected'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Order Items */}
        <View style={[styles.section, { marginHorizontal: responsivePadding }]}>
          <Text style={styles.sectionTitle}>Order Items ({cartItems.length})</Text>
          {cartItems.map((item, index) => (
            <View key={item.id} style={styles.orderItem}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.commodityName}</Text>
                <Text style={styles.merchantName}>{item.merchantName}</Text>
                <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>₦{(item.price * item.quantity).toLocaleString('en-NG')}</Text>
            </View>
          ))}
        </View>

        {/* Payment Method */}
        <View style={[styles.section, { marginHorizontal: responsivePadding }]}>
          <Text style={styles.sectionTitle}>Payment Method</Text>

          <TouchableOpacity 
            style={[styles.paymentOption, paymentMethod === 'card' && styles.selectedPayment]}
            onPress={() => setPaymentMethod('card')}
          >
            <Ionicons name="card-outline" size={24} color="#2f75c2" />
            <Text style={styles.paymentText}>Credit/Debit Card</Text>
            {paymentMethod === 'card' && <Ionicons name="checkmark-circle" size={20} color="#2f75c2" />}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.paymentOption, paymentMethod === 'bank' && styles.selectedPayment]}
            onPress={() => setPaymentMethod('bank')}
          >
            <Ionicons name="business-outline" size={24} color="#2f75c2" />
            <Text style={styles.paymentText}>Bank Transfer</Text>
            {paymentMethod === 'bank' && <Ionicons name="checkmark-circle" size={20} color="#2f75c2" />}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.paymentOption, paymentMethod === 'cash' && styles.selectedPayment]}
            onPress={() => setPaymentMethod('cash')}
          >
            <Ionicons name="cash-outline" size={24} color="#2f75c2" />
            <Text style={styles.paymentText}>Cash on Delivery</Text>
            {paymentMethod === 'cash' && <Ionicons name="checkmark-circle" size={20} color="#2f75c2" />}
          </TouchableOpacity>
        </View>

        {/* Delivery Notes */}
        <View style={[styles.section, { marginHorizontal: responsivePadding }]}>
          <Text style={styles.sectionTitle}>Delivery Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add any special instructions for delivery..."
            value={deliveryNotes}
            onChangeText={setDeliveryNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Order Summary */}
        <View style={[styles.summaryCard, { marginHorizontal: responsivePadding }]}>
          <Text style={styles.summaryTitle}>Order Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₦{getSubtotal().toLocaleString('en-NG')}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>₦{deliveryFee.toLocaleString('en-NG')}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service Fee</Text>
            <Text style={styles.summaryValue}>₦{serviceFee.toLocaleString('en-NG')}</Text>
          </View>

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₦{getTotal().toLocaleString('en-NG')}</Text>
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
          {loading ? (
            <Text style={styles.placeOrderText}>Processing...</Text>
          ) : (
            <>
              <Text style={styles.placeOrderText}>Place Order</Text>
              <Text style={styles.orderTotal}>₦{getTotal().toLocaleString('en-NG')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      </View>
    </ErrorBoundary>
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
    backgroundColor: '#f5f5f5',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1b1b1b',
    flex: 1,
    textAlign: 'center',
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
    fontWeight: 'bold',
    color: '#1b1b1b',
    marginBottom: 15,
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addressInfo: {
    flex: 1,
    marginLeft: 15,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1b1b1b',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
  },
  orderItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1b1b1b',
    marginBottom: 2,
  },
  merchantName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  itemQuantity: {
    fontSize: 12,
    color: '#2f75c2',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1b1b1b',
  },
  paymentOption: {
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
  selectedPayment: {
    borderColor: '#2f75c2',
    backgroundColor: '#f8f9ff',
  },
  paymentText: {
    fontSize: 16,
    color: '#1b1b1b',
    marginLeft: 15,
    flex: 1,
  },
  notesInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#ddd',
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
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1b1b1b',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    color: '#1b1b1b',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
    marginTop: 5,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1b1b1b',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2f75c2',
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
    backgroundColor: '#2f75c2',
    borderRadius: 25,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  orderTotal: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});