
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import MapView, { PROVIDER_GOOGLE, Marker } from './Map';
import CommunicationModal from './CommunicationModal';
import { locationService } from '../services/locationService';
import { orderService } from '../services/orderService';

interface LiveOrderTrackerProps {
  orderId: string;
  userRole: 'consumer' | 'driver';
  onClose: () => void;
}

export default function LiveOrderTracker({ orderId, userRole, onClose }: LiveOrderTrackerProps) {
  const [order, setOrder] = useState<any | null>(null);
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [consumerLocation, setConsumerLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState<string>('');
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);
  const router = useRouter();
  const cleanupRef = useRef<Array<() => void>>([]);

  // Cleanup all subscriptions on unmount
  useEffect(() => {
    return () => {
      cleanupRef.current.forEach(fn => fn());
      cleanupRef.current = [];
      locationService.stopLiveTracking();
    };
  }, []);

  // Load order and start tracking
  useEffect(() => {
    let active = true;

    const init = async () => {
      await loadOrderDetails(active);

      if (userRole === 'driver') {
        // Driver broadcasts their own live GPS position
        await locationService.startLiveTracking(3000);
        if (active) setIsTracking(true);
      } else {
        // Consumer gets their own position to calculate ETA
        const loc = await locationService.getCurrentLocation();
        if (loc && active) {
          setConsumerLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        }
        if (active) setIsTracking(true);
      }
    };

    init();

    // Subscribe to live order status updates
    const unsubscribeOrder = orderService.subscribeToOrderUpdates(orderId, (updatedOrder) => {
      if (!active) return;
      setOrder((prev: any) => ({ ...prev, ...updatedOrder }));
    });
    cleanupRef.current.push(unsubscribeOrder);

    return () => { active = false; };
  }, [orderId]);

  // Subscribe to driver's real-time location when driver ID is known
  useEffect(() => {
    if (!order?.driver_id || userRole !== 'consumer') return;

    // Initial fetch
    locationService.getLiveLocation(order.driver_id).then((res) => {
      if (res.success && res.data) {
        setDriverLocation({ latitude: res.data.latitude, longitude: res.data.longitude });
      }
    });

    // Real-time subscription
    const unsubscribe = locationService.subscribeToDriverLocation(
      order.driver_id,
      (loc) => {
        setDriverLocation({ latitude: loc.latitude, longitude: loc.longitude });
      }
    );
    cleanupRef.current.push(unsubscribe);

    return () => {
      unsubscribe();
    };
  }, [order?.driver_id, userRole]);

  // Recalculate ETA whenever positions change
  useEffect(() => {
    if (driverLocation && consumerLocation) {
      const distance = locationService.calculateDistance(
        driverLocation.latitude,
        driverLocation.longitude,
        consumerLocation.latitude,
        consumerLocation.longitude
      );
      const mins = Math.round((distance / 30) * 60);
      setEstimatedTime(mins > 0 ? `${mins} min` : 'Arriving soon');
    }
  }, [driverLocation, consumerLocation]);

  const loadOrderDetails = async (active = true) => {
    const response = await orderService.trackOrder(orderId);
    if (!active) return;
    if (response.success && response.data) {
      setOrder(response.data.order);
      if (response.data.tracking.driverInfo?.location) {
        setDriverLocation(response.data.tracking.driverInfo.location);
      }
    }
  };

  const handleMarkPickedUp = async () => {
    try {
      const response = await orderService.updateOrderStatus(orderId, 'in_transit');
      if (response.success) {
        Alert.alert('Success', 'Order marked as picked up — delivery in progress!');
        setOrder((prev: any) => ({ ...prev, status: 'in_transit' }));
      } else {
        Alert.alert('Error', response.error || 'Failed to update order status');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const handleMarkDelivered = async () => {
    try {
      const response = await orderService.updateOrderStatus(orderId, 'delivered');
      if (response.success) {
        Alert.alert('Success', 'Order marked as delivered!', [
          { text: 'OK', onPress: onClose },
        ]);
      } else {
        Alert.alert('Error', response.error || 'Failed to update order status');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const region = React.useMemo(() => {
    if (driverLocation && consumerLocation) {
      const midLat = (driverLocation.latitude + consumerLocation.latitude) / 2;
      const midLng = (driverLocation.longitude + consumerLocation.longitude) / 2;
      const latDelta = Math.max(Math.abs(driverLocation.latitude - consumerLocation.latitude) * 1.5, 0.01);
      const lngDelta = Math.max(Math.abs(driverLocation.longitude - consumerLocation.longitude) * 1.5, 0.01);
      return { latitude: midLat, longitude: midLng, latitudeDelta: latDelta, longitudeDelta: lngDelta };
    } else if (driverLocation) {
      return { latitude: driverLocation.latitude, longitude: driverLocation.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 };
    } else if (consumerLocation) {
      return { latitude: consumerLocation.latitude, longitude: consumerLocation.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 };
    }
    return { latitude: 6.5244, longitude: 3.3792, latitudeDelta: 0.1, longitudeDelta: 0.1 };
  }, [driverLocation, consumerLocation]);

  const orderStatus: string = order?.status ?? '';
  const isPickedUp = orderStatus === 'in_transit' || orderStatus === 'delivered';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {userRole === 'driver' ? 'Navigation' : 'Track Your Order'}
        </Text>
        <View style={[styles.statusBadge, isTracking && styles.activeStatus]}>
          <Text style={styles.statusText}>{isTracking ? 'Live' : 'Offline'}</Text>
        </View>
      </View>

      {/* Order Info */}
      <View style={styles.orderInfo}>
        <Text style={styles.orderId}>Order #{order?.order_number || orderId.slice(-8)}</Text>
        {estimatedTime ? (
          <Text style={styles.eta}>ETA: {estimatedTime}</Text>
        ) : null}
      </View>

      {/* Map */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        showsUserLocation={userRole === 'driver'}
      >
        {driverLocation && (
          <Marker
            coordinate={{ latitude: driverLocation.latitude, longitude: driverLocation.longitude }}
            title="Driver"
            pinColor="#ff4444"
          />
        )}
        {consumerLocation && userRole === 'driver' && (
          <Marker
            coordinate={{ latitude: consumerLocation.latitude, longitude: consumerLocation.longitude }}
            title="Delivery Location"
            pinColor="#28a745"
          />
        )}
      </MapView>

      {/* Actions */}
      <View style={styles.actions}>
        {userRole === 'driver' && (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowCommunicationModal(true)}
            >
              <Ionicons name="call" size={20} color="white" />
              <Text style={styles.actionText}>Contact Customer</Text>
            </TouchableOpacity>
            {!isPickedUp && (
              <TouchableOpacity
                style={[styles.actionButton, styles.pickupButton]}
                onPress={handleMarkPickedUp}
              >
                <Ionicons name="bag-check" size={20} color="white" />
                <Text style={styles.actionText}>Mark Picked Up</Text>
              </TouchableOpacity>
            )}
            {isPickedUp && (
              <TouchableOpacity
                style={[styles.actionButton, styles.completeButton]}
                onPress={handleMarkDelivered}
              >
                <Ionicons name="checkmark" size={20} color="white" />
                <Text style={styles.actionText}>Mark Delivered</Text>
              </TouchableOpacity>
            )}
          </>
        )}
        {userRole === 'consumer' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowCommunicationModal(true)}
          >
            <Ionicons name="chatbubble" size={20} color="white" />
            <Text style={styles.actionText}>Contact Driver</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Communication Modal */}
      <CommunicationModal
        visible={showCommunicationModal}
        onClose={() => setShowCommunicationModal(false)}
        contactName={userRole === 'driver' ? 'Customer' : 'Driver'}
        contactPhone={
          userRole === 'driver'
            ? order?.consumer?.phone_number ?? ''
            : order?.driver?.phone_number ?? ''
        }
        contactRole={userRole === 'driver' ? 'merchant' : 'driver'}
        orderId={orderId}
        onChatPress={() => router.push(`/chat/conv_${orderId}`)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: 50,
  },
  closeButton: { padding: 8 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#dc3545',
  },
  activeStatus: { backgroundColor: '#28a745' },
  statusText: { color: 'white', fontSize: 12, fontWeight: '600' },
  orderInfo: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: { fontSize: 16, fontWeight: '600', color: '#333' },
  eta: { fontSize: 14, color: '#007bff', fontWeight: '500' },
  map: { flex: 1 },
  actions: { flexDirection: 'row', padding: 16, gap: 8, flexWrap: 'wrap' },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    minWidth: 120,
  },
  pickupButton: { backgroundColor: '#fd7e14' },
  completeButton: { backgroundColor: '#28a745' },
  actionText: { color: 'white', fontSize: 14, fontWeight: '600' },
});
