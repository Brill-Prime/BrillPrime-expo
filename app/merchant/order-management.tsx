import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { merchantOrderService, Order, OrderStats } from '../../services/merchantOrderService';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { useAlert } from '../../components/AlertProvider';

export default function OrderManagementScreen() {
  const router = useRouter();
  const { showSuccess, showError } = useAlert();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showDriverAssignment, setShowDriverAssignment] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const fetchOrders = async () => {
    try {
      const statusFilter = selectedFilter === 'all' ? undefined : selectedFilter;
      const result = await merchantOrderService.getOrders(statusFilter);

      if (result.success && result.orders) {
        setOrders(result.orders);
      } else {
        // Check if error is network-related
        const isNetworkError = result.error?.toLowerCase().includes('network') || 
                              result.error?.toLowerCase().includes('connection');
        
        if (isNetworkError) {
          showError('Connection Error', 'Please check your internet connection and try again');
        } else {
          showError('Error', result.error || 'Failed to load orders');
        }
      }
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      
      // Handle network errors gracefully
      const errorMessage = error?.message || 'An error occurred while loading orders';
      const isNetworkError = errorMessage.toLowerCase().includes('network') || 
                            errorMessage.toLowerCase().includes('fetch');
      
      showError(
        isNetworkError ? 'Connection Error' : 'Error',
        isNetworkError ? 'Unable to connect. Please check your connection.' : errorMessage
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    const result = await merchantOrderService.getOrderStats();
    if (result.success && result.stats) {
      setStats(result.stats);
    }
  };

  const fetchDrivers = async () => {
    const result = await merchantOrderService.getAvailableDrivers();
    if (result.success && result.drivers) {
      setAvailableDrivers(result.drivers);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchStats();

    // Subscribe to real-time updates
    let subscription: { unsubscribe: () => void } | null = null;

    const setupRealtime = async () => {
      const merchantResult = await merchantOrderService.getMerchantId();
      if (merchantResult.success && merchantResult.merchantId) {
        subscription = merchantOrderService.subscribeToOrders(
          merchantResult.merchantId,
          (payload) => {
            console.log('Order update received:', payload);
            // Refresh orders when changes occur
            fetchOrders();
            fetchStats();
          }
        );
      }
    };

    setupRealtime();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [selectedFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
    fetchStats();
  }, [selectedFilter]);

  const handleOrderPress = async (order: Order) => {
    setLoading(true);
    const result = await merchantOrderService.getOrderDetails(order.id);
    setLoading(false);

    if (result.success && result.order) {
      setSelectedOrder(result.order);
      setShowOrderDetails(true);
    } else {
      showError('Error', result.error || 'Failed to load order details');
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    const result = await merchantOrderService.acceptOrder(orderId);
    if (result.success) {
      showSuccess('Success', 'Order accepted successfully');
      setShowOrderDetails(false);
      fetchOrders();
      fetchStats();
    } else {
      showError('Error', result.error || 'Failed to accept order');
    }
  };

  const handleRejectOrder = async () => {
    if (!selectedOrder || !rejectReason.trim()) {
      showError('Error', 'Please provide a reason for rejection');
      return;
    }

    const result = await merchantOrderService.rejectOrder(selectedOrder.id, rejectReason);
    if (result.success) {
      showSuccess('Success', 'Order rejected');
      setShowRejectModal(false);
      setShowOrderDetails(false);
      setRejectReason('');
      fetchOrders();
      fetchStats();
    } else {
      showError('Error', result.error || 'Failed to reject order');
    }
  };

  const handleStartPreparing = async (orderId: string) => {
    const result = await merchantOrderService.startPreparing(orderId);
    if (result.success) {
      showSuccess('Success', 'Order marked as preparing');
      setShowOrderDetails(false);
      fetchOrders();
      fetchStats();
    } else {
      showError('Error', result.error || 'Failed to update order');
    }
  };

  const handleMarkAsReady = async (orderId: string) => {
    const result = await merchantOrderService.markAsReady(orderId);
    if (result.success) {
      showSuccess('Success', 'Order marked as ready for pickup');
      setShowOrderDetails(false);
      fetchOrders();
      fetchStats();
    } else {
      showError('Error', result.error || 'Failed to update order');
    }
  };

  const handleAssignDriver = async (driverId: string) => {
    if (!selectedOrder) return;

    const result = await merchantOrderService.assignDriver(selectedOrder.id, driverId);
    if (result.success) {
      showSuccess('Success', 'Driver assigned successfully');
      setShowDriverAssignment(false);
      setShowOrderDetails(false);
      fetchOrders();
    } else {
      showError('Error', result.error || 'Failed to assign driver');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: '#FFA500',
      accepted: '#4CAF50',
      preparing: '#2196F3',
      ready: '#9C27B0',
      in_transit: '#FF9800',
      delivered: '#4CAF50',
      cancelled: '#F44336',
      rejected: '#F44336',
    };
    return colors[status] || '#999';
  };

  const getStatusIcon = (status: string) => {
    const icons: { [key: string]: any } = {
      pending: 'time-outline',
      accepted: 'checkmark-circle-outline',
      preparing: 'restaurant-outline',
      ready: 'cube-outline',
      in_transit: 'car-outline',
      delivered: 'checkmark-done-outline',
      cancelled: 'close-circle-outline',
      rejected: 'close-circle-outline',
    };
    return icons[status] || 'help-circle-outline';
  };

  const renderOrderCard = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => handleOrderPress(item)}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>#{item.order_number}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Ionicons name={getStatusIcon(item.status)} size={14} color="#FFF" />
          <Text style={styles.statusText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.orderInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color="#666" />
          <Text style={styles.infoText}>
            {item.consumer?.first_name} {item.consumer?.last_name}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.infoText} numberOfLines={1}>
            {item.delivery_address}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="cash-outline" size={16} color="#666" />
          <Text style={styles.amountText}>₦{item.total_amount.toLocaleString()}</Text>
        </View>
        <Text style={styles.timeText}>
          {new Date(item.created_at).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const filterButtons = [
    { key: 'all', label: 'All', count: orders.length },
    { key: 'pending', label: 'Pending', count: stats?.pending || 0 },
    { key: 'accepted', label: 'Accepted', count: stats?.accepted || 0 },
    { key: 'preparing', label: 'Preparing', count: stats?.preparing || 0 },
    { key: 'ready', label: 'Ready', count: stats?.ready || 0 },
    { key: 'in_transit', label: 'In Transit', count: stats?.in_transit || 0 },
  ];

  if (loading && !refreshing) {
    return <LoadingIndicator message="Loading orders..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Management</Text>
        <View style={styles.placeholder} />
      </View>

      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.delivered_today}</Text>
            <Text style={styles.statLabel}>Delivered Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₦{stats.total_revenue_today.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Revenue Today</Text>
          </View>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {filterButtons.map(button => (
          <TouchableOpacity
            key={button.key}
            style={[
              styles.filterButton,
              selectedFilter === button.key && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter(button.key)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedFilter === button.key && styles.filterButtonTextActive,
              ]}
            >
              {button.label} ({button.count})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={orders}
        renderItem={renderOrderCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={80} color="#CCC" />
            <Text style={styles.emptyText}>No orders found</Text>
          </View>
        }
      />

      {/* Order Details Modal */}
      <Modal
        visible={showOrderDetails}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowOrderDetails(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Details</Text>
              <TouchableOpacity onPress={() => setShowOrderDetails(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView style={styles.modalBody}>
                <Text style={styles.sectionTitle}>Order #{selectedOrder.order_number}</Text>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Customer</Text>
                  <Text style={styles.detailValue}>
                    {selectedOrder.consumer?.first_name} {selectedOrder.consumer?.last_name}
                  </Text>
                  {selectedOrder.consumer?.phone_number && (
                    <Text style={styles.detailValue}>{selectedOrder.consumer.phone_number}</Text>
                  )}
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Delivery Address</Text>
                  <Text style={styles.detailValue}>{selectedOrder.delivery_address}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Order Items</Text>
                  {selectedOrder.items?.map(item => (
                    <View key={item.id} style={styles.orderItem}>
                      <Text style={styles.itemName}>
                        {item.product?.name} × {item.quantity}
                      </Text>
                      <Text style={styles.itemPrice}>₦{item.total_price.toLocaleString()}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.detailSection}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Delivery Fee</Text>
                    <Text style={styles.totalValue}>₦{selectedOrder.delivery_fee.toLocaleString()}</Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabelBold}>Total</Text>
                    <Text style={styles.totalValueBold}>₦{selectedOrder.total_amount.toLocaleString()}</Text>
                  </View>
                </View>

                {selectedOrder.status === 'pending' && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.acceptButton]}
                      onPress={() => handleAcceptOrder(selectedOrder.id)}
                    >
                      <Text style={styles.actionButtonText}>Accept Order</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => setShowRejectModal(true)}
                    >
                      <Text style={styles.actionButtonText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {selectedOrder.status === 'accepted' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.primaryButton]}
                    onPress={() => handleStartPreparing(selectedOrder.id)}
                  >
                    <Text style={styles.actionButtonText}>Start Preparing</Text>
                  </TouchableOpacity>
                )}

                {selectedOrder.status === 'preparing' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.primaryButton]}
                    onPress={() => handleMarkAsReady(selectedOrder.id)}
                  >
                    <Text style={styles.actionButtonText}>Mark as Ready</Text>
                  </TouchableOpacity>
                )}

                {selectedOrder.status === 'ready' && !selectedOrder.driver_id && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.primaryButton]}
                    onPress={() => {
                      fetchDrivers();
                      setShowDriverAssignment(true);
                    }}
                  >
                    <Text style={styles.actionButtonText}>Assign Driver</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Reject Order Modal */}
      <Modal
        visible={showRejectModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.smallModalContent}>
            <Text style={styles.modalTitle}>Reject Order</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Reason for rejection..."
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={4}
            />
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
              >
                <Text style={styles.actionButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={handleRejectOrder}
              >
                <Text style={styles.actionButtonText}>Reject Order</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Driver Assignment Modal */}
      <Modal
        visible={showDriverAssignment}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDriverAssignment(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Driver</Text>
              <TouchableOpacity onPress={() => setShowDriverAssignment(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {availableDrivers.map(driver => (
                <TouchableOpacity
                  key={driver.id}
                  style={styles.driverCard}
                  onPress={() => handleAssignDriver(driver.id)}
                >
                  <View>
                    <Text style={styles.driverName}>
                      {driver.user.first_name} {driver.user.last_name}
                    </Text>
                    <Text style={styles.driverInfo}>{driver.vehicle_type}</Text>
                    <Text style={styles.driverInfo}>{driver.vehicle_number}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#0066CC" />
                </TouchableOpacity>
              ))}
              {availableDrivers.length === 0 && (
                <Text style={styles.noDriversText}>No available drivers</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  filterContainer: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#0066CC',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#FFF',
  },
  listContainer: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  orderInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  timeText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  smallModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    margin: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066CC',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 14,
    color: '#333',
  },
  totalLabelBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValueBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#0066CC',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  cancelButton: {
    backgroundColor: '#999',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    marginVertical: 16,
  },
  driverCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  driverInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  noDriversText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
});