import React, { useEffect, useState, useRef, useMemo } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';

import { locationService } from '../../services/locationService';
import { orderService } from '../../services/orderService';

import type { LocationData } from '../../services/types';


const { width } = Dimensions.get('window');

interface DriverLocation {
  latitude: number;
  longitude: number;
  timestamp?: string;
}

interface OrderDetails {
  id: string;
  orderDate?: string;
  commodityName?: string;
  deliveryAddress?: string;
  estimatedDelivery?: string;
  status?: string;
  deliveryTime?: string | null;
  driverId?: string | null;
  deliveryLocation?: { latitude: number; longitude: number };
  driver?: {
    current_latitude?: number;
    current_longitude?: number;
    timestamp?: string;
  };
}

export default function OrderTrackingScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [estimatedArrival, setEstimatedArrival] = useState<string>('Calculating...');

  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const driverPollRef = useRef<number | null>(null);
  const activeOrderId = useMemo(() => (typeof orderId === 'string' ? orderId : ''), [orderId]);

  const responsivePadding = Math.max(20, width * 0.05);

  const calcETA = (loc: DriverLocation) => {
    const deliveryLoc = orderDetails?.deliveryLocation;
    if (!deliveryLoc) return;

    const distanceKm = locationService.calculateDistance(
      loc.latitude,
      loc.longitude,
      deliveryLoc.latitude,
      deliveryLoc.longitude
    );

    // Assume average speed of 30 km/h
    const estimatedMinutes = Math.round((distanceKm / 30) * 60);
    setEstimatedArrival(estimatedMinutes > 0 ? `${estimatedMinutes} min` : 'Arriving soon');
  };

  const loadOrderDetails = async () => {
    try {
      setLoading(true);

      const response = await orderService.trackOrder(activeOrderId);
      if (response.success && response.data) {
        const nextOrder = response.data.order as unknown as OrderDetails;
        setOrderDetails(nextOrder);

        const driver = response.data.tracking?.driverInfo?.location
          ? {
              latitude: response.data.tracking.driverInfo.location.latitude,
              longitude: response.data.tracking.driverInfo.location.longitude,
              timestamp: undefined,
            }
          : null;

        if (driver) {
          setDriverLocation(driver);
          calcETA(driver);
        } else {
          setDriverLocation(null);
          setEstimatedArrival('Calculating...');
        }

        // Persist for offline fallback (best-effort)
        try {
          const ordersData = await AsyncStorage.getItem('userOrders');
          const orders = ordersData ? JSON.parse(ordersData) : [];
          const updatedOrders = orders.map((o: any) => (o.id === activeOrderId ? nextOrder : o));
          await AsyncStorage.setItem('userOrders', JSON.stringify(updatedOrders));
        } catch {
          // ignore
        }
      } else {
        // Fallback to local storage
        const ordersData = await AsyncStorage.getItem('userOrders');
        if (ordersData) {
          const orders = JSON.parse(ordersData);
          const found = orders.find((o: any) => o.id === activeOrderId);
          if (found) {
            setOrderDetails(found);
            if (found.driver?.current_latitude && found.driver?.current_longitude) {
              const dl: DriverLocation = {
                latitude: found.driver.current_latitude,
                longitude: found.driver.current_longitude,
                timestamp: found.driver.timestamp,
              };
              setDriverLocation(dl);
              calcETA(dl);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading order details:', error);

      // Fallback to local storage on error
      const ordersData = await AsyncStorage.getItem('userOrders');
      if (ordersData) {
        const orders = JSON.parse(ordersData);
        const found = orders.find((o: any) => o.id === activeOrderId);
        if (found) {
          setOrderDetails(found);
          if (found.driver?.current_latitude && found.driver?.current_longitude) {
            const dl: DriverLocation = {
              latitude: found.driver.current_latitude,
              longitude: found.driver.current_longitude,
              timestamp: found.driver.timestamp,
            };
            setDriverLocation(dl);
            calcETA(dl);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const subscribeToOrderUpdates = async (id: string) => {
    // Supabase realtime: listen to orders table updates
    const supabaseModule = await import('../../config/supabase');
    const { supabase } = supabaseModule;

    subscriptionRef.current = supabase
      .channel(`order_${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${id}`,
        },
        (payload: any) => {
          const next = payload?.new;
          if (!next) return;

          setOrderDetails((prev) => {
            if (!prev) return next;
            return {
              ...prev,
              ...next,
              driverId: next.driverId ?? prev.driverId,
              status: next.status ?? prev.status,
              driver: next.driver ?? prev.driver,
            };
          });

          const nextDriver = next?.driver;
          if (nextDriver?.current_latitude != null && nextDriver?.current_longitude != null) {
            const dl: DriverLocation = {
              latitude: nextDriver.current_latitude,
              longitude: nextDriver.current_longitude,
              timestamp: nextDriver.timestamp,
            };
            setDriverLocation(dl);
            calcETA(dl);
          }
        }
      )
      .subscribe();
  };

  const startDriverPollingFallback = async () => {
    if (!orderDetails?.driverId) return;

    // Poll every 10s as a fallback if realtime driver coordinates are not included in order payload.
    driverPollRef.current = window.setInterval(async () => {
      if (!orderDetails?.driverId) return;
      const resp = await locationService.getDriverLocation(orderDetails.driverId);
      if (resp) {
        const dl: DriverLocation = {
          latitude: (resp as any).latitude,
          longitude: (resp as any).longitude,
          timestamp: (resp as any).timestamp,
        };
        setDriverLocation(dl);
        calcETA(dl);
      }
    }, 10000);
  };

  useEffect(() => {
    if (!activeOrderId) return;

    loadOrderDetails();

    let cancelled = false;
    (async () => {
      try {
        await subscribeToOrderUpdates(activeOrderId);
      } catch (e) {
        console.warn('Supabase order subscription failed, will rely on polling:', e);
      }

      if (!cancelled) {
        // Best-effort polling fallback
        startDriverPollingFallback();
      }
    })();

    return () => {
      cancelled = true;
      subscriptionRef.current?.unsubscribe();
      subscriptionRef.current = null;

      if (driverPollRef.current != null) {
        clearInterval(driverPollRef.current);
        driverPollRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrderId]);

  useEffect(() => {
    if (!orderDetails?.driverId) {
      setDriverLocation(null);
      setEstimatedArrival('Calculating...');
      return;
    }

    // Trigger ETA calc when driverLocation changes
    if (driverLocation) calcETA(driverLocation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderDetails?.driverId, driverLocation]);

  const getOrderSteps = (): Array<{ status: string; title: string; time: string; completed: boolean; current: boolean }> => {
    if (!orderDetails) return [];

    const steps = [
      {
        status: 'pending',
        title: 'Order Placed',
        time: orderDetails.orderDate ? formatTime(orderDetails.orderDate) : 'Pending...',
        completed: false,
        current: false,
      },
      { status: 'confirmed', title: 'Order Confirmed', time: 'Pending...', completed: false, current: false },
      { status: 'preparing', title: 'Preparing Order', time: 'Pending...', completed: false, current: false },
      { status: 'out_for_delivery', title: 'Out for Delivery', time: 'Pending...', completed: false, current: false },
      {
        status: 'delivered',
        title: 'Delivered',
        time: orderDetails.deliveryTime || 'Pending...',
        completed: false,
        current: false,
      },
    ];

    const statusOrder = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];
    const currentIndex = Math.max(0, statusOrder.indexOf((orderDetails.status || 'pending') as any));

    return steps.map((step, index) => ({
      ...step,
      completed: index < currentIndex,
      current: index === currentIndex,
      time:
        index === 0
          ? orderDetails.orderDate
            ? formatTime(orderDetails.orderDate)
            : 'Pending...'
          : index === currentIndex
            ? 'In Progress...'
            : index < currentIndex
              ? 'Completed'
              : 'Pending...',
    }));
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Invalid Date';
    }
  };

  const driverTrackingActive =
    !!driverLocation &&
    (orderDetails?.status === 'out_for_delivery' || orderDetails?.status === 'preparing');

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

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingHorizontal: responsivePadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <Ionicons name="chevron-back" size={24} color="#0c1a2a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Order</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: responsivePadding }}>
          <View style={styles.orderCard}>
            <Text style={styles.orderId}>Order #{orderDetails.id}</Text>
            <View style={styles.orderInfo}>
              <View style={styles.infoRow}>
                <Ionicons name="cube-outline" size={20} color="#666" />
                <Text style={styles.infoText}>{orderDetails.commodityName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color="#666" />
                <Text style={styles.infoText}>{orderDetails.deliveryAddress}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={20} color="#666" />
                <Text style={styles.infoText}>Est. Delivery: {formatTime(orderDetails.estimatedDelivery || '')}</Text>
              </View>
            </View>
          </View>

          {driverTrackingActive && (
            <View style={styles.driverCard}>
              <View style={styles.driverHeader}>
                <Ionicons name="bicycle" size={24} color="#4682B4" />
                <Text style={styles.driverTitle}>Driver on the way</Text>
              </View>
              <View style={styles.driverInfo}>
                <View style={styles.driverRow}>
                  <Text style={styles.driverLabel}>ETA:</Text>
                  <Text style={styles.driverValue}>{estimatedArrival}</Text>
                </View>
                <View style={styles.driverRow}>
                  <Text style={styles.driverLabel}>Last updated:</Text>
                  <Text style={styles.driverValue}>
                    {driverLocation?.timestamp
                      ? new Date(driverLocation.timestamp).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'N/A'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.trackLiveButton}
                onPress={loadOrderDetails}
              >
                <Ionicons name="refresh" size={16} color="#4682B4" />
                <Text style={styles.trackLiveText}>Refresh Location</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.timelineSection}>
            <Text style={styles.sectionTitle}>Order Progress</Text>
            <View style={styles.timeline}>
              {getOrderSteps().map((step) => (
                <View key={step.status} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View
                      style={[
                        styles.timelineIcon,
                        step.completed && styles.completedIcon,
                        step.current && styles.currentIcon,
                      ]}
                    >
                      <Ionicons
                        name={step.completed ? 'checkmark' : step.current ? 'time' : 'ellipse-outline'}
                        size={16}
                        color={step.completed ? '#fff' : step.current ? '#4682B4' : '#ccc'}
                      />
                    </View>
                    <View style={[styles.timelineLine, step.completed && styles.completedLine]} />
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={[styles.timelineTitle, step.current && styles.currentStepTitle]}>{step.title}</Text>
                    <Text style={styles.timelineTime}>{step.time}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push(`/orders/order-details?id=${activeOrderId}`)}
            >
              <Ionicons name="information-circle-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>View Full Details</Text>
            </TouchableOpacity>

            {orderDetails.status !== 'delivered' && orderDetails.status !== 'cancelled' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => router.push(`/support`)}
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
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#e74c3c',
    marginBottom: 24,
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
  headerBackButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0c1a2a',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
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
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0c1a2a',
    marginBottom: 16,
  },
  orderInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0c1a2a',
    marginBottom: 20,
  },
  timeline: {
    paddingLeft: 10,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 15,
  },
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
  completedIcon: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  currentIcon: {
    backgroundColor: '#fff',
    borderColor: '#4682B4',
    borderWidth: 3,
  },
  timelineLine: {
    width: 2,
    height: 40,
    backgroundColor: '#e0e0e0',
    marginTop: 5,
  },
  completedLine: {
    backgroundColor: '#4CAF50',
  },
  timelineContent: {
    flex: 1,
    paddingTop: 4,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0c1a2a',
    marginBottom: 2,
  },
  currentStepTitle: {
    color: '#4682B4',
  },
  timelineTime: {
    fontSize: 12,
    color: '#666',
  },
  actions: {
    gap: 12,
    marginBottom: 30,
  },
  actionButton: {
    backgroundColor: '#4682B4',
    borderRadius: 25,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#4682B4',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#4682B4',
  },
  backButton: {
    backgroundColor: '#4682B4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
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
    borderLeftWidth: 4,
    borderLeftColor: '#4682B4',
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  driverTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0c1a2a',
  },
  driverInfo: {
    gap: 12,
    marginBottom: 16,
  },
  driverRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driverLabel: {
    fontSize: 14,
    color: '#666',
  },
  driverValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0c1a2a',
  },
  trackLiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4682B4',
  },
  trackLiveText: {
    color: '#4682B4',
    fontSize: 14,
    fontWeight: '600',
  },
});

