
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAlert } from '../../components/AlertProvider';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  unit: string;
}

interface MerchantOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderDate: string;
  deliveryAddress: string;
  deliveryType: 'pickup' | 'delivery';
  estimatedTime: string;
  completedAt?: string;
  notes?: string;
  priority: 'low' | 'medium' | 'high';
  assignedDriver?: string;
}

export default function OrderManagement() {
  const router = useRouter();
  const { showSuccess, showError, showConfirmDialog } = useAlert();
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  const [orders, setOrders] = useState<MerchantOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<MerchantOrder[]>([]);
  const [selectedTab, setSelectedTab] = useState<'pending' | 'active' | 'completed' | 'all'>('pending');
  const [selectedOrder, setSelectedOrder] = useState<MerchantOrder | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadOrders();
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, selectedTab, searchQuery]);

  const loadOrders = async () => {
    try {
      const savedOrders = await AsyncStorage.getItem('merchantOrders');
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      } else {
        // Sample data
        const sampleOrders: MerchantOrder[] = [
          {
            id: 'ORD001',
            customerName: 'John Doe',
            customerPhone: '+2348012345678',
            customerEmail: 'john@example.com',
            items: [
              { id: '1', name: 'Premium Petrol', quantity: 50, price: 650, unit: 'Litres' },
              { id: '2', name: 'Engine Oil', quantity: 2, price: 8500, unit: 'Bottles' }
            ],
            totalAmount: 49500,
            status: 'pending',
            paymentStatus: 'paid',
            orderDate: new Date().toISOString(),
            deliveryAddress: 'Victoria Island, Lagos',
            deliveryType: 'delivery',
            estimatedTime: '30 minutes',
            priority: 'high'
          },
          {
            id: 'ORD002',
            customerName: 'Jane Smith',
            customerPhone: '+2348098765432',
            customerEmail: 'jane@example.com',
            items: [
              { id: '3', name: 'Diesel', quantity: 30, price: 580, unit: 'Litres' }
            ],
            totalAmount: 17400,
            status: 'preparing',
            paymentStatus: 'paid',
            orderDate: new Date(Date.now() - 1800000).toISOString(),
            deliveryAddress: 'Ikeja, Lagos',
            deliveryType: 'pickup',
            estimatedTime: '15 minutes',
            priority: 'medium'
          }
        ];
        setOrders(sampleOrders);
        await AsyncStorage.setItem('merchantOrders', JSON.stringify(sampleOrders));
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      showError('Error', 'Failed to load orders');
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Tab filter
    switch (selectedTab) {
      case 'pending':
        filtered = filtered.filter(order => order.status === 'pending');
        break;
      case 'active':
        filtered = filtered.filter(order => 
          ['confirmed', 'preparing', 'ready'].includes(order.status)
        );
        break;
      case 'completed':
        filtered = filtered.filter(order => 
          ['completed', 'cancelled'].includes(order.status)
        );
        break;
      default:
        // Show all orders
        break;
    }

    // Sort by priority and date
    filtered.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
    });

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId: string, newStatus: MerchantOrder['status'], completionTime?: string) => {
    try {
      const updatedOrders = orders.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            status: newStatus,
            completedAt: newStatus === 'completed' ? new Date().toISOString() : order.completedAt,
            estimatedTime: completionTime || order.estimatedTime,
            notes: orderNotes || order.notes
          };
        }
        return order;
      });

      setOrders(updatedOrders);
      await AsyncStorage.setItem('merchantOrders', JSON.stringify(updatedOrders));
      showSuccess('Success', `Order ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      showError('Error', 'Failed to update order status');
    }
  };

  const handleConfirmOrder = (order: MerchantOrder) => {
    Alert.prompt(
      'Confirm Order',
      'Enter estimated preparation time:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: (time) => {
            updateOrderStatus(order.id, 'confirmed', time || '30 minutes');
          }
        }
      ],
      'plain-text',
      '30 minutes'
    );
  };

  const handleRejectOrder = (order: MerchantOrder) => {
    showConfirmDialog(
      'Reject Order',
      'Are you sure you want to reject this order? This action cannot be undone.',
      () => {
        updateOrderStatus(order.id, 'cancelled');
      }
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ffc107';
      case 'confirmed': return '#17a2b8';
      case 'preparing': return '#fd7e14';
      case 'ready': return '#28a745';
      case 'completed': return '#6f42c1';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#dc3545';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const formatOrderTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getTabCount = (tab: string) => {
    switch (tab) {
      case 'pending':
        return orders.filter(order => order.status === 'pending').length;
      case 'active':
        return orders.filter(order => 
          ['confirmed', 'preparing', 'ready'].includes(order.status)
        ).length;
      case 'completed':
        return orders.filter(order => 
          ['completed', 'cancelled'].includes(order.status)
        ).length;
      default:
        return orders.length;
    }
  };

  const renderOrderCard = (order: MerchantOrder) => (
    <TouchableOpacity
      key={order.id}
      style={styles.orderCard}
      onPress={() => {
        setSelectedOrder(order);
        setShowOrderModal(true);
      }}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderIdContainer}>
          <Text style={styles.orderId}>#{order.id}</Text>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(order.priority) }]}>
            <Text style={styles.priorityText}>{order.priority.toUpperCase()}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{order.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>{order.customerName}</Text>
        <Text style={styles.customerContact}>{order.customerPhone}</Text>
      </View>

      <View style={styles.orderDetails}>
        <Text style={styles.itemsText}>
          {order.items.length} item(s) • ₦{order.totalAmount.toLocaleString()}
        </Text>
        <Text style={styles.deliveryType}>
          {order.deliveryType.charAt(0).toUpperCase() + order.deliveryType.slice(1)}
        </Text>
        <Text style={styles.orderTime}>{formatOrderTime(order.orderDate)}</Text>
      </View>

      {order.status === 'pending' && (
        <View style={styles.pendingActions}>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={() => handleRejectOrder(order)}
          >
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={() => handleConfirmOrder(order)}
          >
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      )}

      {['confirmed', 'preparing', 'ready'].includes(order.status) && (
        <View style={styles.activeActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setSelectedOrder(order);
              setShowStatusModal(true);
            }}
          >
            <Text style={styles.actionButtonText}>Update Status</Text>
          </TouchableOpacity>
          
          {!order.assignedDriver && (
            <TouchableOpacity
              style={[styles.actionButton, styles.assignDriverButton]}
              onPress={() => router.push(`/merchant/driver-assignment?orderId=${order.id}`)}
            >
              <Ionicons name="car" size={16} color="white" />
              <Text style={styles.actionButtonText}>Assign Driver</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#1C1B1F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Management</Text>
        <TouchableOpacity onPress={() => router.push('/merchant/analytics')}>
          <Ionicons name="analytics" size={24} color="#1C1B1F" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search orders..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {[
          { key: 'pending', label: 'Pending' },
          { key: 'active', label: 'Active' },
          { key: 'completed', label: 'Completed' },
          { key: 'all', label: 'All' }
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              selectedTab === tab.key && styles.activeTab
            ]}
            onPress={() => setSelectedTab(tab.key as any)}
          >
            <Text style={[
              styles.tabText,
              selectedTab === tab.key && styles.activeTabText
            ]}>
              {tab.label}
            </Text>
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{getTabCount(tab.key)}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders List */}
      <ScrollView
        style={styles.ordersList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No orders found</Text>
          </View>
        ) : (
          filteredOrders.map(renderOrderCard)
        )}
      </ScrollView>

      {/* Order Details Modal */}
      <Modal
        visible={showOrderModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowOrderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedOrder && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Order Details</Text>
                  <TouchableOpacity onPress={() => setShowOrderModal(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  <Text style={styles.modalOrderId}>#{selectedOrder.id}</Text>
                  
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Customer Information</Text>
                    <Text style={styles.modalText}>Name: {selectedOrder.customerName}</Text>
                    <Text style={styles.modalText}>Phone: {selectedOrder.customerPhone}</Text>
                    <Text style={styles.modalText}>Email: {selectedOrder.customerEmail}</Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Order Items</Text>
                    {selectedOrder.items.map(item => (
                      <View key={item.id} style={styles.itemRow}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemQuantity}>
                          {item.quantity} {item.unit} × ₦{item.price.toLocaleString()}
                        </Text>
                      </View>
                    ))}
                    <View style={styles.totalRow}>
                      <Text style={styles.totalText}>
                        Total: ₦{selectedOrder.totalAmount.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Delivery Information</Text>
                    <Text style={styles.modalText}>Type: {selectedOrder.deliveryType}</Text>
                    <Text style={styles.modalText}>Address: {selectedOrder.deliveryAddress}</Text>
                    <Text style={styles.modalText}>Estimated Time: {selectedOrder.estimatedTime}</Text>
                  </View>

                  {selectedOrder.notes && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Notes</Text>
                      <Text style={styles.modalText}>{selectedOrder.notes}</Text>
                    </View>
                  )}
                </ScrollView>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalActionButton}
                    onPress={() => {
                      // Call customer
                      Alert.alert('Call Customer', `Call ${selectedOrder.customerName}?`);
                    }}
                  >
                    <Ionicons name="call" size={20} color="#007bff" />
                    <Text style={styles.modalActionText}>Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalActionButton}
                    onPress={() => {
                      // Message customer
                      router.push(`/chat/merchant_${selectedOrder.id}`);
                    }}
                  >
                    <Ionicons name="chatbubble" size={20} color="#28a745" />
                    <Text style={styles.modalActionText}>Message</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Status Update Modal */}
      <Modal
        visible={showStatusModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.statusModalContent}>
            <Text style={styles.modalTitle}>Update Order Status</Text>
            {selectedOrder && (
              <>
                <Text style={styles.modalSubtitle}>#{selectedOrder.id}</Text>
                
                <View style={styles.statusButtons}>
                  {selectedOrder.status === 'confirmed' && (
                    <TouchableOpacity
                      style={[styles.statusButton, { backgroundColor: '#fd7e14' }]}
                      onPress={() => {
                        updateOrderStatus(selectedOrder.id, 'preparing');
                        setShowStatusModal(false);
                      }}
                    >
                      <Text style={styles.statusButtonText}>Start Preparing</Text>
                    </TouchableOpacity>
                  )}
                  
                  {selectedOrder.status === 'preparing' && (
                    <TouchableOpacity
                      style={[styles.statusButton, { backgroundColor: '#28a745' }]}
                      onPress={() => {
                        updateOrderStatus(selectedOrder.id, 'ready');
                        setShowStatusModal(false);
                      }}
                    >
                      <Text style={styles.statusButtonText}>Mark as Ready</Text>
                    </TouchableOpacity>
                  )}
                  
                  {selectedOrder.status === 'ready' && (
                    <TouchableOpacity
                      style={[styles.statusButton, { backgroundColor: '#6f42c1' }]}
                      onPress={() => {
                        updateOrderStatus(selectedOrder.id, 'completed');
                        setShowStatusModal(false);
                      }}
                    >
                      <Text style={styles.statusButtonText}>Mark as Completed</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TextInput
                  style={styles.notesInput}
                  placeholder="Add notes (optional)"
                  value={orderNotes}
                  onChangeText={setOrderNotes}
                  multiline
                />

                <TouchableOpacity
                  style={styles.cancelStatusButton}
                  onPress={() => setShowStatusModal(false)}
                >
                  <Text style={styles.cancelStatusText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 10,
    fontSize: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#4682B4',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginRight: 5,
  },
  activeTabText: {
    color: '#4682B4',
  },
  tabBadge: {
    backgroundColor: '#e9ecef',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  ordersList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
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
    marginBottom: 10,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  customerInfo: {
    marginBottom: 10,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  customerContact: {
    fontSize: 12,
    color: '#666',
  },
  orderDetails: {
    marginBottom: 10,
  },
  itemsText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  deliveryType: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  orderTime: {
    fontSize: 12,
    color: '#666',
  },
  pendingActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  rejectButton: {
    flex: 1,
    paddingVertical: 8,
    marginRight: 5,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 8,
    marginLeft: 5,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#4682B4',
  },
  rejectButtonText: {
    fontSize: 14,
    color: '#dc3545',
    fontWeight: '600',
  },
  confirmButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  activeActions: {
    marginTop: 10,
  },
  actionButton: {
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#4682B4',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  assignDriverButton: {
    marginTop: 8,
    backgroundColor: '#28a745',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
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
    color: '#333',
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  modalOrderId: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4682B4',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
    marginTop: 10,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  modalActionText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '600',
  },
  statusModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  statusButtons: {
    marginBottom: 20,
  },
  statusButton: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 10,
  },
  statusButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    height: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  cancelStatusButton: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  cancelStatusText: {
    fontSize: 16,
    color: '#666',
  },
});
