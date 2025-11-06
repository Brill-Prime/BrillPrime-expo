import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { orderService } from '../../services/orderService';
import { locationService } from '../../services/locationService';
import { useAlert } from '../../components/AlertProvider';

interface DriverOrder {
  id: string;
  merchantName: string;
  merchantAddress: string;
  deliveryAddress: string;
  customerName: string;
  distance: number;
  estimatedEarnings: number;
  status: 'available' | 'accepted' | 'picking_up' | 'delivering' | 'completed';
  items: Array<{ name: string; quantity: number }>;
  pickupLocation: { latitude: number; longitude: number };
  deliveryLocation: { latitude: number; longitude: number };
}

export default function DriverOrders() {
  const router = useRouter();
  const { showError, showSuccess, showConfirmDialog } = useAlert();
  const [orders, setOrders] = useState<DriverOrder[]>([]);
  const [activeOrders, setActiveOrders] = useState<DriverOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    loadOrders();
    getCurrentLocation();

    // Start live location tracking for active deliveries
    const startTracking = async () => {
      await locationService.startLiveTracking(5000);
    };
    startTracking();

    return () => {
      locationService.stopLiveTracking();
    };
  }, []);

  const getCurrentLocation = async () => {
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      // Load available orders for pickup
      const availableResponse = await orderService.getUserOrders({ status: 'confirmed' });

      // Load driver's active orders
      const activeResponse = await orderService.getUserOrders({ 
        status: 'in_transit' 
      });

      if (availableResponse.success && availableResponse.data) {
        // Transform and calculate distances
        const available = await Promise.all(
          availableResponse.data.orders.map(async (order: any) => {
            let distance = 0;
            if (currentLocation && order.merchant?.location) {
              distance = locationService.calculateDistance(
                currentLocation.latitude,
                currentLocation.longitude,
                order.merchant.location.latitude,
                order.merchant.location.longitude
              );
            }

            return {
              id: order.id,
              merchantName: order.merchant?.name || 'Unknown Merchant',
              merchantAddress: order.merchant?.address || '',
              deliveryAddress: order.deliveryAddress || '',
              customerName: order.customerName || 'Customer',
              distance: parseFloat(distance.toFixed(1)),
              estimatedEarnings: order.deliveryFee || 0,
              status: 'available',
              items: order.items || [],
              pickupLocation: order.merchant?.location || { latitude: 0, longitude: 0 },
              deliveryLocation: order.deliveryLocation || { latitude: 0, longitude: 0 },
            };
          })
        );

        setOrders(available);
      }

      if (activeResponse.success && activeResponse.data) {
        const active = activeResponse.data.orders.map((order: any) => ({
          id: order.id,
          merchantName: order.merchant?.name || 'Unknown Merchant',
          merchantAddress: order.merchant?.address || '',
          deliveryAddress: order.deliveryAddress || '',
          customerName: order.customerName || 'Customer',
          distance: 0,
          estimatedEarnings: order.deliveryFee || 0,
          status: order.status,
          items: order.items || [],
          pickupLocation: order.merchant?.location || { latitude: 0, longitude: 0 },
          deliveryLocation: order.deliveryLocation || { latitude: 0, longitude: 0 },
        }));

        setActiveOrders(active);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      showError('Error', 'Failed to load orders');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    showConfirmDialog(
      'Accept Delivery',
      'Are you sure you want to accept this delivery?',
      async () => {
        try {
          const response = await orderService.updateOrderStatus(orderId, 'IN_TRANSIT');

          if (response.success) {
            showSuccess('Success', 'Order accepted! Navigate to pickup location.');
            loadOrders();

            // Navigate to tracking view
            router.push({
              pathname: '/orders/order-tracking',
              params: { orderId }
            });
          } else {
            showError('Error', response.error || 'Failed to accept order');
          }
        } catch (error) {
          console.error('Error accepting order:', error);
          showError('Error', 'Failed to accept order');
        }
      }
    );
  };

  const handleRejectOrder = async (orderId: string) => {
    showConfirmDialog(
      'Reject Delivery',
      'Are you sure you want to reject this delivery? This action cannot be undone.',
      async () => {
        try {
          const response = await orderService.updateOrderStatus(orderId, 'CANCELLED');

          if (response.success) {
            showSuccess('Order Rejected', 'The order has been rejected successfully.');
            loadOrders();
          } else {
            showError('Error', response.error || 'Failed to reject order');
          }
        } catch (error) {
          console.error('Error rejecting order:', error);
          showError('Error', 'Failed to reject order');
        }
      }
    );
  };

  const handleViewDetails = (order: DriverOrder) => {
    router.push({
      pathname: '/orders/driver-order-preview',
      params: { orderId: order.id }
    });
  };

  const renderOrderItem = ({ item }: { item: DriverOrder }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.merchantName}>{item.merchantName}</Text>
          <Text style={styles.orderDistance}>📍 {item.distance} km away</Text>
        </View>
        <View style={styles.earningsContainer}>
          <Text style={styles.earningsLabel}>Earn</Text>
          <Text style={styles.earningsAmount}>₦{item.estimatedEarnings}</Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={16} color="#4682B4" />
          <Text style={styles.locationText} numberOfLines={1}>
            Pickup: {item.merchantAddress}
          </Text>
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="navigate" size={16} color="#28a745" />
          <Text style={styles.locationText} numberOfLines={1}>
            Deliver: {item.deliveryAddress}
          </Text>
        </View>
      </View>

      <View style={styles.orderFooter}>
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => handleViewDetails(item)}
        >
          <Text style={styles.detailsButtonText}>View Details</Text>
        </TouchableOpacity>

        {item.status === 'available' && (
          <>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => handleRejectOrder(item.id)}
            >
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => handleAcceptOrder(item.id)}
            >
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
          </>
        )}

        {item.status !== 'available' && (
          <TouchableOpacity
            style={styles.trackButton}
            onPress={() => router.push({
              pathname: '/orders/order-tracking',
              params: { orderId: item.id }
            })}
          >
            <Text style={styles.trackButtonText}>Track</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4682B4" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Orders</Text>
        <TouchableOpacity onPress={loadOrders}>
          <Ionicons name="refresh" size={24} color="#4682B4" />
        </TouchableOpacity>
      </View>

      {activeOrders.length > 0 && (
        <View style={styles.activeSection}>
          <Text style={styles.sectionTitle}>Active Deliveries ({activeOrders.length})</Text>
          <FlatList
            data={activeOrders}
            renderItem={renderOrderItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.activeList}
          />
        </View>
      )}

      <Text style={styles.sectionTitle}>
        Available Orders ({orders.length})
      </Text>

      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadOrders} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No available orders</Text>
            <Text style={styles.emptySubtext}>
              Check back later for new delivery requests
            </Text>
          </View>
        }
      />
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  activeSection: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  activeList: {
    paddingLeft: 20,
  },
  listContainer: {
    padding: 20,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 300,
    marginRight: 15,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  orderDistance: {
    fontSize: 14,
    color: '#666',
  },
  earningsContainer: {
    alignItems: 'flex-end',
  },
  earningsLabel: {
    fontSize: 12,
    color: '#666',
  },
  earningsAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#28a745',
  },
  orderDetails: {
    marginBottom: 15,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  orderFooter: {
    flexDirection: 'row',
    gap: 10,
  },
  detailsButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4682B4',
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#4682B4',
    fontSize: 14,
    fontWeight: '500',
  },
  rejectButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#dc3545',
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#4682B4',
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  trackButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#28a745',
    alignItems: 'center',
  },
  trackButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});