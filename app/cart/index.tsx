import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppContext } from '../../contexts/AppContext';
import { FormErrorBoundary } from '../../components/FormErrorBoundary';
import { errorService } from '../../services/errorService';

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
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadCartItems();

    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCartItems();
    }, [])
  );

  const loadCartItems = async () => {
    try {
      setLoading(true);
      const cartData = await AsyncStorage.getItem('cartItems');
      if (cartData) {
        const parsedCartItems = JSON.parse(cartData);
        setCartItems(parsedCartItems);
        const totalAmount = parsedCartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
        setTotal(totalAmount);
      } else {
        setCartItems([]);
        setTotal(0);
      }
    } catch (error) {
      const message = errorService.handleApiError(error, 'Cart - Load Items');
      console.error('Error loading cart items:', error);
      Alert.alert('Error', message || 'Failed to load cart items');
      setCartItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const { updateCartCount } = useAppContext();

  const updateCartItems = async (updatedItems: CartItem[]) => {
    try {
      await AsyncStorage.setItem('cartItems', JSON.stringify(updatedItems));
      setCartItems(updatedItems);
      const totalAmount = updatedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
      setTotal(totalAmount);
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
      const message = errorService.handleApiError(error, 'Cart - Update Items');
      console.error('Error updating cart:', error);
      Alert.alert('Error', message || 'Failed to update cart');
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
    return total;
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
      const message = errorService.handleApiError(error, 'Cart - Prepare Checkout');
      console.error('Error preparing checkout:', error);
      Alert.alert('Error', message || 'Failed to prepare checkout. Please try again.');
    }
  };

  const clearCart = async () => {
    try {
      await AsyncStorage.multiRemove(['cartItems', 'commoditiesCart', 'checkoutItems']);
      setCartItems([]);
      setTotal(0);
      await updateCartCount();
    } catch (error) {
      const message = errorService.handleApiError(error, 'Cart - Clear Cart');
      console.error('Error clearing cart:', error);
      Alert.alert('Error', message || 'Failed to clear cart');
    }
  };

  const responsiveStyles = getResponsiveStyles(screenDimensions);

  if (loading) {
    return (
      <View style={[responsiveStyles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4682B4" />
      </View>
    );
  }

  return (
    <FormErrorBoundary fallbackMessage="Failed to load cart. Please try again.">
      <View style={styles.container}>
        {/* Header */}
        <View style={responsiveStyles.header}>
          <TouchableOpacity onPress={() => router.back()} style={responsiveStyles.backButton}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={responsiveStyles.headerTitle}>Cart</Text>
          <TouchableOpacity onPress={clearCart} style={responsiveStyles.clearButton}>
            <Text style={responsiveStyles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={responsiveStyles.content} showsVerticalScrollIndicator={false}>
          <View style={{ paddingHorizontal: Math.max(20, screenDimensions.width * 0.05) }}>
            {cartItems.length === 0 ? (
              <View style={responsiveStyles.emptyCart}>
                <Ionicons name="cart-outline" size={80} color="#ccc" />
                <Text style={responsiveStyles.emptyTitle}>Your cart is empty</Text>
                <Text style={responsiveStyles.emptyDescription}>Add items to your cart to get started</Text>
                <TouchableOpacity
                  style={responsiveStyles.shopNowButton}
                  onPress={() => router.push('/commodity/commodities')}
                >
                  <Text style={responsiveStyles.shopNowText}>Shop Now</Text>
                </TouchableOpacity>
              </View>
            ) : (
              cartItems.map((item) => (
                <View key={item.id} style={responsiveStyles.cartItem}>
                  <View style={responsiveStyles.cartLeft}>
                    <View style={responsiveStyles.cartIcon}>
                      <Text style={responsiveStyles.cartIconText}>{getItemIcon(item.category)}</Text>
                    </View>

                    <View style={responsiveStyles.cartInfo}>
                      <Text style={responsiveStyles.itemName}>{item.commodityName}</Text>
                      <View style={responsiveStyles.quantityControls}>
                        <TouchableOpacity
                          style={responsiveStyles.quantityButton}
                          onPress={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Text style={responsiveStyles.quantityButtonText}>-</Text>
                        </TouchableOpacity>

                        <View style={responsiveStyles.quantityDisplay}>
                          <Text style={responsiveStyles.quantityText}>{item.quantity}</Text>
                        </View>

                        <TouchableOpacity
                          style={responsiveStyles.quantityButton}
                          onPress={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Text style={responsiveStyles.quantityButtonText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  <View style={responsiveStyles.cartRight}>
                    <Text style={responsiveStyles.itemPrice}>₦{(item.price * item.quantity).toLocaleString()}.00</Text>
                    <TouchableOpacity
                      style={responsiveStyles.deleteButton}
                      onPress={() => removeItem(item.id)}
                    >
                      <Text style={responsiveStyles.deleteIcon}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* Footer */}
        {cartItems.length > 0 && (
        <View style={responsiveStyles.footer}>
          {/* Purchase Summary */}
          <View style={[responsiveStyles.summary, { paddingHorizontal: Math.max(20, screenDimensions.width * 0.05) }]}>
            <Text style={responsiveStyles.summaryTitle}>Purchase Summary</Text>
            <View style={responsiveStyles.summaryRow}>
              <Text style={responsiveStyles.summaryLabel}>Total</Text>
              <Text style={responsiveStyles.summaryAmount}>₦{getTotalAmount().toLocaleString()}.00</Text>
            </View>
          </View>

          {/* Payment Method Selection */}
          <TouchableOpacity
            style={[responsiveStyles.paymentSelect, { paddingHorizontal: Math.max(15, screenDimensions.width * 0.04) }]}
            onPress={handleSelectPaymentMethod}
          >
            <Text style={responsiveStyles.paymentSelectText}>Select a Payment Method…</Text>
          </TouchableOpacity>

          {/* Make Payment Button */}
          <TouchableOpacity style={[responsiveStyles.paymentButton, { marginHorizontal: Math.max(20, screenDimensions.width * 0.05) }]} onPress={handleMakePayment}>
            <Text style={responsiveStyles.paymentButtonText}>Make Payment</Text>
          </TouchableOpacity>
        </View>
        )}
      </View>
    </FormErrorBoundary>
  );
}

const getResponsiveStyles = (screenDimensions: { width: number; height: number }) => {
  const { width, height } = screenDimensions;
  const isTablet = width >= 768;
  const isSmallScreen = width < 350;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f8f9fa',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: Math.max(50, height * 0.07),
      paddingBottom: 15,
      paddingHorizontal: Math.max(20, width * 0.05),
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: isTablet ? 24 : isSmallScreen ? 18 : 22,
      fontWeight: 'bold',
      color: 'white',
      flex: 1,
      textAlign: 'center',
      fontFamily: 'Montserrat-Bold',
    },
    clearButton: {
      padding: 8,
    },
    clearButtonText: {
      color: 'white',
      fontSize: isTablet ? 18 : 16,
      fontWeight: '600',
      fontFamily: 'Montserrat-SemiBold',
    },
    emptyCart: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyTitle: {
      fontSize: isTablet ? 22 : isSmallScreen ? 18 : 20,
      fontWeight: '600',
      color: '#0B1A51',
      marginTop: 20,
      fontFamily: 'Montserrat-SemiBold',
    },
    emptyDescription: {
      fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
      color: '#666',
      marginTop: 8,
      textAlign: 'center',
      fontFamily: 'Montserrat-Regular',
    },
    shopNowButton: {
      backgroundColor: '#0B1A51',
      paddingHorizontal: Math.max(32, width * 0.08),
      paddingVertical: Math.max(12, height * 0.015),
      borderRadius: 25,
      marginTop: 24,
      shadowColor: '#0B1A51',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    shopNowText: {
      color: 'white',
      fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
      fontWeight: '600',
      fontFamily: 'Montserrat-SemiBold',
    },
    content: {
      flex: 1,
    },
    cartItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: '#4682B4',
      borderRadius: 15,
      padding: Math.max(15, width * 0.04),
      marginBottom: 15,
      backgroundColor: '#fff',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    cartLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    cartIcon: {
      width: isTablet ? 50 : 45,
      height: isTablet ? 50 : 45,
      backgroundColor: '#f0f7ff',
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    cartIconText: {
      fontSize: isTablet ? 24 : 20,
    },
    cartInfo: {
      flex: 1,
    },
    itemName: {
      fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
      fontWeight: '600',
      color: '#0B1A51',
      marginBottom: 6,
      fontFamily: 'Montserrat-SemiBold',
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
      fontSize: isTablet ? 20 : 18,
      color: '#4682B4',
      fontWeight: 'bold',
    },
    quantityDisplay: {
      backgroundColor: '#f0f7ff',
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 8,
      marginHorizontal: 5,
      borderWidth: 1,
      borderColor: '#4682B4',
    },
    quantityText: {
      fontSize: isTablet ? 16 : 14,
      color: '#0B1A51',
      fontWeight: '600',
      fontFamily: 'Montserrat-SemiBold',
    },
    cartRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    itemPrice: {
      fontSize: isTablet ? 17 : isSmallScreen ? 13 : 15,
      fontWeight: '600',
      color: '#0B1A51',
      fontFamily: 'Montserrat-SemiBold',
    },
    deleteButton: {
      padding: 5,
    },
    deleteIcon: {
      fontSize: isTablet ? 20 : 18,
    },
    summary: {
      backgroundColor: '#4682B4',
      borderRadius: 15,
      padding: Math.max(20, width * 0.05),
      marginVertical: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
    },
    summaryTitle: {
      fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
      fontWeight: '600',
      color: '#fff',
      marginBottom: 10,
      fontFamily: 'Montserrat-SemiBold',
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 15,
      color: '#fff',
      fontFamily: 'Montserrat-Regular',
    },
    summaryAmount: {
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 15,
      fontWeight: '600',
      color: '#fff',
      fontFamily: 'Montserrat-SemiBold',
    },
    paymentSelect: {
      borderWidth: 1,
      borderColor: '#4682B4',
      borderRadius: 15,
      padding: 15,
      marginBottom: 20,
      backgroundColor: '#fff',
    },
    paymentSelectText: {
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 15,
      color: '#999',
      fontFamily: 'Montserrat-Regular',
    },
    paymentButton: {
      backgroundColor: '#0B1A51',
      borderRadius: 25,
      paddingVertical: Math.max(15, height * 0.02),
      alignItems: 'center',
      marginBottom: 20,
      shadowColor: '#0B1A51',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    paymentButtonText: {
      color: '#fff',
      fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
      fontWeight: '600',
      fontFamily: 'Montserrat-SemiBold',
    },
    footer: {
      paddingTop: 10,
      backgroundColor: '#fff',
      borderTopWidth: 1,
      borderTopColor: '#e9ecef',
    },
  });
};

const styles = StyleSheet.create({
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});