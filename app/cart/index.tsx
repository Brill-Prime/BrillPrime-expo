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
import { useAppContext } from '../../contexts/AppContext';

interface CartItem {
  id: string;
  commodityId: string;
  commodityName: string;
  merchantId: string;
  merchantName: string;
  price: number;
  quantity: number;
  unit: string;
  image: any;
  category: string;
}

export default function CartScreen() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    loadCartItems();

    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    const unsubscribe = router.addListener?.('focus', () => {
      loadCartItems();
    });

    return () => {
      subscription?.remove();
      unsubscribe?.();
    };
  }, []);

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

  const { updateCartCount } = useAppContext();
  
  const updateCartItems = async (updatedItems: CartItem[]) => {
    try {
      await AsyncStorage.setItem('cartItems', JSON.stringify(updatedItems));
      setCartItems(updatedItems);
      await updateCartCount();

      // Also update commodities cart for consistency
      const commoditiesCartItems = updatedItems.map(item => ({
        productId: item.commodityId || item.id,
        quantity: item.quantity,
        price: item.price,
        productName: item.commodityName,
        productUnit: item.unit,
        merchantId: item.merchantId,
        merchantName: item.merchantName,
      }));
      await AsyncStorage.setItem('commoditiesCart', JSON.stringify(commoditiesCartItems));
    } catch (error) {
      console.error('Error updating cart:', error);
    }
  };

  const removeItem = (itemId: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedItems = cartItems.filter(item => item.id !== itemId);
            updateCartItems(updatedItems);
          }
        }
      ]
    );
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }

    const updatedItems = cartItems.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    updateCartItems(updatedItems);
  };

  const getTotalAmount = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getItemIcon = (category: string) => {
    switch (category) {
      case 'fuel': return '⛽';
      case 'food': return '🍽️';
      case 'groceries': return '🛒';
      default: return '📦';
    }
  };

  const handleSelectPaymentMethod = () => {
    router.push('/payment');
  };

  const handleMakePayment = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before making payment');
      return;
    }

    try {
      // Save cart items for checkout
      await AsyncStorage.setItem('checkoutItems', JSON.stringify(cartItems));
      router.push('/checkout');
    } catch (error) {
      console.error('Error preparing checkout:', error);
      Alert.alert('Error', 'Failed to prepare checkout. Please try again.');
    }
  };

  const clearCart = async () => {
    try {
      await AsyncStorage.multiRemove(['cartItems', 'commoditiesCart', 'checkoutItems']);
      setCartItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
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
        <Text style={styles.headerTitle}>Cart</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: responsivePadding }}>
          {cartItems.length === 0 ? (
            <View style={styles.emptyCart}>
              <Ionicons name="cart-outline" size={80} color="#ccc" />
              <Text style={styles.emptyTitle}>Your cart is empty</Text>
              <Text style={styles.emptyDescription}>Add items to your cart to get started</Text>
              <TouchableOpacity 
                style={styles.shopNowButton}
                onPress={() => router.push('/commodity/commodities')}
              >
                <Text style={styles.shopNowText}>Shop Now</Text>
              </TouchableOpacity>
            </View>
          ) : (
            cartItems.map((item) => (
              <View key={item.id} style={styles.cartItem}>
                <View style={styles.cartLeft}>
                  <View style={styles.cartIcon}>
                    <Text style={styles.cartIconText}>{getItemIcon(item.category)}</Text>
                  </View>

                  <View style={styles.cartInfo}>
                    <Text style={styles.itemName}>{item.commodityName}</Text>
                    <View style={styles.quantityControls}>
                      <TouchableOpacity 
                        style={styles.quantityButton}
                        onPress={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Text style={styles.quantityButtonText}>-</Text>
                      </TouchableOpacity>

                      <View style={styles.quantityDisplay}>
                        <Text style={styles.quantityText}>{item.quantity}</Text>
                      </View>

                      <TouchableOpacity 
                        style={styles.quantityButton}
                        onPress={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Text style={styles.quantityButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={styles.cartRight}>
                  <Text style={styles.itemPrice}>₦{(item.price * item.quantity).toLocaleString()}.00</Text>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => removeItem(item.id)}
                  >
                    <Text style={styles.deleteIcon}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      {cartItems.length > 0 && (
      <View style={[styles.footer, { paddingHorizontal: responsivePadding }]}>
        {/* Purchase Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Purchase Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryAmount}>₦{getTotalAmount().toLocaleString()}.00</Text>
          </View>
        </View>

        {/* Payment Method Selection */}
        <TouchableOpacity 
          style={styles.paymentSelect}
          onPress={handleSelectPaymentMethod}
        >
          <Text style={styles.paymentSelectText}>Select a Payment Method…</Text>
        </TouchableOpacity>

        {/* Make Payment Button */}
        <TouchableOpacity style={styles.paymentButton} onPress={handleMakePayment}>
          <Text style={styles.paymentButtonText}>Make Payment</Text>
        </TouchableOpacity>
      </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  },
  placeholder: {
    width: 40,
  },
  emptyCart: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  shopNowButton: {
    backgroundColor: '#0B1A51',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  shopNowText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  cartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cartIcon: {
    width: 45,
    height: 45,
    backgroundColor: '#f4f4f4',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cartIconText: {
    fontSize: 20,
  },
  cartInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0c1a2a',
    marginBottom: 6,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: 'transparent',
    padding: 2,
    paddingHorizontal: 6,
  },
  quantityButtonText: {
    fontSize: 18,
    color: '#0c1a2a',
  },
  quantityDisplay: {
    backgroundColor: '#e6f0ff',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  quantityText: {
    fontSize: 14,
    color: '#0c1a2a',
  },
  cartRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0c1a2a',
  },
  deleteButton: {
    padding: 5,
  },
  deleteIcon: {
    fontSize: 18,
  },
  summary: {
    backgroundColor: '#4682B4',
    borderRadius: 10,
    padding: 20,
    marginVertical: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 15,
    color: '#fff',
  },
  summaryAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  paymentSelect: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  paymentSelectText: {
    fontSize: 15,
    color: '#aaa',
  },
  paymentButton: {
    backgroundColor: '#0B1A51',
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingTop: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
});