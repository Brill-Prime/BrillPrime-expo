import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../config/supabase';
import { orderService } from '../../services/orderService';
import { locationService } from '../../services/locationService';
import { useAlert } from '../../components/AlertProvider';

interface DriverOrder {
  id: string;
  order_number: string;
  merchant_id: string;
  merchantName: string;
  merchantAddress: string;
  delivery_address: string;
  customerName: string;
  distance: number;
  estimatedEarnings: number;
  status: string;
  items: Array<{ name: string; quantity: number }>;
  pickupLocation: { latitude: number; longitude: number };
  deliveryLocation: { latitude: number; longitude: number };
}

function mapOrder(order: any, currentLocation: { latitude: number; longitude: number } | null): DriverOrder {
  const merchantLat = order.merchant?.latitude ?? 0;
  const merchantLng = order.merchant?.longitude ?? 0;
  let distance = 0;
  if (currentLocation && merchantLat && merchantLng) {
    distance = locationService.calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      merchantLat,
      merchantLng
    );
  }

  return {
    id: order.id,
    order_number: order.order_number,
    merchant_id: order.merchant_id,
    merchantName: order.merchant?.name ?? 'Merchant',
    merchantAddress: order.merchant?.address ?? '',
    delivery_address: order.delivery_address ?? '',
    customerName: order.consumer
      ? `${order.consumer.first_name} ${order.consumer.last_name}`
      : 'Customer',
    distance: parseFloat(distance.toFixed(1)),
    estimatedEarnings: order.delivery_fee ?? 0,
    status: order.status,
    items: (order.items ?? []).map((i: any) => ({
      name: i.product?.name ?? 'Item',
      quantity: i.quantity,
    })),
    pickupLocation: { latitude: merchantLat, longitude: merchantLng },
    deliveryLocation: {
      latitude: order.delivery_latitude ?? 0,
      longitude: order.delivery_longitude ?? 0,
    },
  };
}

