
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import MapView, { PROVIDER_GOOGLE, Marker } from './Map';
import CommunicationModal from './CommunicationModal';
import { locationService } from '../services/locationService';
import { orderService } from '../services/orderService';
import { calculateETA } from '../utils/googleMaps';

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
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);

  // Driver navigation state
  const [pickupCoords, setPickupCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [deliveryCoords, setDeliveryCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [navETA, setNavETA] = useState<string>('');
  const [navDistance, setNavDistance] = useState<string>('');
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  const router = useRouter();
  const cleanupRef = useRef<Array<() => void>>([]);
  const etaTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup all subscriptions on unmount
  useEffect(() => {
    return () => {
      cleanupRef.current.forEach(fn => fn());
      cleanupRef.current = [];
      locationService.stopLiveTracking();
      if (etaTimerRef.current) clearInterval(etaTimerRef.current);
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

  // Subscribe to driver's real-time location when driver ID is known (consumer view)
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

  // Track driver's own GPS for route calculation
  useEffect(() => {
    if (userRole !== 'driver') return;

    const unsubscribe = locationService.onLocationUpdate((loc: any) => {
      setDriverLocation({
        latitude: loc.latitude ?? loc.coords?.latitude,
        longitude: loc.longitude ?? loc.coords?.longitude,
      });
    });

    // Also get initial position immediately
    locationService.getCurrentLocation().then((loc) => {
      if (loc?.coords) {
        setDriverLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      }
    });

    if (unsubscribe) cleanupRef.current.push(unsubscribe);
  }, [userRole]);

  const loadOrderDetails = async (active = true) => {
    const response = await orderService.trackOrder(orderId);
    if (!active) return;
    if (response.success && response.data) {
      const ord = response.data.order;
      setOrder(ord);

      // Extract pickup (merchant) and delivery coordinates
      if (ord?.merchant?.latitude && ord?.merchant?.longitude) {
        setPickupCoords({
          latitude: Number(ord.merchant.latitude),
          longitude: Number(ord.merchant.longitude),
        });
      }
      if (ord?.delivery_latitude && ord?.delivery_longitude) {
        setDeliveryCoords({
          latitude: Number(ord.delivery_latitude),
          longitude: Number(ord.delivery_longitude),
        });
      }

      if (response.data.tracking.driverInfo?.location) {
        setDriverLocation(response.data.tracking.driverInfo.location);
      }
    }
  };

  // Which coordinate is the driver currently heading toward
  const navTarget = useMemo(() => {
    if (userRole !== 'driver') return null;
    if (!order) return null;
    // After pickup → head to customer delivery address
    if (order.status === 'in_transit') return deliveryCoords;
    // Before pickup → head to merchant
    return pickupCoords;
  }, [userRole, order?.status, pickupCoords, deliveryCoords]);

  const navAddress = useMemo(() => {
    if (!order) return '';
    if (order.status === 'in_transit') return order.delivery_address || 'Delivery location';
    return order.merchant?.address || order.merchant?.name || 'Pickup location';
  }, [order?.status, order?.delivery_address, order?.merchant]);

  // Recalculate ETA via Google Maps API (web) or haversine (native)
  const recalculateETA = useCallback(async (
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number },
  ) => {
    setIsCalculatingRoute(true);
    try {
      const result = await calculateETA(from, to);
      setNavETA(result.duration);
      setNavDistance(result.distance);
    } catch {
      // Haversine fallback
      const distKm = locationService.calculateDistance(
        from.latitude, from.longitude,
        to.latitude, to.longitude,
      );
      const mins = Math.round((distKm / 30) * 60); // assume 30 km/h average
      setNavETA(mins > 0 ? `~${mins} min` : 'Arriving soon');
      setNavDistance(`${distKm.toFixed(1)} km`);
    } finally {
      setIsCalculatingRoute(false);
    }
  }, []);

  // Update ETA whenever driver location or navigation target changes
  useEffect(() => {
    if (!driverLocation || !navTarget) return;
    recalculateETA(driverLocation, navTarget);

    // Refresh every 30 s while the driver is moving
    if (etaTimerRef.current) clearInterval(etaTimerRef.current);
    etaTimerRef.current = setInterval(() => {
      if (driverLocation && navTarget) recalculateETA(driverLocation, navTarget);
    }, 30_000);

    return () => {
      if (etaTimerRef.current) clearInterval(etaTimerRef.current);
    };
  }, [driverLocation, navTarget]);

  // Consumer-side ETA: rough estimate from driver to consumer location
  useEffect(() => {
    if (userRole !== 'consumer') return;
    if (!driverLocation || !consumerLocation) return;
    const dist = locationService.calculateDistance(
      driverLocation.latitude, driverLocation.longitude,
      consumerLocation.latitude, consumerLocation.longitude,
    );
    const mins = Math.round((dist / 30) * 60);
    setNavETA(mins > 0 ? `${mins} min` : 'Arriving soon');
  }, [driverLocation, consumerLocation, userRole]);

  // ── Navigation deep-links ───────────────────────────────────────────────
  const openInGoogleMaps = useCallback(() => {
    if (!navTarget) return;
    const { latitude, longitude } = navTarget;
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
    const iosNative = `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`;

    if (Platform.OS === 'ios') {
      Linking.canOpenURL(iosNative).then((supported) => {
        Linking.openURL(supported ? iosNative : webUrl);
      });
    } else {
      Linking.openURL(webUrl);
    }
  }, [navTarget]);

  const openInWaze = useCallback(() => {
    if (!navTarget) return;
    const { latitude, longitude } = navTarget;
    Linking.openURL(`https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`);
  }, [navTarget]);

  // ── Status actions ──────────────────────────────────────────────────────
  const handleMarkPickedUp = async () => {
    try {
      const response = await orderService.updateOrderStatus(orderId, 'in_transit');
      if (response.success) {
        Alert.alert('Success', 'Order marked as picked up — delivery in progress!');
        setOrder((prev: any) => ({ ...prev, status: 'in_transit' }));
      } else {
        Alert.alert('Error', response.error || 'Failed to update order status');
      }
    } catch {
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
    } catch {
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  // ── Map region ─────────────────────────────────────────────────────────
  const region = useMemo(() => {
    const points: { latitude: number; longitude: number }[] = [];
    if (driverLocation) points.push(driverLocation);
    if (userRole === 'driver' && navTarget) {
      points.push(navTarget);
    } else if (userRole === 'consumer' && consumerLocation) {
      points.push(consumerLocation);
    }

    if (points.length === 2) {
      const midLat = (points[0].latitude + points[1].latitude) / 2;
      const midLng = (points[0].longitude + points[1].longitude) / 2;
      const latDelta = Math.max(Math.abs(points[0].latitude - points[1].latitude) * 1.6, 0.01);
      const lngDelta = Math.max(Math.abs(points[0].longitude - points[1].longitude) * 1.6, 0.01);
      return { latitude: midLat, longitude: midLng, latitudeDelta: latDelta, longitudeDelta: lngDelta };
    } else if (points.length === 1) {
      return { latitude: points[0].latitude, longitude: points[0].longitude, latitudeDelta: 0.012, longitudeDelta: 0.012 };
    }
    return { latitude: 6.5244, longitude: 3.3792, latitudeDelta: 0.1, longitudeDelta: 0.1 };
  }, [driverLocation, consumerLocation, navTarget, userRole]);

  const orderStatus: string = order?.status ?? '';
  const isPickedUp = orderStatus === 'in_transit' || orderStatus === 'delivered';
  const showDriverRoute = userRole === 'driver' && !!driverLocation && !!navTarget;

  // ── Render ─────────────────────────────────────────────────────────────
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

      {/* Order Info strip */}
      <View style={styles.orderInfo}>
        <Text style={styles.orderId}>Order #{order?.order_number || orderId.slice(-8)}</Text>
        {navETA ? (
          <View style={styles.etaBadge}>
            <Ionicons name="time-outline" size={14} color="#007bff" />
            <Text style={styles.eta}>{navETA}</Text>
          </View>
        ) : null}
      </View>

      {/* Map */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        showsUserLocation={userRole === 'driver'}
        // Route drawing — supported by Map.web.tsx and passed through on native
        showRoute={showDriverRoute}
        origin={showDriverRoute ? driverLocation! : undefined}
        destination={showDriverRoute ? navTarget! : undefined}
      >
        {/* Driver marker */}
        {driverLocation && (
          <Marker
            coordinate={{ latitude: driverLocation.latitude, longitude: driverLocation.longitude }}
            title="Driver"
            pinColor="#4682B4"
          />
        )}

        {/* Consumer / delivery marker */}
        {consumerLocation && userRole === 'driver' && (
          <Marker
            coordinate={{ latitude: consumerLocation.latitude, longitude: consumerLocation.longitude }}
            title="Delivery Location"
            pinColor="#28a745"
          />
        )}

        {/* Pickup marker — shown for driver before pickup */}
        {userRole === 'driver' && pickupCoords && !isPickedUp && (
          <Marker
            coordinate={pickupCoords}
            title={`Pickup: ${order?.merchant?.name ?? 'Merchant'}`}
            pinColor="#fd7e14"
          />
        )}

        {/* Delivery marker — always visible for driver so they can see the endpoint */}
        {userRole === 'driver' && deliveryCoords && (
          <Marker
            coordinate={deliveryCoords}
            title="Delivery destination"
            pinColor="#28a745"
          />
        )}
      </MapView>

      {/* Driver Navigation Panel */}
      {userRole === 'driver' && navTarget && (
        <View style={styles.navPanel}>
          <View style={styles.navPanelTop}>
            <View style={styles.navDestinationInfo}>
              <View style={styles.navLabelRow}>
                <Ionicons
                  name={isPickedUp ? 'home' : 'storefront'}
                  size={16}
                  color={isPickedUp ? '#28a745' : '#fd7e14'}
                />
                <Text style={styles.navLabel}>
                  {isPickedUp ? 'Delivering to' : 'Heading to pickup'}
                </Text>
              </View>
              <Text style={styles.navAddress} numberOfLines={2}>{navAddress}</Text>
              <View style={styles.navStats}>
                {isCalculatingRoute ? (
                  <ActivityIndicator size="small" color="#4682B4" />
                ) : (
                  <>
                    {navETA ? (
                      <View style={styles.navStatChip}>
                        <Ionicons name="time-outline" size={13} color="#4682B4" />
                        <Text style={styles.navStatText}>{navETA}</Text>
                      </View>
                    ) : null}
                    {navDistance ? (
                      <View style={styles.navStatChip}>
                        <Ionicons name="navigate-outline" size={13} color="#4682B4" />
                        <Text style={styles.navStatText}>{navDistance}</Text>
                      </View>
                    ) : null}
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Open in external maps */}
          <View style={styles.navButtons}>
            <TouchableOpacity style={styles.navBtn} onPress={openInGoogleMaps} activeOpacity={0.8}>
              <Ionicons name="navigate-circle" size={18} color="#fff" />
              <Text style={styles.navBtnText}>Google Maps</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navBtn, styles.wazeBtnStyle]} onPress={openInWaze} activeOpacity={0.8}>
              <Ionicons name="car" size={18} color="#fff" />
              <Text style={styles.navBtnText}>Waze</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Action buttons */}
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

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: 50,
    backgroundColor: '#fff',
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

  // ── Order Info strip ────────────────────────────────────────────────────
  orderInfo: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  orderId: { fontSize: 15, fontWeight: '600', color: '#333' },
  etaBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eta: { fontSize: 14, color: '#007bff', fontWeight: '600' },

  // ── Map ─────────────────────────────────────────────────────────────────
  map: { flex: 1 },

  // ── Navigation Panel ────────────────────────────────────────────────────
  navPanel: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  navPanelTop: {
    marginBottom: 10,
  },
  navDestinationInfo: { gap: 4 },
  navLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  navLabel: { fontSize: 12, color: '#666', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  navAddress: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', lineHeight: 20 },
  navStats: { flexDirection: 'row', gap: 10, marginTop: 4 },
  navStatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  navStatText: { fontSize: 12, color: '#4682B4', fontWeight: '600' },
  navButtons: { flexDirection: 'row', gap: 10 },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  wazeBtnStyle: { backgroundColor: '#05C8F7' },
  navBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // ── Action buttons ───────────────────────────────────────────────────────
  actions: { flexDirection: 'row', padding: 12, gap: 8, flexWrap: 'wrap', backgroundColor: '#fff' },
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
