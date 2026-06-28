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
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAlert } from '../../components/AlertProvider';

interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicleType: string;
  rating: number;
  completedDeliveries: number;
  currentLocation: {
    latitude: number;
    longitude: number;
  };
  distance: string;
  eta: string;
  status: 'available' | 'busy' | 'offline';
  earnings: number;
  completionRate?: number; // Added for performance metrics
  avgDeliveryTime?: number; // Added for performance metrics
  totalDeliveries?: number; // Added for performance metrics
  available?: boolean; // Assuming 'available' status can be represented by this boolean for simplicity in the change snippet
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
      // Mock data - replace with actual API call
      const mockOrder: Order = {
        id: orderId as string,
        customerName: 'John Doe',
        items: ['Premium Petrol - 50L', 'Engine Oil - 2 Bottles'],
        totalAmount: 49500,
        deliveryAddress: 'Victoria Island, Lagos',
        status: 'pending',
      };

      const mockDrivers: Driver[] = [
        {
          id: 'DRV001',
          name: 'Michael Johnson',
          phone: '+2348012345678',
          vehicleType: 'Motorcycle',
          rating: 4.8,
          completedDeliveries: 245,
          currentLocation: { latitude: 6.4281, longitude: 3.4219 },
          distance: '0.8 km',
          eta: '5 mins',
          status: 'available',
          earnings: 125000,
          completionRate: 95, // Added performance metrics
          avgDeliveryTime: 15, // Added performance metrics
          totalDeliveries: 245, // Added performance metrics
          available: true, // Added for change snippet compatibility
        },
        {
          id: 'DRV002',
          name: 'Sarah Williams',
          phone: '+2348098765432',
          vehicleType: 'Van',
          rating: 4.9,
          completedDeliveries: 312,
          currentLocation: { latitude: 6.4281, longitude: 3.4219 },
          distance: '1.2 km',
          eta: '8 mins',
          status: 'available',
          earnings: 185000,
          completionRate: 98, // Added performance metrics
          avgDeliveryTime: 18, // Added performance metrics
          totalDeliveries: 312, // Added performance metrics
          available: true, // Added for change snippet compatibility
        },
        {
          id: 'DRV003',
          name: 'David Brown',
          phone: '+2347012345678',
          vehicleType: 'Car',
          rating: 4.6,
          completedDeliveries: 189,
          currentLocation: { latitude: 6.4281, longitude: 3.4219 },
          distance: '2.5 km',
          eta: '12 mins',
          status: 'available',
          earnings: 98000,
          completionRate: 92, // Added performance metrics
          avgDeliveryTime: 20, // Added performance metrics
          totalDeliveries: 189, // Added performance metrics
          available: true, // Added for change snippet compatibility
        },
      ];

      setOrder(mockOrder);
      setDrivers(mockDrivers);
    } catch (error) {
      showError('Error', 'Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    setIsAutoAssigning(true);
    try {
      // Simulate auto-assignment logic - finds best driver based on distance, rating, and availability
      await new Promise(resolve => setTimeout(resolve, 2000));

      const availableDrivers = drivers.filter(d => d.status === 'available');
      if (availableDrivers.length === 0) {
        showError('No Drivers Available', 'There are no available drivers at the moment');
        setIsAutoAssigning(false);
        return;
      }

      // Auto-select best driver (closest with good rating)
      const bestDriver = availableDrivers.reduce((best, current) => {
        const currentDistance = parseFloat(current.distance);
        const bestDistance = parseFloat(best.distance);
        if (currentDistance < bestDistance && current.rating >= 4.5) {
          return current;
        }
        return best;
      });

      setSelectedDriver(bestDriver);
      showSuccess('Driver Found', `${bestDriver.name} has been automatically assigned to this order`);

      // Save assignment
      await AsyncStorage.setItem(`order_${orderId}_driver`, JSON.stringify(bestDriver));

      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      showError('Error', 'Auto-assignment failed');
    } finally {
      setIsAutoAssigning(false);
    }
  };

  const handleManualAssign = (driver: Driver) => {
    showConfirmDialog(
      'Assign Driver',
      `Assign ${driver.name} to this delivery?`,
      async () => {
        try {
          setSelectedDriver(driver);
          await AsyncStorage.setItem(`order_${orderId}_driver`, JSON.stringify(driver));
          showSuccess('Success', `${driver.name} has been assigned to this order`);
          setTimeout(() => {
            router.back();
          }, 1500);
        } catch (error) {
          showError('Error', 'Failed to assign driver');
        }
      }
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
              <Text style={styles.autoAssignText}>Auto-Assign Driver</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR SELECT MANUALLY</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Available Drivers List */}
        <Text style={styles.sectionTitle}>Available Drivers ({drivers.filter(d => d.status === 'available').length})</Text>

        <ScrollView style={styles.driversList} showsVerticalScrollIndicator={false}>
          {drivers.map((driver) => (
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
                    {driver.completionRate !== undefined && ( // Conditional rendering for completionRate
                      <Text style={styles.completionRate}>• {driver.completionRate}% completed</Text>
                    )}
                  </View>
                  <View style={styles.metricsRow}>
                    {driver.avgDeliveryTime !== undefined && ( // Conditional rendering for avgDeliveryTime
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="flash" size={14} color="#ffc107" />
                        <Text style={[styles.metricText, { marginLeft: 3 }]}>Avg: {driver.avgDeliveryTime} min</Text>
                      </View>
                    )}
                    {driver.totalDeliveries !== undefined && ( // Conditional rendering for totalDeliveries
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                        <Ionicons name="cube" size={14} color="#4682B4" />
                        <Text style={[styles.metricText, { marginLeft: 3 }]}>{driver.totalDeliveries} deliveries</Text>
                      </View>
                    )}
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
                <Text style={styles.driverDistance}>{driver.distance}</Text>
                <Text style={styles.driverEta}>ETA: {driver.eta}</Text>
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
                    <View style={styles.modalStatItem}>
                      <Text style={styles.modalStatValue}>{selectedDriver.distance}</Text>
                      <Text style={styles.modalStatLabel}>Distance</Text>
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
                    <View style={styles.modalInfoRow}>
                      <Ionicons name="time" size={20} color="#666" />
                      <Text style={styles.modalInfoText}>ETA: {selectedDriver.eta}</Text>
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
    shadowColor: '#4682B4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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