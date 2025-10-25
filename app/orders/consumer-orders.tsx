
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Order {
  id: string;
  merchantName: string;
  items: string[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  orderDate: string;
  estimatedDelivery?: string;
  location: string;
  quantity: string;
  itemType: string;
}

export default function ConsumerOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    loadOrders();
    
    // Listen for screen dimension changes
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const loadOrders = async () => {
    try {
      const { orderService } = await import('../../services/orderService');
      
      const response = await orderService.getUserOrders({
        limit: 50,
        offset: 0
      });

      if (response.success && response.data) {
        // Transform API data to match local interface
        const transformedOrders: Order[] = response.data.orders.map(order => ({
          id: order.id,
          merchantName: order.merchantName || 'Unknown Merchant',
          items: order.items ? order.items.map(item => item.name) : ['Unknown Item'],
          totalAmount: order.totalAmount,
          status: order.status,
          orderDate: order.createdAt,
          estimatedDelivery: order.estimatedDelivery,
          location: order.deliveryAddress,
          quantity: order.quantity ? `${order.quantity} ${order.unit || 'units'}` : 'N/A',
          itemType: order.commodityType || 'general'
        }));
        
        setOrders(transformedOrders);
      } else {
        console.error('Failed to load orders:', response.error);
        // Fallback to empty array if API fails
        setOrders([]);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Error', 'Failed to load orders');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const handleOrderPress = (orderId: string) => {
    router.push(`/orders/order-details?id=${orderId}`);
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'delivered': return { bg: '#e8f8ec', text: '#2ecc71', border: '#2ecc71' };
      case 'cancelled': return { bg: '#fdeaea', text: '#e74c3c', border: '#e74c3c' };
      case 'preparing': return { bg: '#fff3cd', text: '#f39c12', border: '#f39c12' };
      case 'confirmed': return { bg: '#d1ecf1', text: '#3498db', border: '#3498db' };
      case 'pending': return { bg: '#f8f9fa', text: '#6c757d', border: '#6c757d' };
      default: return { bg: '#f8f9fa', text: '#95a5a6', border: '#95a5a6' };
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'delivered': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'preparing': return 'Preparing';
      case 'confirmed': return 'Confirmed';
      case 'pending': return 'Pending';
      default: return status;
    }
  };

  const getItemIcon = (itemType: string): keyof typeof Ionicons.glyphMap => {
    switch (itemType) {
      case 'petrol':
      case 'diesel':
        return 'water';
      case 'food':
        return 'restaurant';
      case 'groceries':
        return 'cart';
      default:
        return 'cube';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };
    const formatted = date.toLocaleDateString('en-US', options);
    return formatted.replace(' at ', ' — ');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: Math.max(20, screenDimensions.width * 0.05) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#1b1b1b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order History</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Orders List */}
      <ScrollView
        style={[styles.ordersList, { paddingHorizontal: Math.max(15, screenDimensions.width * 0.04) }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color="#bdc3c7" />
            <Text style={styles.emptyStateText}>No orders found</Text>
            <Text style={styles.emptyStateSubtext}>
              Your order history will appear here
            </Text>
          </View>
        ) : (
          orders.map((order) => {
            const statusColors = getStatusColor(order.status);
            return (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => handleOrderPress(order.id)}
                activeOpacity={0.7}
              >
                {/* Order Top */}
                <View style={styles.orderTop}>
                  <View style={styles.orderInfo}>
                    <View style={styles.itemIcon}>
                      <Ionicons name={getItemIcon(order.itemType)} size={28} color="#4682B4" />
                    </View>
                    <View style={styles.orderTitleContainer}>
                      <Text style={styles.orderTitle}>
                        {order.items[0]}
                        <Text style={styles.orderQty}> {order.quantity}</Text>
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.orderPrice}>₦{order.totalAmount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Order Bottom */}
                <View style={styles.orderBottom}>
                  <View style={styles.locationContainer}>
                    <Ionicons name="location" size={14} color="#666" />
                    <Text style={[styles.location, { marginLeft: 5 }]}>{order.location}</Text>
                  </View>
                  <View style={styles.statusDateContainer}>
                    <View style={[styles.statusBadge, { 
                      backgroundColor: statusColors.bg, 
                      borderColor: statusColors.border 
                    }]}>
                      <Text style={[styles.statusText, { color: statusColors.text }]}>
                        {getStatusText(order.status)}
                      </Text>
                    </View>
                    <Text style={styles.datetime}>{formatDate(order.orderDate)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
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
    backgroundColor: '#f5f5f5',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1b1b1b',
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  ordersList: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7f8c8d',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#bdc3c7',
    marginTop: 8,
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#dcdcdc',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  orderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#2f75c2',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  itemIconText: {
    fontSize: 20,
  },
  orderTitleContainer: {
    flex: 1,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1b1b1b',
  },
  orderQty: {
    fontSize: 13,
    color: '#2f75c2',
    borderWidth: 1,
    borderColor: '#2f75c2',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 5,
  },
  orderPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1b1b1b',
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginVertical: 10,
  },
  orderBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 5,
  },
  location: {
    fontSize: 14,
    color: '#555',
  },
  statusDateContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 2,
  },
  statusText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  datetime: {
    fontSize: 14,
    color: '#777',
  },
});
