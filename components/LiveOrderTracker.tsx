
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import MapView, { PROVIDER_GOOGLE } from './Map';
import CommunicationModal from './CommunicationModal';
import { locationService } from '../services/locationService';
import { orderService } from '../services/orderService';
import { Order } from '../services/types';

interface LiveOrderTrackerProps {
  orderId: string;
  userRole: 'consumer' | 'driver';
  onClose: () => void;
}

export default function LiveOrderTracker({ orderId, userRole, onClose }: LiveOrderTrackerProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [driverLocation, setDriverLocation] = useState<any>(null);
  const [consumerLocation, setConsumerLocation] = useState<any>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState<string>('');
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadOrderDetails();
    startTracking();

    return () => {
      stopTracking();
    };
  }, [orderId]);

  const loadOrderDetails = async () => {
    const response = await orderService.trackOrder(orderId);
    if (response.success && response.data) {
      setOrder(response.data.order);
      if (response.data.tracking.driverInfo?.location) {
        setDriverLocation(response.data.tracking.driverInfo.location);
      }
    }
  };

  const startTracking = async () => {
    if (userRole === 'driver') {
      // Driver shares their location
      await locationService.startLiveTracking(3000); // Update every 3 seconds
      setIsTracking(true);
    } else {
      // Consumer tracks driver location
      setIsTracking(true);
      trackDriverLocation();
    }
  };

  const stopTracking = () => {
    locationService.stopLiveTracking();
    setIsTracking(false);
  };

  const trackDriverLocation = () => {
    // Subscribe to real-time location updates
    const unsubscribe = locationService.onLocationUpdate((location) => {
      if (order?.driverId) {
        setDriverLocation(location);
        calculateETA(location);
      }
    });

    // Also poll every 5 seconds as fallback
    const interval = setInterval(async () => {
      if (order?.driverId) {
        const response = await locationService.getLiveLocation(order.driverId);
        if (response.success && response.data) {
          setDriverLocation(response.data);
          calculateETA(response.data);
        }
      }
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  };

  const calculateETA = (driverLoc: any) => {
    if (consumerLocation && driverLoc) {
      const distance = locationService.calculateDistance(
        driverLoc.latitude,
        driverLoc.longitude,
        consumerLocation.latitude,
        consumerLocation.longitude
      );
      
      // Assume average speed of 30 km/h in urban areas
      const estimatedMinutes = Math.round((distance / 30) * 60);
      setEstimatedTime(`${estimatedMinutes} minutes`);
    }
  };

  const getCurrentLocation = async () => {
    const location = await locationService.getCurrentLocation();
    if (location) {
      setConsumerLocation(location);
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const region = React.useMemo(() => {
    if (driverLocation && consumerLocation) {
      const midLat = (driverLocation.latitude + consumerLocation.latitude) / 2;
      const midLng = (driverLocation.longitude + consumerLocation.longitude) / 2;
      const latDelta = Math.abs(driverLocation.latitude - consumerLocation.latitude) * 1.5;
      const lngDelta = Math.abs(driverLocation.longitude - consumerLocation.longitude) * 1.5;
      
      return {
        latitude: midLat,
        longitude: midLng,
        latitudeDelta: Math.max(latDelta, 0.01),
        longitudeDelta: Math.max(lngDelta, 0.01),
      };
    } else if (driverLocation) {
      return {
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    } else if (consumerLocation) {
      return {
        latitude: consumerLocation.latitude,
        longitude: consumerLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    return {
      latitude: 6.5244,
      longitude: 3.3792,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };
  }, [driverLocation, consumerLocation]);

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
          <Text style={styles.statusText}>
            {isTracking ? 'Live' : 'Offline'}
          </Text>
        </View>
      </View>

      {/* Order Info */}
      <View style={styles.orderInfo}>
        <Text style={styles.orderId}>Order #{order?.id?.slice(-8) || orderId.slice(-8)}</Text>
        {estimatedTime && (
          <Text style={styles.eta}>ETA: {estimatedTime}</Text>
        )}
      </View>

      {/* Map */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        showsUserLocation={userRole === 'driver'}
        enableLiveTracking={userRole === 'consumer'}
        trackingUserId={userRole === 'consumer' ? order?.driverId : undefined}
        onLiveLocationUpdate={(location) => {
          if (userRole === 'consumer') {
            setDriverLocation(location);
          }
        }}
      >
        {/* Driver Marker */}
        {driverLocation && (
          <MapView.Marker
            coordinate={{
              latitude: driverLocation.latitude,
              longitude: driverLocation.longitude,
            }}
            title="Driver"
            pinColor="#ff4444"
          />
        )}

        {/* Consumer Marker */}
        {consumerLocation && userRole === 'driver' && (
          <MapView.Marker
            coordinate={{
              latitude: consumerLocation.latitude,
              longitude: consumerLocation.longitude,
            }}
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
            <TouchableOpacity 
              style={[styles.actionButton, styles.completeButton]}
              onPress={async () => {
                try {
                  const { orderService } = await import('../services/orderService');
                  const response = await orderService.updateOrderStatus(orderId, 'delivered');
                  if (response.success) {
                    Alert.alert('Success', 'Order marked as delivered', [
                      { text: 'OK', onPress: onClose }
                    ]);
                  } else {
                    Alert.alert('Error', response.error || 'Failed to update order status');
                  }
                } catch (error) {
                  console.error('Error marking as delivered:', error);
                  Alert.alert('Error', 'Failed to update order status');
                }
              }}
            >
              <Ionicons name="checkmark" size={20} color="white" />
              <Text style={styles.actionText}>Mark Delivered</Text>
            </TouchableOpacity>
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
        contactPhone="+234-801-234-5678"
        contactRole={userRole === 'driver' ? 'merchant' : 'driver'}
        orderId={orderId}
        onChatPress={() => router.push(`/chat/conv_${orderId}`)}
      />
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: 50,
  },
  closeButton: {
    padding: 8,
  },
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
  activeStatus: {
    backgroundColor: '#28a745',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  orderInfo: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  eta: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '500',
  },
  map: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  completeButton: {
    backgroundColor: '#28a745',
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
