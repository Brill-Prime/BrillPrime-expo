
import React, { useState, useEffect } from 'react';
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

interface OrderStatus {
  status: string;
  title: string;
  time: string;
  completed: boolean;
  current: boolean;
}

export default function OrderTrackingScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams();
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [estimatedArrival, setEstimatedArrival] = useState<string>('Calculating...');

  useEffect(() => {
    loadOrderDetails();

    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    // Set up real-time order status subscription
    let orderSubscription: { unsubscribe: () => void } | null = null;
    const setupRealtimeSubscription = async () => {
      try {
        const { supabase } = await import('../../config/supabase');
        orderSubscription = supabase
          .channel(`order_${orderId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'orders',
              filter: `id=eq.${orderId}`,
            },
            (payload: any) => {
              console.log('Order updated:', payload.new);
              setOrderDetails((prev: any) => ({
                ...prev,
                ...payload.new,
                status: payload.new.status,
              }));
            }
          )
          .subscribe();
      } catch (error) {
        console.error('Error setting up order subscription:', error);
      }
    };

    setupRealtimeSubscription();

    // Poll for order updates every 10 seconds as fallback
    const pollInterval = setInterval(() => {
      loadOrderDetails();
      if (orderDetails?.driverId && (orderDetails.status === 'out_for_delivery' || orderDetails.status === 'preparing')) {
        updateDriverLocation();
      }
    }, 10000);

    // Initial driver location update
    if (orderDetails?.driverId) {
      updateDriverLocation();
    }

    return () => {
      subscription?.remove();
      orderSubscription?.unsubscribe();
      clearInterval(pollInterval);
    };
  }, [orderId, orderDetails?.driverId, orderDetails?.status]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      
      // Try to load from backend first
      const { orderService } = await import('../../services/orderService');
      const response = await orderService.trackOrder(orderId as string);
      
      if (response.success && response.data) {
        setOrderDetails(response.data.order);
        
        // Update local storage with latest data
        const ordersData = await AsyncStorage.getItem('userOrders');
        const orders = ordersData ? JSON.parse(ordersData) : [];
        const updatedOrders = orders.map((o: any) => 
          o.id === orderId ? response.data.order : o
        );
        await AsyncStorage.setItem('userOrders', JSON.stringify(updatedOrders));
      } else {
        // Fallback to local storage
        const ordersData = await AsyncStorage.getItem('userOrders');
        if (ordersData) {
          const orders = JSON.parse(ordersData);
          const order = orders.find((o: any) => o.id === orderId);
          if (order) {
            setOrderDetails(order);
          }
        }
      }
    } catch (error) {
      console.error('Error loading order details:', error);
      
      // Fallback to local storage on error
      const ordersData = await AsyncStorage.getItem('userOrders');
      if (ordersData) {
        const orders = JSON.parse(ordersData);
        const order = orders.find((o: any) => o.id === orderId);
        if (order) {
          setOrderDetails(order);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const getOrderSteps = (): OrderStatus[] => {
    if (!orderDetails) return [];

    const steps = [
      { status: 'pending', title: 'Order Placed', time: formatTime(orderDetails.orderDate), completed: false, current: false },
      { status: 'confirmed', title: 'Order Confirmed', time: 'Pending...', completed: false, current: false },
      { status: 'preparing', title: 'Preparing Order', time: 'Pending...', completed: false, current: false },
      { status: 'out_for_delivery', title: 'Out for Delivery', time: 'Pending...', completed: false, current: false },
      { status: 'delivered', title: 'Delivered', time: orderDetails.deliveryTime || 'Pending...', completed: false, current: false }
    ];

    const statusOrder = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];
    const currentIndex = statusOrder.indexOf(orderDetails.status);

    return steps.map((step, index) => ({
      ...step,
      completed: index < currentIndex,
      current: index === currentIndex,
      time: index === 0 ? formatTime(orderDetails.orderDate) : 
            index === currentIndex ? 'In Progress...' :
            index < currentIndex ? 'Completed' : 'Pending...'
    }));
  };

  const updateDriverLocation = async () => {
    if (!orderDetails?.driverId) return;

    try {
      const { locationService } = await import('../../services/locationService');
      const response = await locationService.getLiveLocation(orderDetails.driverId);
      
      if (response.success && response.data) {
        setDriverLocation(response.data);
        
        // Calculate ETA if we have delivery address coordinates
        if (orderDetails.deliveryLocation) {
          const distance = locationService.calculateDistance(
            response.data.latitude,
            response.data.longitude,
            orderDetails.deliveryLocation.latitude,
            orderDetails.deliveryLocation.longitude
          );
          
          // Assume average speed of 30 km/h
          const estimatedMinutes = Math.round((distance / 30) * 60);
          setEstimatedArrival(estimatedMinutes > 0 ? `${estimatedMinutes} min` : 'Arriving soon');
        }
      }
    } catch (error) {
      console.error('Error updating driver location:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const responsivePadding = Math.max(20, screenDimensions.width * 0.05);

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
                <Text style={styles.infoText}>
                  Est. Delivery: {formatTime(orderDetails.estimatedDelivery)}
                </Text>
              </View>
            </View>
          </View>

          {/* Driver Location Card */}
          {driverLocation && (orderDetails.status === 'out_for_delivery' || orderDetails.status === 'preparing') && (
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
                    {new Date(driverLocation.timestamp).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.trackLiveButton}
                onPress={() => updateDriverLocation()}
              >
                <Ionicons name="refresh" size={16} color="#4682B4" />
                <Text style={styles.trackLiveText}>Refresh Location</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Tracking Timeline */}
          <View style={styles.timelineSection}>
            <Text style={styles.sectionTitle}>Order Progress</Text>
            <View style={styles.timeline}>
              {getOrderSteps().map((step, index) => (
                <View key={step.status} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={[
                      styles.timelineIcon,
                      step.completed && styles.completedIcon,
                      step.current && styles.currentIcon
                    ]}>
                      <Ionicons 
                        name={step.completed ? "checkmark" : step.current ? "time" : "ellipse-outline"} 
                        size={16} 
                        color={step.completed ? "#fff" : step.current ? "#4682B4" : "#ccc"} 
                      />
                    </View>
                    {index < getOrderSteps().length - 1 && (
                      <View style={[
                        styles.timelineLine,
                        step.completed && styles.completedLine
                      ]} />
                    )}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={[
                      styles.timelineTitle,
                      step.current && styles.currentStepTitle
                    ]}>
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

            {orderDetails.status !== 'delivered' && orderDetails.status !== 'cancelled' && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => router.push(`/support`)}
              >
                <Ionicons name="help-circle-outline" size={20} color="#4682B4" />
                <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
                  Need Help?
                </Text>
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

