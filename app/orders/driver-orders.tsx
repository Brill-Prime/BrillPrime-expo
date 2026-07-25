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

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = 'available' | 'assigned' | 'active';

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
  driver_id: string | null;
  items: Array<{ name: string; quantity: number }>;
  pickupLocation: { latitude: number; longitude: number };
  deliveryLocation: { latitude: number; longitude: number };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapOrder(
  order: any,
  currentLocation: { latitude: number; longitude: number } | null,
): DriverOrder {
  const merchantLat = order.merchant?.latitude ?? 0;
  const merchantLng = order.merchant?.longitude ?? 0;
  let distance = 0;
  if (currentLocation && merchantLat && merchantLng) {
    distance = locationService.calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      merchantLat,
      merchantLng,
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
    driver_id: order.driver_id ?? null,
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

// ─── Component ───────────────────────────────────────────────────────────────

export default function DriverOrders() {
  const router = useRouter();
  const { showError, showSuccess, showConfirmDialog } = useAlert();

  const [availableOrders, setAvailableOrders] = useState<DriverOrder[]>([]);
  const [assignedOrders, setAssignedOrders] = useState<DriverOrder[]>([]);
  const [activeOrders, setActiveOrders] = useState<DriverOrder[]>([]);

  const [activeTab, setActiveTab] = useState<Tab>('available');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const cleanupRef = useRef<Array<() => void>>([]);

  // ── Boot: GPS + live tracking ───────────────────────────────────────────
  useEffect(() => {
    locationService.getCurrentLocation().then((loc) => {
      if (loc?.coords) {
        setCurrentLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      }
    });

    locationService.startLiveTracking(5000).catch(console.error);

    return () => {
      locationService.stopLiveTracking();
      cleanupRef.current.forEach((fn) => fn());
      cleanupRef.current = [];
    };
  }, []);

  // ── Load + subscribe when GPS ready ────────────────────────────────────
  useEffect(() => {
    loadAllOrders();
    subscribeToAssignedOrders();
    subscribeToAvailableOrdersChannel();
  }, [currentLocation]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Data fetching ───────────────────────────────────────────────────────

  const loadAllOrders = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const [availRes, assignedRes, activeRes] = await Promise.all([
        orderService.getAvailableOrders(),
        orderService.getDriverOrders({ status: 'ready' }),
        orderService.getDriverOrders({ status: 'in_transit' }),
      ]);

      if (availRes.success && availRes.data) {
        setAvailableOrders(availRes.data.orders.map((o) => mapOrder(o, currentLocation)));
      }
      if (assignedRes.success && assignedRes.data) {
        setAssignedOrders(
          assignedRes.data.orders.map((o) => mapOrder(o, currentLocation)),
        );
      }
      if (activeRes.success && activeRes.data) {
        setActiveOrders(
          activeRes.data.orders.map((o) => mapOrder(o, currentLocation)),
        );
      }
    } catch (err) {
      console.error('Error loading orders:', err);
      showError('Error', 'Failed to load orders');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAllOrders(false);
  }, [currentLocation]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Realtime: orders assigned to this driver ────────────────────────────
  const subscribeToAssignedOrders = async () => {
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
          loadAllOrders(false);
        },
      )
      .subscribe();

    cleanupRef.current.push(() => supabase.removeChannel(channel));
  };

  // ── Realtime: available order pool ──────────────────────────────────────
  const subscribeToAvailableOrdersChannel = () => {
    const unsub = orderService.subscribeToAvailableOrders((order, eventType) => {
      if (eventType === 'UPDATE' && order.driver_id) {
        // Someone claimed it — remove from available list
        setAvailableOrders((prev) => prev.filter((o) => o.id !== order.id));
        return;
      }
      // New or updated unclaimed ready order — just refresh for simplicity
      orderService.getAvailableOrders().then((res) => {
        if (res.success && res.data) {
          setAvailableOrders(res.data.orders.map((o) => mapOrder(o, currentLocation)));
        }
      });
    });
    cleanupRef.current.push(unsub);
  };

  // ── Actions ─────────────────────────────────────────────────────────────

  const handleClaimOrder = async (orderId: string, orderNumber: string) => {
    showConfirmDialog(
      'Claim Delivery',
      `Claim order #${orderNumber}? It will be assigned to you immediately.`,
      async () => {
        setClaimingId(orderId);
        try {
          const result = await orderService.claimOrder(orderId);
          if (result.success) {
            showSuccess('Order Claimed!', 'Head to the merchant to pick it up.');
            setActiveTab('assigned');
            await loadAllOrders(false);
          } else if (result.alreadyClaimed) {
            showError(
              'Already Taken',
              'Another driver claimed this order just before you. Try another one.',
            );
            // Refresh available list to reflect the new state
            const res = await orderService.getAvailableOrders();
            if (res.success && res.data) {
              setAvailableOrders(res.data.orders.map((o) => mapOrder(o, currentLocation)));
            }
          } else {
            showError('Error', result.error || 'Failed to claim order');
          }
        } catch (err) {
          showError('Error', 'Failed to claim order');
        } finally {
          setClaimingId(null);
        }
      },
    );
  };

  const handlePickUp = async (orderId: string) => {
    showConfirmDialog(
      'Confirm Pickup',
      'Mark this order as picked up and start delivery?',
      async () => {
        try {
          const response = await orderService.updateOrderStatus(orderId, 'in_transit');
          if (response.success) {
            showSuccess('Picked Up', 'Order is now in transit. Head to the delivery address.');
            loadAllOrders(false);
            router.push({ pathname: '/orders/order-tracking', params: { orderId } });
          } else {
            showError('Error', response.error || 'Failed to update order');
          }
        } catch {
          showError('Error', 'Failed to update order status');
        }
      },
    );
  };

  const handleTrackActive = (orderId: string) => {
    router.push({ pathname: '/orders/order-tracking', params: { orderId } });
  };

  const openMapsForOrder = useCallback((item: DriverOrder) => {
    const target =
      item.status === 'in_transit' ? item.deliveryLocation : item.pickupLocation;
    if (!target?.latitude || !target?.longitude) return;

    const { latitude, longitude } = target;
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
    const iosNative = `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`;

    if (Platform.OS === 'ios') {
      Linking.canOpenURL(iosNative).then((supported) =>
        Linking.openURL(supported ? iosNative : webUrl),
      );
    } else {
      Linking.openURL(webUrl);
    }
  }, []);

  // ── Render helpers ───────────────────────────────────────────────────────

  const renderAvailableCard = ({ item }: { item: DriverOrder }) => {
    const isClaiming = claimingId === item.id;

    return (
      <View style={styles.orderCard}>
        {/* Earnings badge */}
        <View style={styles.availableBadge}>
          <Text style={styles.availableBadgeText}>OPEN</Text>
        </View>

        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.merchantName}>{item.merchantName}</Text>
            <Text style={styles.orderNumber}>#{item.order_number}</Text>
            {item.distance > 0 && (
              <Text style={styles.orderDistance}>📍 {item.distance} km to pickup</Text>
            )}
          </View>
          <View style={styles.earningsContainer}>
            <Text style={styles.earningsLabel}>Earn</Text>
            <Text style={styles.earningsAmount}>
              ₦{Number(item.estimatedEarnings).toLocaleString()}
            </Text>
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
                {item.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
              </Text>
            </View>
          )}
          <Text style={styles.customerLabel}>Customer: {item.customerName}</Text>
        </View>

        <View style={styles.orderFooter}>
          <TouchableOpacity
            style={styles.mapsIconButton}
            onPress={() => openMapsForOrder(item)}
            accessibilityLabel="Preview route in Maps"
          >
            <Ionicons name="navigate-circle-outline" size={22} color="#4682B4" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.claimButton, isClaiming && styles.claimButtonDisabled]}
            onPress={() => handleClaimOrder(item.id, item.order_number)}
            disabled={isClaiming}
          >
            {isClaiming ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="hand-right-outline" size={16} color="#fff" />
                <Text style={styles.claimButtonText}>Claim Delivery</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderAssignedCard = ({ item }: { item: DriverOrder }) => (
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
          <Text style={styles.earningsAmount}>
            ₦{Number(item.estimatedEarnings).toLocaleString()}
          </Text>
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
              {item.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
            </Text>
          </View>
        )}
        <Text style={styles.customerLabel}>Customer: {item.customerName}</Text>
      </View>

      <View style={styles.orderFooter}>
        <TouchableOpacity
          style={styles.mapsIconButton}
          onPress={() => openMapsForOrder(item)}
          accessibilityLabel="Open in Google Maps"
        >
          <Ionicons name="navigate-circle-outline" size={22} color="#4682B4" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.pickupButton}
          onPress={() => handlePickUp(item.id)}
        >
          <Ionicons name="bag-check-outline" size={16} color="#fff" />
          <Text style={styles.pickupButtonText}>Mark Picked Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderActiveCard = ({ item }: { item: DriverOrder }) => (
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
          <Text style={styles.earningsAmount}>
            ₦{Number(item.estimatedEarnings).toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
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
              {item.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
            </Text>
          </View>
        )}
        <Text style={styles.customerLabel}>Customer: {item.customerName}</Text>
      </View>

      <View style={styles.orderFooter}>
        <TouchableOpacity
          style={styles.mapsIconButton}
          onPress={() => openMapsForOrder(item)}
          accessibilityLabel="Open in Google Maps"
        >
          <Ionicons name="navigate-circle-outline" size={22} color="#4682B4" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.trackButton}
          onPress={() => handleTrackActive(item.id)}
        >
          <Ionicons name="navigate" size={16} color="#fff" />
          <Text style={styles.trackButtonText}>Live Navigate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── Tab metadata ─────────────────────────────────────────────────────────

  const tabs: { key: Tab; label: string; count: number; icon: string }[] = [
    {
      key: 'available',
      label: 'Available',
      count: availableOrders.length,
      icon: 'flash-outline',
    },
    {
      key: 'assigned',
      label: 'My Pickups',
      count: assignedOrders.length,
      icon: 'bag-check-outline',
    },
    {
      key: 'active',
      label: 'Active',
      count: activeOrders.length,
      icon: 'bicycle-outline',
    },
  ];

  const currentData =
    activeTab === 'available'
      ? availableOrders
      : activeTab === 'assigned'
      ? assignedOrders
      : activeOrders;

  const emptyMessages: Record<Tab, { icon: string; title: string; sub: string }> = {
    available: {
      icon: 'flash-outline',
      title: 'No orders available',
      sub: 'New orders will appear here when merchants mark items ready.',
    },
    assigned: {
      icon: 'bag-check-outline',
      title: 'No pickups yet',
      sub: 'Claim an order from the Available tab to start earning.',
    },
    active: {
      icon: 'bicycle-outline',
      title: 'No active deliveries',
      sub: 'Mark a pickup as collected to start your active run.',
    },
  };

  const empty = emptyMessages[activeTab];

  // ── Loading screen ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4682B4" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Orders</Text>
        <TouchableOpacity onPress={() => loadAllOrders(false)}>
          <Ionicons name="refresh" size={24} color="#4682B4" />
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <View style={styles.tabLabelRow}>
                <Ionicons
                  name={tab.icon as any}
                  size={15}
                  color={isActive ? '#4682B4' : '#999'}
                />
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
                {tab.count > 0 && (
                  <View
                    style={[
                      styles.tabBadge,
                      isActive
                        ? styles.tabBadgeActive
                        : tab.key === 'available'
                        ? styles.tabBadgeNew
                        : styles.tabBadgeInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabBadgeText,
                        (isActive || tab.key === 'available') && styles.tabBadgeTextLight,
                      ]}
                    >
                      {tab.count}
                    </Text>
                  </View>
                )}
              </View>
              {isActive && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Order list */}
      <FlatList
        data={currentData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={
          activeTab === 'available'
            ? renderAvailableCard
            : activeTab === 'assigned'
            ? renderAssignedCard
            : renderActiveCard
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name={empty.icon as any} size={64} color="#ccc" />
            <Text style={styles.emptyText}>{empty.title}</Text>
            <Text style={styles.emptySubtext}>{empty.sub}</Text>
          </View>
        }
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#333' },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabItemActive: {},
  tabLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tabLabel: { fontSize: 13, fontWeight: '500', color: '#999' },
  tabLabelActive: { color: '#4682B4', fontWeight: '700' },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e9ecef',
  },
  tabBadgeActive: { backgroundColor: '#4682B4' },
  tabBadgeNew: { backgroundColor: '#28a745' },   // green for "new available orders"
  tabBadgeInactive: { backgroundColor: '#e9ecef' },
  tabBadgeText: { fontSize: 10, fontWeight: '700', color: '#666' },
  tabBadgeTextLight: { color: '#fff' },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    right: 12,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#4682B4',
  },

  // List
  listContainer: { padding: 16, paddingBottom: 40 },

  // Order card
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  availableBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#e8f5e9',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  availableBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#28a745',
    letterSpacing: 0.5,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingRight: 52, // room for the OPEN badge
  },
  orderInfo: { flex: 1 },
  merchantName: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 2 },
  orderNumber: { fontSize: 13, color: '#888', marginBottom: 2 },
  orderDistance: { fontSize: 13, color: '#666' },
  earningsContainer: { alignItems: 'flex-end' },
  earningsLabel: { fontSize: 12, color: '#666' },
  earningsAmount: { fontSize: 18, fontWeight: '700', color: '#28a745' },

  orderDetails: { marginBottom: 14, gap: 6 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationText: { fontSize: 13, color: '#666', marginLeft: 8, flex: 1 },
  customerLabel: { fontSize: 13, color: '#666', marginTop: 2 },

  orderFooter: { flexDirection: 'row', gap: 10 },

  // Action buttons
  claimButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#28a745',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  claimButtonDisabled: { backgroundColor: '#6cb97a', opacity: 0.8 },
  claimButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },

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

  trackButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4682B4',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  trackButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },

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

  // Loading / empty
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#666' },
  emptyContainer: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#666', marginTop: 16 },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
