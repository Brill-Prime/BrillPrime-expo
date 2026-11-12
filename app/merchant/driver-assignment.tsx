import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAlert } from '../../components/AlertProvider';
import { merchantOrderService } from '../../services/merchantOrderService';

interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicleType: string;
  rating: number;
  completedDeliveries: number;
  status: 'available' | 'busy' | 'offline';
}

interface Order {
  id: string;
  customerName: string;
  items: string[];
  totalAmount: number;
  deliveryAddress: string;
  status: string;
}

const getVehicleIcon = (vehicleType: string): keyof typeof Ionicons.glyphMap => {
  const type = vehicleType.toLowerCase();
  if (type.includes('bike') || type.includes('motorcycle')) return 'bicycle';
  if (type.includes('car') || type.includes('sedan')) return 'car-sport';
  if (type.includes('van') || type.includes('suv')) return 'car';
  if (type.includes('truck')) return 'bus';
  return 'bicycle'; // default fallback
};

export default function DriverAssignment() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams();
  const { showSuccess, showError, showConfirmDialog } = useAlert();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [showDriverDetails, setShowDriverDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    loadOrderAndDrivers();
  }, [orderId]);

  const loadOrderAndDrivers = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      if (typeof orderId !== 'string' || !orderId) {
        setLoadError('An order ID is required to assign a driver.');
        return;
      }

      const [orderResult, driversResult] = await Promise.all([
        merchantOrderService.getOrderDetails(orderId),
        merchantOrderService.getAvailableDrivers(),
      ]);
      if (!orderResult.success || !orderResult.order) {
        setLoadError(orderResult.error || 'Failed to load order details');
        return;
      }
      if (!driversResult.success || !driversResult.drivers) {
        setLoadError(driversResult.error || 'Failed to load available drivers');
        return;
      }

      const fetchedOrder = orderResult.order;
      setOrder({
        id: fetchedOrder.id,
        customerName: [fetchedOrder.consumer?.first_name, fetchedOrder.consumer?.last_name].filter(Boolean).join(' ') || 'Customer name unavailable',
        items: (fetchedOrder.items || []).map(item => `${item.product?.name || 'Product'} - ${item.quantity} ${item.product?.unit || ''}`.trim()),
        totalAmount: Number(fetchedOrder.total_amount) || 0,
        deliveryAddress: fetchedOrder.delivery_address || 'Delivery address unavailable',
        status: fetchedOrder.status,
      });
      setDrivers(driversResult.drivers);
    } catch (error) {
      console.error('Error loading order and available drivers:', error);
      setLoadError('Unable to load order and driver data. Retry to try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    setIsAutoAssigning(true);
    try {
      const availableDrivers = drivers.filter(d => d.status === 'available');
      if (availableDrivers.length === 0) {
        showError('No Drivers Available', 'There are no available drivers at the moment');
        return;
      }

      const bestDriver = availableDrivers.reduce((best, current) => {
        if (current.rating !== best.rating) return current.rating > best.rating ? current : best;
        return current.completedDeliveries > best.completedDeliveries ? current : best;
      });
      await assignDriver(bestDriver);
    } catch (error) {
      showError('Error', 'Auto-assignment failed');
    } finally {
      setIsAutoAssigning(false);
    }
  };

  const assignDriver = async (driver: Driver) => {
    if (typeof orderId !== 'string' || !orderId) return;
    const result = await merchantOrderService.assignDriver(orderId, driver.id);
    if (!result.success) {
      showError('Error', result.error || 'Failed to assign driver');
      return;
    }

    setSelectedDriver(driver);
    showSuccess('Success', `${driver.name} has been assigned to this order`);
    router.back();
  };

  const handleManualAssign = (driver: Driver) => {
    showConfirmDialog(
      'Assign Driver',
      `Assign ${driver.name} to this delivery?`,
      () => void assignDriver(driver)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#28a745';
      case 'busy': return '#ffc107';
      case 'offline': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const isSmallScreen = screenData.width < 400;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4682B4" />
        <Text style={styles.loadingText}>Loading drivers...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#0B1A51', '#1e3a8a']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assign Driver</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Order Summary */}
        {order && (
          <View style={styles.orderSummary}>
            <Text style={styles.orderSummaryTitle}>Order #{order.id}</Text>
            <Text style={styles.orderCustomer}>{order.customerName}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="location" size={16} color="#fff" />
              <Text style={[styles.orderAddress, { marginLeft: 5 }]}>{order.deliveryAddress}</Text>
            </View>
            <Text style={styles.orderAmount}>₦{order.totalAmount.toLocaleString()}</Text>
          </View>
        )}

        {loadError ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{loadError}</Text>
            <TouchableOpacity onPress={loadOrderAndDrivers}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
        <>
        {/* Auto-Assign Button */}
          <TouchableOpacity
          style={[styles.autoAssignButton, isAutoAssigning && styles.autoAssignButtonDisabled]}
          onPress={handleAutoAssign}
          disabled={isAutoAssigning}
        >
          {isAutoAssigning ? (
            <>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.autoAssignText}>Finding Best Driver...</Text>
            </>
          ) : (
            <>
              <Ionicons name="flash" size={20} color="white" />
              <Text style={styles.autoAssignText}>Assign Highest-Rated Driver</Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.autoAssignHint}>
          Selects the available driver with the highest rating; delivery count breaks ties.
        </Text>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR SELECT MANUALLY</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Available Drivers List */}
        <Text style={styles.sectionTitle}>Available Drivers ({drivers.filter(d => d.status === 'available').length})</Text>

        <ScrollView style={styles.driversList} showsVerticalScrollIndicator={false}>
          {drivers.length === 0 ? (
            <Text style={styles.emptyStateText}>No verified drivers are currently available.</Text>
          ) : drivers.map((driver) => (
            <TouchableOpacity
              key={driver.id}
              style={[
                styles.driverCard,
                selectedDriver?.id === driver.id && styles.selectedDriverCard,
              ]}
              onPress={() => {
                setSelectedDriver(driver);
                setShowDriverDetails(true);
              }}
            >
              <View style={styles.driverInfo}>
                <View style={styles.driverAvatar}>
                  <Ionicons name="person" size={24} color="#4682B4" />
                </View>
                <View style={styles.driverDetails}>
                  <Text style={styles.driverName}>{driver.name}</Text>
                  <View style={styles.driverMeta}>
                    <Ionicons name="star" size={14} color="#ffc107" />
                    <Text style={styles.driverRating}>{driver.rating}</Text>
                  </View>
                  <View style={styles.metricsRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="cube" size={14} color="#4682B4" />
                      <Text style={[styles.metricText, { marginLeft: 3 }]}>{driver.completedDeliveries} deliveries</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name={getVehicleIcon(driver.vehicleType)} size={14} color="#666" />
                    <Text style={[styles.driverVehicle, { marginLeft: 3 }]}>{driver.vehicleType}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.driverRight}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(driver.status) }]}>
                  <Text style={styles.statusText}>{driver.status}</Text>
                </View>
                {driver.status === 'available' && (
                  <TouchableOpacity
                    style={styles.assignButton}
                    onPress={() => handleManualAssign(driver)}
                  >
                    <Text style={styles.assignButtonText}>Assign</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </>
      )}
      </View>

      {/* Driver Details Modal */}
      <Modal
        visible={showDriverDetails}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDriverDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedDriver && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Driver Details</Text>
                  <TouchableOpacity onPress={() => setShowDriverDetails(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <View style={styles.driverAvatarLarge}>
                    <Ionicons name="person" size={48} color="#4682B4" />
                  </View>

                  <Text style={styles.modalDriverName}>{selectedDriver.name}</Text>

                  <View style={styles.modalStats}>
                    <View style={styles.modalStatItem}>
                      <Text style={styles.modalStatValue}>{selectedDriver.rating}</Text>
                      <Text style={styles.modalStatLabel}>Rating</Text>
                    </View>
                    <View style={styles.modalStatItem}>
                      <Text style={styles.modalStatValue}>{selectedDriver.completedDeliveries}</Text>
                      <Text style={styles.modalStatLabel}>Deliveries</Text>
                    </View>
                  </View>

                  <View style={styles.modalInfo}>
                    <View style={styles.modalInfoRow}>
                      <Ionicons name="call" size={20} color="#666" />
                      <Text style={styles.modalInfoText}>{selectedDriver.phone}</Text>
                    </View>
                    <View style={styles.modalInfoRow}>
                      <Ionicons name="car" size={20} color="#666" />
                      <Text style={styles.modalInfoText}>{selectedDriver.vehicleType}</Text>
                    </View>
                  </View>

                  {selectedDriver.status === 'available' && (
                    <TouchableOpacity
                      style={styles.modalAssignButton}
                      onPress={() => {
                        setShowDriverDetails(false);
                        handleManualAssign(selectedDriver);
                      }}
                    >
                      <Text style={styles.modalAssignButtonText}>Assign to Order</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyStateText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 8,
  },
  retryText: {
    color: '#4682B4',
    fontWeight: '700',
    marginTop: 8,
  },
  orderSummary: {
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 16,
    marginBottom: 20,
  },
  orderSummaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  orderCustomer: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  orderAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4682B4',
  },
  autoAssignButton: {
    backgroundColor: '#4682B4',
    borderRadius: 25,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
    boxShadow: '0px 4px 8px rgba(70, 130, 180, 0.3)',
    elevation: 5,
  },
  autoAssignButtonDisabled: {
    opacity: 0.7,
  },
  autoAssignText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  autoAssignHint: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: -12,
    marginBottom: 12,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    fontSize: 12,
    color: '#999',
    paddingHorizontal: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  driversList: {
    flex: 1,
  },
  driverCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  selectedDriverCard: {
    borderColor: '#4682B4',
    borderWidth: 2,
  },
  driverInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  driverMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  driverRating: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  driverDeliveries: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  driverVehicle: {
    fontSize: 14,
    color: '#666',
  },
  driverRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  driverDistance: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  driverEta: {
    fontSize: 12,
    color: '#666',
  },
  assignButton: {
    backgroundColor: '#4682B4',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 15,
    marginTop: 4,
  },
  assignButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  modalBody: {
    padding: 20,
    alignItems: 'center',
  },
  driverAvatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalDriverName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  modalStatItem: {
    alignItems: 'center',
  },
  modalStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4682B4',
  },
  modalStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  modalInfo: {
    width: '100%',
    marginBottom: 20,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalInfoText: {
    fontSize: 16,
    color: '#2c3e50',
    marginLeft: 12,
  },
  modalAssignButton: {
    backgroundColor: '#4682B4',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    width: '100%',
  },
  modalAssignButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Styles added for performance metrics
  completionRate: {
    fontSize: 11,
    color: '#999',
    marginLeft: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  metricText: {
    fontSize: 11,
    color: '#666',
  },
});