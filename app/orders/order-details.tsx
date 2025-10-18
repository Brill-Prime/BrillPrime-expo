import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Modal,
  Platform,
  Clipboard
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import LiveOrderTracker from '../../components/LiveOrderTracker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAlert } from '../../components/AlertProvider';
import ReceiptSharingModal from '../../components/ReceiptSharingModal';

// Assuming orderService is imported and has methods like cancelOrder
// import orderService from '../../services/orderService'; // Placeholder for actual import

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  merchantName: string;
  merchantContact: string;
  items: OrderItem[];
  totalAmount: number;
  subtotal: number;
  deliveryFee: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled' | 'out_for_delivery';
  orderDate: string;
  estimatedDelivery?: string;
  deliveryAddress: string;
  paymentMethod: string;
  orderNotes?: string;
  location: string;
  quantity: string;
  itemType: string;
  timeTaken?: string;
  deliveryTime?: string;
  driverName?: string;
  date?: string; // Added for receipt generation
}

export default function OrderDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { showSuccess, showError, showWarning, showConfirmDialog, showInfo } = useAlert();
  const [order, setOrder] = useState<Order | null>(null);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  const [showLiveTracking, setShowLiveTracking] = useState(false);
  const [userRole, setUserRole] = useState<'consumer' | 'driver'>('consumer');
  const [showDriverCommunication, setShowDriverCommunication] = useState(false);
  const [showMerchantCommunication, setShowMerchantCommunication] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    loadOrderDetails();

    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    return () => subscription?.remove();
  }, [id]);

  useEffect(() => {
    // Load order details based on ID
    console.log('Loading order details for ID:', id);
    loadUserRole();
  }, [id]);

  const loadUserRole = async () => {
    const role = await AsyncStorage.getItem('userRole');
    if (role === 'driver' || role === 'consumer') {
      setUserRole(role);
    }
  };

  // Calculate responsive dimensions
  const isSmallScreen = screenDimensions.width < 400;
  const isMediumScreen = screenDimensions.width >= 400 && screenDimensions.width < 600;
  const responsivePadding = Math.max(20, screenDimensions.width * 0.05);
  const responsiveFontSize = {
    title: isSmallScreen ? 18 : 22,
    orderTitle: isSmallScreen ? 18 : 20,
    regular: isSmallScreen ? 14 : 15,
    small: isSmallScreen ? 12 : 13,
    price: isSmallScreen ? 16 : 18,
  };

  const loadOrderDetails = async () => {
    try {
      // Mock data - replace with actual API call
      const mockOrder: Order = {
        id: id as string,
        merchantName: 'Lagos Fuel Station',
        merchantContact: '+234 803 123 4567',
        items: [{ name: 'Petrol', quantity: 1, price: 30000 }],
        totalAmount: 30500,
        subtotal: 30000,
        deliveryFee: 500,
        status: id === '1002' ? 'cancelled' : id === '1004' ? 'pending' : 'delivered',
        orderDate: '2024-01-15T17:00:00',
        deliveryAddress: 'Rayfield, Jos',
        paymentMethod: 'Card Payment',
        location: 'Rayfield, Jos',
        quantity: '1 litre',
        itemType: 'petrol',
        timeTaken: '15 mins',
        deliveryTime: '05:00pm',
        driverName: 'Mike',
        date: 'January 15, 2024' // Added for receipt generation
      };
      // Simulate a status change for demonstration purposes
      if (id === '1001') { // Example ID for an order that is out for delivery
        mockOrder.status = 'out_for_delivery';
        mockOrder.driverName = 'John Doe';
      }
      setOrder(mockOrder);
    } catch (error) {
      console.error('Error loading order details:', error);
      Alert.alert('Error', 'Failed to load order details');
    }
  };

  const handleReportIssue = () => {
    router.push(`/orders/report-issue?orderId=${order?.id}`);
  };

  const handleShareReceipt = () => {
    setShowReceiptModal(true);
  };

  const handleModifyOrder = () => {
    if (order?.status === 'pending' || order?.status === 'confirmed') {
      Alert.alert(
        'Modify Order',
        'What would you like to modify?',
        [
          { text: 'Cancel Order', onPress: handleCancelOrder, style: 'destructive' },
          { text: 'Change Delivery Address', onPress: handleChangeAddress },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } else {
      Alert.alert('Cannot Modify', 'This order can no longer be modified');
    }
  };

  const handleCancelOrder = async () => {
    router.push(`/orders/cancel-order?orderId=${order?.id}&orderTotal=${order?.totalAmount}`);
  };

  const handleChangeAddress = () => {
    router.push(`/orders/change-address?orderId=${order?.id}`);
  };

  const handleContactDriver = (type: 'message' | 'call') => {
    setShowDriverCommunication(false);
    
    if (type === 'message') {
      // Navigate to chat with driver
      router.push(`/chat/driver-${order?.id}`);
    } else {
      // Initiate call
      Alert.alert(
        'Call Driver',
        `Call ${order?.driverName || 'the driver'}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Call',
            onPress: () => {
              showInfo('Calling', `Calling ${order?.driverName || 'driver'}...`);
              // Here you would implement actual call functionality
            }
          }
        ]
      );
    }
  };

  const handleContactMerchant = () => {
    setShowMerchantCommunication(false);
    // Navigate to chat with merchant
    router.push(`/chat/merchant-${order?.merchantName?.replace(/\s+/g, '-').toLowerCase()}`);
  };;


  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'delivered': return { bg: 'transparent', text: '#2ecc71', border: '#2ecc71' };
      case 'cancelled': return { bg: 'transparent', text: '#e74c3c', border: '#e74c3c' };
      case 'pending': return { bg: 'transparent', text: '#f39c12', border: '#f39c12' };
      case 'preparing': return { bg: 'transparent', text: '#f39c12', border: '#f39c12' };
      case 'confirmed': return { bg: 'transparent', text: '#3498db', border: '#3498db' };
      case 'out_for_delivery': return { bg: '#28a745', text: '#fff', border: '#28a745'};
      default: return { bg: 'transparent', text: '#95a5a6', border: '#95a5a6' };
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'delivered': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'pending': return 'Pending';
      case 'preparing': return 'Preparing';
      case 'confirmed': return 'Confirmed';
      case 'out_for_delivery': return 'Out for Delivery';
      default: return status;
    }
  };

  const getOrderSteps = () => {
    const steps = [
      { status: 'pending', title: 'Order Placed', time: formatDate(order.orderDate), completed: false, current: false },
      { status: 'confirmed', title: 'Order Confirmed', time: 'Pending...', completed: false, current: false },
      { status: 'preparing', title: 'Preparing Order', time: 'Pending...', completed: false, current: false },
      { status: 'ready', title: 'Ready for Pickup/Delivery', time: 'Pending...', completed: false, current: false },
      { status: 'delivered', time: order.deliveryTime || 'Pending...', completed: false, current: false }
    ];

    const statusOrder = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];
    const currentIndex = statusOrder.indexOf(order.status);

    if (order.status === 'cancelled') {
      return [{
        status: 'cancelled',
        title: 'Order Cancelled',
        time: formatDate(order.orderDate),
        completed: false,
        current: true
      }];
    }

    return steps.map((step, index) => ({
      ...step,
      completed: index < currentIndex,
      current: index === currentIndex,
      time: index === 0 ? formatDate(order.orderDate) : 
            index === currentIndex ? 'In Progress...' :
            index < currentIndex ? 'Completed' : 'Pending...'
    }));
  };

  const getItemIcon = (itemType: string) => {
    switch (itemType) {
      case 'petrol':
      case 'diesel':
        return '⛽';
      case 'food':
        return '🍽️';
      case 'groceries':
        return '🛒';
      default:
        return '📦';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };

    const day = date.getDate();
    const suffix = day === 1 || day === 21 || day === 31 ? 'st' :
                  day === 2 || day === 22 ? 'nd' :
                  day === 3 || day === 23 ? 'rd' : 'th';

    return date.toLocaleDateString('en-US', options).replace(/\d+/, `${day}${suffix}`);
  };

  if (!order) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading order details...</Text>
      </View>
    );
  }

  const statusColors = getStatusColor(order.status);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: responsivePadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={isSmallScreen ? 20 : 24} color="#1b1b1b" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: responsiveFontSize.title }]}>Order History Detail</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Detail Section */}
        <View style={[styles.orderDetail, { paddingHorizontal: responsivePadding }]}>
          <View style={[styles.itemIcon, { 
            width: isSmallScreen ? 60 : 80, 
            height: isSmallScreen ? 60 : 80 
          }]}>
            <Text style={[styles.itemIconText, { fontSize: isSmallScreen ? 30 : 40 }]}>
              {getItemIcon(order.itemType)}
            </Text>
          </View>
          <Text style={[styles.orderTitle, { fontSize: responsiveFontSize.orderTitle }]}>
            {order.items[0].name}
          </Text>
          <View style={styles.orderQtyBadge}>
            <Text style={[styles.orderQtyText, { fontSize: responsiveFontSize.small }]}>
              {order.quantity}
            </Text>
          </View>
          <Text style={[styles.orderPrice, { fontSize: responsiveFontSize.price }]}>
            ₦{order.totalAmount.toLocaleString()}.00
          </Text>
        </View>

        {/* Details Section */}
        <View style={[styles.details, { paddingHorizontal: responsivePadding }]}>
          <View style={styles.locationContainer}>
            <Text style={[styles.locationIcon, { fontSize: responsiveFontSize.regular }]}>📍</Text>
            <Text style={[styles.locationText, { fontSize: responsiveFontSize.regular }]}>
              {order.location}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { fontSize: responsiveFontSize.regular }]}>Time taken</Text>
            <Text style={[styles.detailValue, { fontSize: responsiveFontSize.regular }]}>
              {order.timeTaken || 'N/A'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { fontSize: responsiveFontSize.regular }]}>Date</Text>
            <Text style={[styles.detailValue, { fontSize: responsiveFontSize.regular }]}>
              {formatDate(order.orderDate)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { fontSize: responsiveFontSize.regular }]}>Time of Delivery</Text>
            <Text style={[styles.detailValue, { fontSize: responsiveFontSize.regular }]}>
              {order.deliveryTime || 'N/A'}
            </Text>
          </View>
        </View>

        {/* Purchase Summary */}
        <View style={[styles.summary, { 
          marginHorizontal: responsivePadding,
          padding: isSmallScreen ? 15 : 20 
        }]}>
          <Text style={[styles.summaryTitle, { fontSize: isSmallScreen ? 16 : 18 }]}>
            Purchase Summary
          </Text>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { fontSize: responsiveFontSize.regular }]}>Subtotal</Text>
            <Text style={[styles.summaryValue, { fontSize: responsiveFontSize.regular }]}>
              ₦{order.subtotal.toLocaleString()}.00
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { fontSize: responsiveFontSize.regular }]}>Delivery fee</Text>
            <Text style={[styles.summaryValue, { fontSize: responsiveFontSize.regular }]}>
              ₦{order.deliveryFee.toLocaleString()}.00
            </Text>
          </View>

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={[styles.totalLabel, { fontSize: responsiveFontSize.regular }]}>Total</Text>
            <Text style={[styles.totalValue, { fontSize: responsiveFontSize.regular }]}>
              ₦{order.totalAmount.toLocaleString()}.00
            </Text>
          </View>
        </View>

        {/* Contact Merchant */}
        <View style={[styles.contactDriver, { 
          marginHorizontal: responsivePadding,
          padding: isSmallScreen ? 10 : 12,
          marginBottom: 15
        }]}>
          <View style={styles.driverInfo}>
            <Text style={[styles.contactText, { fontSize: responsiveFontSize.small }]}>
              Contact merchant
            </Text>
            <View style={[styles.driverAvatar, { 
              width: isSmallScreen ? 25 : 30, 
              height: isSmallScreen ? 25 : 30,
              borderRadius: isSmallScreen ? 12.5 : 15,
              backgroundColor: '#667eea'
            }]}>
              <Text style={[styles.driverAvatarText, { fontSize: responsiveFontSize.small }]}>
                {order.merchantName?.charAt(0) || 'M'}
              </Text>
            </View>
            <Text style={[styles.driverName, { fontSize: responsiveFontSize.small }]}>
              {order.merchantName || 'Merchant'}
            </Text>
          </View>
          <View style={styles.driverActions}>
            <TouchableOpacity onPress={() => setShowMerchantCommunication(true)}>
              <Text style={[styles.actionIcon, { fontSize: isSmallScreen ? 16 : 18 }]}>💬</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowMerchantCommunication(true)}>
              <Text style={[styles.actionIcon, { fontSize: isSmallScreen ? 16 : 18 }]}>📞</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Contact Driver */}
        <View style={[styles.contactDriver, { 
          marginHorizontal: responsivePadding,
          padding: isSmallScreen ? 10 : 12 
        }]}>
          <View style={styles.driverInfo}>
            <Text style={[styles.contactText, { fontSize: responsiveFontSize.small }]}>
              Contact driver
            </Text>
            <View style={[styles.driverAvatar, { 
              width: isSmallScreen ? 25 : 30, 
              height: isSmallScreen ? 25 : 30,
              borderRadius: isSmallScreen ? 12.5 : 15 
            }]}>
              <Text style={[styles.driverAvatarText, { fontSize: responsiveFontSize.small }]}>
                {order.driverName?.charAt(0) || 'M'}
              </Text>
            </View>
            <Text style={[styles.driverName, { fontSize: responsiveFontSize.small }]}>
              {order.driverName || 'Mike'}
            </Text>
          </View>
          <View style={styles.driverActions}>
            <TouchableOpacity onPress={() => setShowDriverCommunication(true)}>
              <Text style={[styles.actionIcon, { fontSize: isSmallScreen ? 16 : 18 }]}>💬</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowDriverCommunication(true)}>
              <Text style={[styles.actionIcon, { fontSize: isSmallScreen ? 16 : 18 }]}>📞</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Status Timeline */}
        <View style={[styles.timelineSection, { paddingHorizontal: responsivePadding }]}>
          <Text style={[styles.sectionTitle, { fontSize: isSmallScreen ? 16 : 18 }]}>
            Order Status
          </Text>
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
                      color={step.completed ? "#fff" : step.current ? "#2f75c2" : "#ccc"} 
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
                    { fontSize: responsiveFontSize.regular },
                    step.current && styles.currentStepTitle
                  ]}>
                    {step.title}
                  </Text>
                  <Text style={[
                    styles.timelineTime,
                    { fontSize: responsiveFontSize.small }
                  ]}>
                    {step.time}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={[styles.actions, { 
          paddingHorizontal: responsivePadding,
          flexDirection: 'column',
          gap: 15
        }]}>
          {/* Primary Actions Row */}
          {(order.status === 'pending' || order.status === 'confirmed') && (
            <View style={styles.primaryActions}>
              <TouchableOpacity 
                style={[styles.modifyButton, { flex: 1, marginRight: 10 }]} 
                onPress={handleModifyOrder}
              >
                <Ionicons name="create-outline" size={18} color="#2f75c2" />
                <Text style={styles.modifyButtonText}>Modify Order</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.cancelButton, { flex: 1 }]} 
                onPress={handleCancelOrder}
              >
                <Ionicons name="close-circle-outline" size={18} color="#e74c3c" />
                <Text style={styles.cancelButtonText}>Cancel Order</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Secondary Actions Row */}
          <View style={[styles.secondaryActions, {
            flexDirection: isSmallScreen ? 'column' : 'row',
            gap: isSmallScreen ? 15 : 20
          }]}>
            <TouchableOpacity style={[styles.reportButton, { 
              flex: isSmallScreen ? 0 : 1,
              paddingVertical: isSmallScreen ? 10 : 12 
            }]} onPress={handleReportIssue}>
              <Ionicons name="alert-circle-outline" size={18} color="#e74c3c" />
              <Text style={[styles.reportButtonText, { fontSize: isSmallScreen ? 14 : 16, marginLeft: 8 }]}>
                Report Issue
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.shareButton, { 
              flex: isSmallScreen ? 0 : 1,
              paddingVertical: isSmallScreen ? 10 : 12 
            }]} onPress={handleShareReceipt}>
              <Ionicons name="share-outline" size={18} color="white" />
              <Text style={[styles.shareButtonText, { fontSize: isSmallScreen ? 14 : 16, marginLeft: 8 }]}>
                Share Receipt
              </Text>
            </TouchableOpacity>
          </View>

          {order.status === 'out_for_delivery' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.trackButton]}
              onPress={() => setShowLiveTracking(true)}
            >
              <Ionicons name="location-outline" size={20} color="white" />
              <Text style={styles.actionButtonText}>Live Tracking</Text>
            </TouchableOpacity>
          )}

          {(order.status !== 'delivered' && order.status !== 'cancelled') && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setShowDriverCommunication(true)}
            >
              <Ionicons name="chatbubble-outline" size={20} color="white" />
              <Text style={styles.actionButtonText}>Contact Driver</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Live Tracking Modal */}
      <Modal
        visible={showLiveTracking}
        animationType="slide"
        onRequestClose={() => setShowLiveTracking(false)}
      >
        <LiveOrderTracker
          orderId={id as string}
          userRole={userRole}
          onClose={() => setShowLiveTracking(false)}
        />
      </Modal>

      {/* Driver Communication Modal */}
      <Modal
        visible={showDriverCommunication}
        animationType="slide"
        onRequestClose={() => setShowDriverCommunication(false)}
      >
        <View style={styles.communicationModalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDriverCommunication(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Contact Driver</Text>
            <View />
          </View>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalButton} onPress={() => handleContactDriver('message')}>
              <Ionicons name="chatbubble-outline" size={24} color="#fff" />
              <Text style={styles.modalButtonText}>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={() => handleContactDriver('call')}>
              <Ionicons name="call-outline" size={24} color="#fff" />
              <Text style={styles.modalButtonText}>Call</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Merchant Communication Modal */}
      <Modal
        visible={showMerchantCommunication}
        animationType="slide"
        onRequestClose={() => setShowMerchantCommunication(false)}
      >
        <View style={styles.communicationModalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowMerchantCommunication(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Contact Merchant</Text>
            <View />
          </View>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalButton} onPress={handleContactMerchant}>
              <Ionicons name="chatbubble-outline" size={24} color="#fff" />
              <Text style={styles.modalButtonText}>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={() => Alert.alert('Call Merchant', 'Calling merchant...')}>
              <Ionicons name="call-outline" size={24} color="#fff" />
              <Text style={styles.modalButtonText}>Call</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Receipt Sharing Modal */}
      {order && (
        <ReceiptSharingModal
          visible={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          receiptData={{
            orderId: order.id,
            date: order.date || formatDate(order.orderDate),
            status: getStatusText(order.status),
            merchantName: order.merchantName,
            items: order.items,
            subtotal: order.subtotal,
            deliveryFee: order.deliveryFee,
            totalAmount: order.totalAmount,
            deliveryAddress: order.deliveryAddress,
            paymentMethod: order.paymentMethod,
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 15,
    backgroundColor: '#fff',
    minHeight: 80,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#1b1b1b',
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  orderDetail: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  itemIcon: {
    backgroundColor: '#2f75c2',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemIconText: {
    // fontSize handled dynamically
  },
  orderTitle: {
    fontWeight: 'bold',
    color: '#1b1b1b',
    marginBottom: 5,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  orderQtyBadge: {
    borderWidth: 1,
    borderColor: '#2f75c2',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 10,
  },
  orderQtyText: {
    fontSize: 13,
    color: '#2f75c2',
  },
  orderPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1b1b1b',
    marginTop: 5,
  },
  details: {
    marginTop: 20,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  locationText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1b1b1b',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  detailLabel: {
    fontSize: 15,
    color: '#1b1b1b',
  },
  detailValue: {
    fontSize: 15,
    color: '#1b1b1b',
  },
  summary: {
    marginTop: 25,
    marginBottom: 25,
    backgroundColor: '#2f75c2',
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#fff',
  },
  summaryValue: {
    fontSize: 15,
    color: '#fff',
  },
  totalRow: {
    marginTop: 5,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  totalValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  contactDriver: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    padding: 12,
    marginBottom: 20,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 14,
    color: '#1b1b1b',
    marginRight: 8,
  },
  driverAvatar: {
    width: 30,
    height: 30,
    backgroundColor: '#2f75c2',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  driverAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  driverName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1b1b1b',
  },
  driverActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionIcon: {
    fontSize: 18,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusBadge: {
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  actions: {
    paddingBottom: 30,
  },
  primaryActions: {
    flexDirection: 'row',
  },
  secondaryActions: {
    // Styles handled inline
  },
  modifyButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#2f75c2',
    borderRadius: 25,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modifyButtonText: {
    color: '#2f75c2',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#e74c3c',
    borderRadius: 25,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelButtonText: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: 'bold',
  },
  reportButton: {
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#e74c3c',
    borderRadius: 25,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  reportButtonText: {
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  shareButton: {
    backgroundColor: '#0b1437',
    borderRadius: 25,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  shareButtonText: {
    fontWeight: 'bold',
    color: '#fff',
  },
  timelineSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 10,
    borderRadius: 12,
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
    borderColor: '#2f75c2',
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
    color: '#1b1b1b',
    marginBottom: 2,
  },
  currentStepTitle: {
    color: '#2f75c2',
  },
  timelineTime: {
    fontSize: 12,
    color: '#666',
  },
  actionButton: {
    backgroundColor: '#0b1437',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  trackButton: {
    backgroundColor: '#28a745',
  },
  communicationModalContainer: {
    flex: 1,
    backgroundColor: '#0b1437',
    paddingTop: 50,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2e3a59',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  modalButton: {
    backgroundColor: '#2f75c2',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    width: '70%',
    justifyContent: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});