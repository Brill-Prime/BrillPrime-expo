import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../config/supabase';
import { orderService } from '../../services/orderService';
import { locationService } from '../../services/locationService';
import Map, { Marker, PROVIDER_GOOGLE } from '../../components/Map';

interface OrderStatus {
  status: string;
  title: string;
  time: string;
  completed: boolean;
  current: boolean;
}

// DB status values → display labels
const STATUS_STEPS = [
  { key: 'pending',    label: 'Order Placed' },
  { key: 'accepted',   label: 'Order Confirmed' },
  { key: 'preparing',  label: 'Preparing Order' },
  { key: 'ready',      label: 'Ready for Pickup' },
  { key: 'in_transit', label: 'Out for Delivery' },
  { key: 'delivered',  label: 'Delivered' },
];

export default function OrderTrackingScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number; timestamp?: string } | null>(null);
  const [estimatedArrival, setEstimatedArrival] = useState<string>('Calculating...');
  const cleanupRef = useRef<Array<() => void>>([]);

  // Dimension listener
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => sub?.remove();
  }, []);

  // Load and subscribe
  useEffect(() => {
    if (!orderId) return;

    let active = true;

    const load = async () => {
      await loadOrderDetails(active);
    };
    load();

    // Real-time order status subscription
    const orderChannel = supabase
      .channel(`order_tracking_${orderId}`)
      .on(
        'postgres_changes' as any,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload: any) => {
          if (!active) return;
          setOrderDetails((prev: any) => ({ ...prev, ...payload.new }));
        }
      )
      .subscribe();

    cleanupRef.current.push(() => supabase.removeChannel(orderChannel));

    return () => {
      active = false;
      cleanupRef.current.forEach(fn => fn());
      cleanupRef.current = [];
    };
  }, [orderId]);

  // Subscribe to driver location when driver is assigned
  useEffect(() => {
    if (!orderDetails?.driver_id) return;
    if (!['in_transit', 'ready'].includes(orderDetails?.status)) return;

    // Initial fetch
    locationService.getLiveLocation(orderDetails.driver_id).then((res) => {
      if (res.success && res.data) {
        setDriverLocation({
          latitude: res.data.latitude,
          longitude: res.data.longitude,
          timestamp: new Date(res.data.timestamp).toISOString(),
        });
        recalcETA(res.data.latitude, res.data.longitude);
      }
    });

    // Real-time subscription
    const unsub = locationService.subscribeToDriverLocation(
      orderDetails.driver_id,
      (loc) => {
        setDriverLocation({
          latitude: loc.latitude,
          longitude: loc.longitude,
          timestamp: new Date(loc.timestamp).toISOString(),
        });
        recalcETA(loc.latitude, loc.longitude);
      }
    );
    cleanupRef.current.push(unsub);

    return () => unsub();
  }, [orderDetails?.driver_id, orderDetails?.status]);

  const recalcETA = (driverLat: number, driverLng: number) => {
    if (!orderDetails?.delivery_latitude || !orderDetails?.delivery_longitude) return;
    const distance = locationService.calculateDistance(
      driverLat,
      driverLng,
      orderDetails.delivery_latitude,
      orderDetails.delivery_longitude
    );
    const mins = Math.round((distance / 30) * 60);
    setEstimatedArrival(mins > 0 ? `${mins} min` : 'Arriving soon');
  };

  const loadOrderDetails = async (active = true) => {
    try {
      setLoading(true);
      const response = await orderService.trackOrder(orderId as string);
      if (!active) return;

      if (response.success && response.data) {
        setOrderDetails(response.data.order);
        if (response.data.tracking.driverInfo?.location) {
          const loc = response.data.tracking.driverInfo.location;
          setDriverLocation({ latitude: loc.latitude, longitude: loc.longitude });
        }
      }
    } catch (error) {
      console.error('Error loading order details:', error);
    } finally {
      if (active) setLoading(false);
    }
  };

  const getOrderSteps = (): OrderStatus[] => {
    if (!orderDetails) return [];

    const currentIndex = STATUS_STEPS.findIndex(s => s.key === orderDetails.status);

    return STATUS_STEPS.map((step, index) => ({
      status: step.key,
      title: step.label,
      completed: index < currentIndex,
      current: index === currentIndex,
      time:
        index === 0 ? formatTime(orderDetails.created_at) :
        index < currentIndex ? 'Completed' :
        index === currentIndex ? 'In Progress...' :
        'Pending...',
    }));
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const responsivePadding = Math.max(20, screenWidth * 0.05);

  // Coords used by the inline map card
  const deliveryCoords = useMemo(() => {
    if (!orderDetails?.delivery_latitude || !orderDetails?.delivery_longitude) return null;
    return {
      latitude: Number(orderDetails.delivery_latitude),
      longitude: Number(orderDetails.delivery_longitude),
    };
  }, [orderDetails?.delivery_latitude, orderDetails?.delivery_longitude]);

  const mapRegion = useMemo(() => {
    if (driverLocation && deliveryCoords) {
      const midLat = (driverLocation.latitude + deliveryCoords.latitude) / 2;
      const midLng = (driverLocation.longitude + deliveryCoords.longitude) / 2;
      const latDelta = Math.max(Math.abs(driverLocation.latitude - deliveryCoords.latitude) * 1.6, 0.01);
      const lngDelta = Math.max(Math.abs(driverLocation.longitude - deliveryCoords.longitude) * 1.6, 0.01);
      return { latitude: midLat, longitude: midLng, latitudeDelta: latDelta, longitudeDelta: lngDelta };
    }
    if (driverLocation) {
      return { latitude: driverLocation.latitude, longitude: driverLocation.longitude, latitudeDelta: 0.012, longitudeDelta: 0.012 };
    }
    if (deliveryCoords) {
      return { latitude: deliveryCoords.latitude, longitude: deliveryCoords.longitude, latitudeDelta: 0.012, longitudeDelta: 0.012 };
    }
    return { latitude: 6.5244, longitude: 3.3792, latitudeDelta: 0.1, longitudeDelta: 0.1 };
  }, [driverLocation, deliveryCoords]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4682B4" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!orderDetails) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#e74c3c" />
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isDeliveryActive = ['in_transit', 'ready'].includes(orderDetails.status);
  const productName = orderDetails.items?.[0]?.product?.name ?? orderDetails.notes ?? 'Order';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: responsivePadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <Ionicons name="chevron-back" size={24} color="#0c1a2a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Order</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: responsivePadding }}>
          {/* Order Info Card */}
          <View style={styles.orderCard}>
            <Text style={styles.orderId}>Order #{orderDetails.order_number}</Text>
            <View style={styles.orderInfo}>
              <View style={styles.infoRow}>
                <Ionicons name="cube-outline" size={20} color="#666" />
                <Text style={styles.infoText}>{productName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color="#666" />
                <Text style={styles.infoText}>{orderDetails.delivery_address}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="cash-outline" size={20} color="#666" />
                <Text style={styles.infoText}>₦{Number(orderDetails.total_amount ?? 0).toLocaleString()}</Text>
              </View>
            </View>
          </View>

          {/* Live Driver Map — compact card shown when driver is active */}
          {driverLocation && isDeliveryActive && (
            <View style={styles.mapCard}>
              {/* Card header */}
              <View style={styles.mapCardHeader}>
                <View style={styles.mapCardTitleRow}>
                  <View style={styles.liveDot} />
                  <Text style={styles.mapCardTitle}>Live Driver Location</Text>
                </View>
                {estimatedArrival && estimatedArrival !== 'Calculating...' && (
                  <View style={styles.mapEtaChip}>
                    <Ionicons name="time-outline" size={13} color="#4682B4" />
                    <Text style={styles.mapEtaText}>{estimatedArrival}</Text>
                  </View>
                )}
              </View>

              {/* Map surface */}
              <View style={styles.mapSurface}>
                <Map
                  provider={PROVIDER_GOOGLE}
                  style={styles.inlineMap}
                  region={mapRegion}
                  zoomEnabled={true}
                  scrollEnabled={true}
                  showsUserLocation={false}
                  userType="consumer"
                  // Draw a live route from driver → delivery destination
                  showRoute={!!deliveryCoords}
                  origin={driverLocation}
                  destination={deliveryCoords ?? undefined}
                >
                  {/* Driver pin */}
                  <Marker
                    coordinate={{ latitude: driverLocation.latitude, longitude: driverLocation.longitude }}
                    title="Driver"
                    pinColor="#4682B4"
                  />
                  {/* Delivery pin */}
                  {deliveryCoords && (
                    <Marker
                      coordinate={deliveryCoords}
                      title="Your delivery location"
                      pinColor="#28a745"
                    />
                  )}
                </Map>
              </View>

              {/* Footer hint */}
              <View style={styles.mapCardFooter}>
                <Ionicons name="location" size={13} color="#4682B4" />
                <Text style={styles.mapCardFooterText}>
                  {orderDetails.status === 'ready'
                    ? 'Driver is heading to the merchant to pick up your order'
                    : 'Driver is on the way to your delivery address'}
                </Text>
              </View>
            </View>
          )}

          {/* Driver Card — only shown when order is in transit / ready */}
          {driverLocation && isDeliveryActive && (
            <View style={styles.driverCard}>
              <View style={styles.driverHeader}>
                <Ionicons name="bicycle" size={24} color="#4682B4" />
                <Text style={styles.driverTitle}>
                  {orderDetails.status === 'ready' ? 'Driver assigned — heading to pick up' : 'Driver on the way'}
                </Text>
              </View>
              {orderDetails.driver && (
                <Text style={styles.driverName}>
                  {orderDetails.driver.first_name} {orderDetails.driver.last_name}
                </Text>
              )}
              <View style={styles.driverInfo}>
                <View style={styles.driverRow}>
                  <Text style={styles.driverLabel}>ETA:</Text>
                  <Text style={styles.driverValue}>{estimatedArrival}</Text>
                </View>
                {driverLocation.timestamp && (
                  <View style={styles.driverRow}>
                    <Text style={styles.driverLabel}>Last updated:</Text>
                    <Text style={styles.driverValue}>
                      {new Date(driverLocation.timestamp).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Tracking Timeline */}
          <View style={styles.timelineSection}>
            <Text style={styles.sectionTitle}>Order Progress</Text>
            <View style={styles.timeline}>
              {getOrderSteps().map((step, index, arr) => (
                <View key={step.status} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={[
                      styles.timelineIcon,
                      step.completed && styles.completedIcon,
                      step.current && styles.currentIcon,
                    ]}>
                      <Ionicons
                        name={step.completed ? 'checkmark' : step.current ? 'time' : 'ellipse-outline'}
                        size={16}
                        color={step.completed ? '#fff' : step.current ? '#4682B4' : '#ccc'}
                      />
                    </View>
                    {index < arr.length - 1 && (
                      <View style={[styles.timelineLine, step.completed && styles.completedLine]} />
                    )}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={[styles.timelineTitle, step.current && styles.currentStepTitle]}>
                      {step.title}
                    </Text>
                    <Text style={styles.timelineTime}>{step.time}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push(`/orders/order-details?id=${orderId}`)}
            >
              <Ionicons name="information-circle-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>View Full Details</Text>
            </TouchableOpacity>

            {orderDetails.status !== 'delivered' && orderDetails.status !== 'cancelled' && orderDetails.status !== 'rejected' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => router.push('/support')}
              >
                <Ionicons name="help-circle-outline" size={20} color="#4682B4" />
                <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Need Help?</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666' },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 40,
  },
  errorText: { marginTop: 16, fontSize: 18, fontWeight: '600', color: '#e74c3c', marginBottom: 24 },
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
  headerBackButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#0c1a2a', flex: 1, textAlign: 'center' },
  placeholder: { width: 40 },
  content: { flex: 1 },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderId: { fontSize: 18, fontWeight: 'bold', color: '#0c1a2a', marginBottom: 16 },
  orderInfo: { gap: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoText: { fontSize: 14, color: '#666', flex: 1 },
  driverCard: {
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
  driverHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  driverTitle: { fontSize: 16, fontWeight: '600', color: '#0c1a2a', flex: 1 },
  driverName: { fontSize: 14, color: '#4682B4', marginBottom: 8, fontWeight: '500' },
  driverInfo: { gap: 8 },
  driverRow: { flexDirection: 'row', gap: 8 },
  driverLabel: { fontSize: 14, color: '#666', fontWeight: '500' },
  driverValue: { fontSize: 14, color: '#0c1a2a', fontWeight: '600' },
  timelineSection: {
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
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0c1a2a', marginBottom: 20 },
  timeline: { paddingLeft: 10 },
  timelineItem: { flexDirection: 'row', marginBottom: 20 },
  timelineLeft: { alignItems: 'center', marginRight: 15 },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  completedIcon: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  currentIcon: { backgroundColor: '#fff', borderColor: '#4682B4', borderWidth: 3 },
  timelineLine: { width: 2, height: 40, backgroundColor: '#e0e0e0', marginTop: 5 },
  completedLine: { backgroundColor: '#4CAF50' },
  timelineContent: { flex: 1, paddingTop: 4 },
  timelineTitle: { fontSize: 15, fontWeight: '600', color: '#0c1a2a', marginBottom: 2 },
  currentStepTitle: { color: '#4682B4' },
  timelineTime: { fontSize: 12, color: '#666' },
  actions: { gap: 12, marginBottom: 30 },
  actionButton: {
    backgroundColor: '#4682B4',
    borderRadius: 25,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButton: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#4682B4' },
  actionButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryButtonText: { color: '#4682B4' },
  backButton: { backgroundColor: '#4682B4', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  backButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  // ── Live driver map card ────────────────────────────────────────────────
  mapCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  mapCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#28a745',
    // pulse implied by green colour; full animation would need Animated API
  },
  mapCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0c1a2a',
  },
  mapEtaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  mapEtaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4682B4',
  },
  mapSurface: {
    height: 220,
    width: '100%',
  },
  inlineMap: {
    flex: 1,
  },
  mapCardFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f8faff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  mapCardFooterText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    lineHeight: 17,
  },
});