export default function DriverOrders() {
  const router = useRouter();
  const { showError, showSuccess, showConfirmDialog } = useAlert();
  const [assignedOrders, setAssignedOrders] = useState<DriverOrder[]>([]);
  const [activeOrders, setActiveOrders] = useState<DriverOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const cleanupRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    // Get current GPS location for distance calculations
    locationService.getCurrentLocation().then((loc) => {
      if (loc?.coords) {
        setCurrentLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      }
    });

    // Start broadcasting driver's live position
    locationService.startLiveTracking(5000).catch(console.error);

    return () => {
      locationService.stopLiveTracking();
      cleanupRef.current.forEach(fn => fn());
      cleanupRef.current = [];
    };
  }, []);

  useEffect(() => {
    loadOrders();
    subscribeToNewAssignments();
  }, [currentLocation]);

  const subscribeToNewAssignments = async () => {
    // Get internal user ID to filter real-time by driver_id
    const userMod = await import('../../services/authService');
    const userData = await userMod.authService.getStoredUser();
    if (!userData?.id) return;

    const { data: userRow } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', userData.id)
      .single();

    if (!userRow) return;

    const channel = supabase
      .channel(`driver_orders_${userRow.id}`)
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `driver_id=eq.${userRow.id}`,
        },
        () => {
          loadOrders(false);
        }
      )
      .subscribe();

    cleanupRef.current.push(() => supabase.removeChannel(channel));
  };

  const loadOrders = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      // Orders assigned to this driver that are ready for pickup
      const assignedRes = await orderService.getDriverOrders({ status: 'ready' });
      // Orders currently in transit by this driver
      const activeRes = await orderService.getDriverOrders({ status: 'in_transit' });

      if (assignedRes.success && assignedRes.data) {
        setAssignedOrders(
          assignedRes.data.orders.map(o => mapOrder(o, currentLocation))
        );
      }
      if (activeRes.success && activeRes.data) {
        setActiveOrders(
          activeRes.data.orders.map(o => mapOrder(o, currentLocation))
        );
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      showError('Error', 'Failed to load orders');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadOrders(false);
  }, [currentLocation]);

  const handlePickUp = async (orderId: string) => {
    showConfirmDialog(
      'Confirm Pickup',
      'Mark this order as picked up and start delivery?',
      async () => {
        try {
          const response = await orderService.updateOrderStatus(orderId, 'in_transit');
          if (response.success) {
            showSuccess('Picked Up', 'Order is now in transit. Head to the delivery address.');
            loadOrders(false);
            router.push({ pathname: '/orders/order-tracking', params: { orderId } });
          } else {
            showError('Error', response.error || 'Failed to update order');
          }
        } catch (error) {
          showError('Error', 'Failed to update order status');
        }
      }
    );
  };

  const handleTrackActive = (orderId: string) => {
    router.push({ pathname: '/orders/order-tracking', params: { orderId } });
  };

  // Open external maps app for turn-by-turn navigation to the next stop
  const openMapsForOrder = useCallback((item: DriverOrder) => {
    // Before pickup → navigate to merchant; after pickup → navigate to delivery
    const target = item.status === 'in_transit' ? item.deliveryLocation : item.pickupLocation;
    if (!target?.latitude || !target?.longitude) return;

    const { latitude, longitude } = target;
    const label = item.status === 'in_transit'
      ? encodeURIComponent(item.delivery_address || 'Delivery location')
      : encodeURIComponent(item.merchantAddress || 'Pickup location');

    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
    const iosNative = `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`;

    if (Platform.OS === 'ios') {
      Linking.canOpenURL(iosNative).then((supported) => {
        Linking.openURL(supported ? iosNative : webUrl);
      });
    } else {
      Linking.openURL(webUrl);
    }
  }, []);

  const renderOrderCard = ({ item }: { item: DriverOrder }) => {
    const isActive = item.status === 'in_transit';

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.merchantName}>{item.merchantName}</Text>
            <Text style={styles.orderNumber}>#{item.order_number}</Text>
            {item.distance > 0 && (
              <Text style={styles.orderDistance}>📍 {item.distance} km away</Text>
            )}
          </View>
          <View style={styles.earningsContainer}>
            <Text style={styles.earningsLabel}>Earn</Text>
            <Text style={styles.earningsAmount}>₦{Number(item.estimatedEarnings).toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          {item.merchantAddress ? (
            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color="#4682B4" />
              <Text style={styles.locationText} numberOfLines={1}>
                Pickup: {item.merchantAddress}
              </Text>
            </View>
          ) : null}
          <View style={styles.locationRow}>
            <Ionicons name="navigate" size={16} color="#28a745" />
            <Text style={styles.locationText} numberOfLines={1}>
              Deliver: {item.delivery_address}
            </Text>
          </View>
          {item.items.length > 0 && (
            <View style={styles.locationRow}>
              <Ionicons name="cube-outline" size={16} color="#666" />
              <Text style={styles.locationText} numberOfLines={1}>
                {item.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
              </Text>
            </View>
          )}
          <Text style={styles.customerLabel}>Customer: {item.customerName}</Text>
        </View>

        <View style={styles.orderFooter}>
          {/* Quick-navigate icon — always visible, opens Google Maps directly */}
          <TouchableOpacity
            style={styles.mapsIconButton}
            onPress={() => openMapsForOrder(item)}
            accessibilityLabel="Open in Google Maps"
          >
            <Ionicons name="navigate-circle-outline" size={22} color="#4682B4" />
          </TouchableOpacity>

          {isActive ? (
            <TouchableOpacity
              style={styles.trackButton}
              onPress={() => handleTrackActive(item.id)}
            >
              <Ionicons name="navigate" size={16} color="#fff" />
              <Text style={styles.trackButtonText}>Live Navigate</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.pickupButton}
              onPress={() => handlePickUp(item.id)}
            >
              <Ionicons name="bag-check-outline" size={16} color="#fff" />
              <Text style={styles.pickupButtonText}>Mark Picked Up</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4682B4" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  const allOrders = [...activeOrders, ...assignedOrders];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Orders</Text>
        <TouchableOpacity onPress={() => loadOrders(false)}>
          <Ionicons name="refresh" size={24} color="#4682B4" />
        </TouchableOpacity>
      </View>

      {activeOrders.length > 0 && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🚚 Active Deliveries ({activeOrders.length})</Text>
        </View>
      )}

      {assignedOrders.length > 0 && activeOrders.length > 0 && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📦 Ready for Pickup ({assignedOrders.length})</Text>
        </View>
      )}

      {allOrders.length === 0 && assignedOrders.length === 0 && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Delivery Orders</Text>
        </View>
      )}

      <FlatList
        data={allOrders}
        renderItem={renderOrderCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No delivery orders</Text>
            <Text style={styles.emptySubtext}>
              Orders assigned to you will appear here
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#333' },
  sectionHeader: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  listContainer: { padding: 20 },
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
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: { flex: 1 },
  merchantName: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 2 },
  orderNumber: { fontSize: 13, color: '#888', marginBottom: 2 },
  orderDistance: { fontSize: 14, color: '#666' },
  earningsContainer: { alignItems: 'flex-end' },
  earningsLabel: { fontSize: 12, color: '#666' },
  earningsAmount: { fontSize: 18, fontWeight: '700', color: '#28a745' },
  orderDetails: { marginBottom: 15, gap: 6 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationText: { fontSize: 13, color: '#666', marginLeft: 8, flex: 1 },
  customerLabel: { fontSize: 13, color: '#666', marginTop: 2 },
  orderFooter: { flexDirection: 'row', gap: 10 },
  pickupButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#fd7e14',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pickupButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  mapsIconButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4682B4',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
  },
  trackButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#28a745',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  trackButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#666' },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#666', marginTop: 15 },
  emptySubtext: { fontSize: 14, color: '#999', marginTop: 8, textAlign: 'center' },
});
