
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DriverOrder {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  deliveryAddress: string;
  items: string[];
  totalAmount: number;
  distance: string;
  estimatedDuration: string;
  status: 'available' | 'accepted' | 'picked_up' | 'delivered' | 'cancelled';
  timestamp: string;
  earnings: number;
}

export default function DriverOrders() {
  const router = useRouter();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'completed'>('available');
  const [orders, setOrders] = useState<DriverOrder[]>([
    {
      id: 'ORD001',
      customerId: 'CUST001',
      customerName: 'John Doe',
      customerPhone: '+2348012345678',
      pickupAddress: 'Prime Store, Jahi District',
      deliveryAddress: 'Block 15, Maitama Estate',
      items: ['Rice - 5kg', 'Cooking Oil - 2L'],
      totalAmount: 3500,
      distance: '2.5 km',
      estimatedDuration: '15 mins',
      status: 'available',
      timestamp: '2 mins ago',
      earnings: 500
    },
    {
      id: 'ORD002',
      customerId: 'CUST002',
      customerName: 'Jane Smith',
      customerPhone: '+2348098765432',
      pickupAddress: 'Fresh Market, Wuse 2',
      deliveryAddress: 'Gwarinpa Estate',
      items: ['Vegetables', 'Fruits'],
      totalAmount: 2200,
      distance: '4.1 km',
      estimatedDuration: '25 mins',
      status: 'accepted',
      timestamp: '10 mins ago',
      earnings: 750
    },
    {
      id: 'ORD003',
      customerId: 'CUST003',
      customerName: 'Mike Johnson',
      customerPhone: '+2347012345678',
      pickupAddress: 'Green Farm Store',
      deliveryAddress: 'Life Camp',
      items: ['Beans - 3kg', 'Garri - 2kg'],
      totalAmount: 1800,
      distance: '3.2 km',
      estimatedDuration: '20 mins',
      status: 'delivered',
      timestamp: '2 hours ago',
      earnings: 600
    }
  ]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, []);

  const acceptOrder = (orderId: string) => {
    Alert.alert(
      'Accept Order',
      'Are you sure you want to accept this delivery order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: () => {
            setOrders(prev => 
              prev.map(order => 
                order.id === orderId 
                  ? { ...order, status: 'accepted' as const }
                  : order
              )
            );
            Alert.alert('Success', 'Order accepted! Head to pickup location.');
          }
        }
      ]
    );
  };

  const markAsPickedUp = (orderId: string) => {
    setOrders(prev => 
      prev.map(order => 
        order.id === orderId 
          ? { ...order, status: 'picked_up' as const }
          : order
      )
    );
    Alert.alert('Success', 'Order marked as picked up!');
  };

  const markAsDelivered = (orderId: string) => {
    Alert.alert(
      'Mark as Delivered',
      'Confirm that the order has been delivered to the customer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delivered',
          onPress: async () => {
            setOrders(prev => 
              prev.map(order => 
                order.id === orderId 
                  ? { ...order, status: 'delivered' as const }
                  : order
              )
            );
            
            // Save completed delivery
            try {
              const completedOrders = await AsyncStorage.getItem('driverCompletedOrders');
              const completed = completedOrders ? JSON.parse(completedOrders) : [];
              const completedOrder = orders.find(o => o.id === orderId);
              if (completedOrder) {
                completed.push({ ...completedOrder, completedAt: new Date().toISOString() });
                await AsyncStorage.setItem('driverCompletedOrders', JSON.stringify(completed));
              }
            } catch (error) {
              console.error('Error saving completed order:', error);
            }
            
            Alert.alert('Success', 'Order marked as delivered! Earnings added to your account.');
          }
        }
      ]
    );
  };

  const viewOrderDetails = (orderId: string) => {
    router.push(`/orders/order-details?id=${orderId}`);
  };

  const callCustomer = (phoneNumber: string, customerName: string) => {
    Alert.alert(
      'Call Customer',
      `Would you like to call ${customerName}?\n${phoneNumber}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => console.log('Calling:', phoneNumber) }
      ]
    );
  };

  const getFilteredOrders = () => {
    switch (activeTab) {
      case 'available':
        return orders.filter(order => order.status === 'available');
      case 'active':
        return orders.filter(order => ['accepted', 'picked_up'].includes(order.status));
      case 'completed':
        return orders.filter(order => ['delivered', 'cancelled'].includes(order.status));
      default:
        return orders;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#007bff';
      case 'accepted': return '#ffc107';
      case 'picked_up': return '#fd7e14';
      case 'delivered': return '#28a745';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Available';
      case 'accepted': return 'Accepted';
      case 'picked_up': return 'Picked Up';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const filteredOrders = getFilteredOrders();
  const styles = getResponsiveStyles(screenData);

  return (
    <LinearGradient
      colors={['#0B1A51', '#1e3a8a']}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Driver Orders</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Tabs */}
        <View style={styles.tabs}>
          {[
            { key: 'available', label: 'Available', count: orders.filter(o => o.status === 'available').length },
            { key: 'active', label: 'Active', count: orders.filter(o => ['accepted', 'picked_up'].includes(o.status)).length },
            { key: 'completed', label: 'Completed', count: orders.filter(o => ['delivered', 'cancelled'].includes(o.status)).length }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.activeTab
              ]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText
              ]}>
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{tab.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.ordersList} showsVerticalScrollIndicator={false}>
          {filteredOrders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={80} color="#ccc" />
              <Text style={styles.emptyTitle}>No {activeTab} orders</Text>
              <Text style={styles.emptyDescription}>
                {activeTab === 'available' 
                  ? 'New delivery orders will appear here when available.'
                  : activeTab === 'active'
                  ? 'Accepted orders will appear here.'
                  : 'Completed orders will appear here.'
                }
              </Text>
            </View>
          ) : (
            filteredOrders.map((order) => (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>#{order.id}</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(order.status) }
                  ]}>
                    <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
                  </View>
                </View>

                <View style={styles.customerInfo}>
                  <Ionicons name="person" size={16} color="#666" />
                  <Text style={styles.customerName}>{order.customerName}</Text>
                  <TouchableOpacity
                    style={styles.callButton}
                    onPress={() => callCustomer(order.customerPhone, order.customerName)}
                  >
                    <Ionicons name="call" size={16} color="#007bff" />
                  </TouchableOpacity>
                </View>

                <View style={styles.addressInfo}>
                  <View style={styles.addressRow}>
                    <Ionicons name="location" size={16} color="#28a745" />
                    <Text style={styles.addressText}>Pickup: {order.pickupAddress}</Text>
                  </View>
                  <View style={styles.addressRow}>
                    <Ionicons name="location" size={16} color="#dc3545" />
                    <Text style={styles.addressText}>Delivery: {order.deliveryAddress}</Text>
                  </View>
                </View>

                <View style={styles.orderDetails}>
                  <Text style={styles.itemsText}>Items: {order.items.join(', ')}</Text>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailText}>Distance: {order.distance}</Text>
                    <Text style={styles.detailText}>Duration: {order.estimatedDuration}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.amountText}>Order Total: ₦{order.totalAmount.toLocaleString()}</Text>
                    <Text style={styles.earningsText}>Your Earnings: ₦{order.earnings}</Text>
                  </View>
                </View>

                <View style={styles.orderActions}>
                  {order.status === 'available' && (
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => acceptOrder(order.id)}
                    >
                      <Text style={styles.acceptButtonText}>Accept Order</Text>
                    </TouchableOpacity>
                  )}
                  
                  {order.status === 'accepted' && (
                    <TouchableOpacity
                      style={styles.pickedUpButton}
                      onPress={() => markAsPickedUp(order.id)}
                    >
                      <Text style={styles.pickedUpButtonText}>Mark as Picked Up</Text>
                    </TouchableOpacity>
                  )}
                  
                  {order.status === 'picked_up' && (
                    <TouchableOpacity
                      style={styles.deliveredButton}
                      onPress={() => markAsDelivered(order.id)}
                    >
                      <Text style={styles.deliveredButtonText}>Mark as Delivered</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.timestamp}>{order.timestamp}</Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

const getResponsiveStyles = (screenData: any) => {
  const { width, height } = screenData;
  const isTablet = width >= 768;
  const isSmallScreen = width < 350;

  return StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: Math.max(16, width * 0.05),
      paddingTop: Math.max(50, height * 0.07),
    },
    backButton: {
      padding: Math.max(8, width * 0.02),
    },
    headerTitle: {
      fontSize: isTablet ? 24 : isSmallScreen ? 18 : 20,
      fontWeight: "bold",
      color: "white",
    },
    placeholder: {
      width: 40,
    },
    content: {
      flex: 1,
      backgroundColor: "white",
      borderTopLeftRadius: 35,
      borderTopRightRadius: 35,
      paddingTop: Math.max(24, height * 0.03),
    },
    tabs: {
      flexDirection: 'row',
      paddingHorizontal: Math.max(16, width * 0.05),
      marginBottom: 16,
      gap: 8,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Math.max(10, height * 0.012),
      borderRadius: 20,
      backgroundColor: '#f8f9fa',
      gap: 4,
    },
    activeTab: {
      backgroundColor: '#4682B4',
    },
    tabText: {
      fontSize: isTablet ? 14 : isSmallScreen ? 11 : 12,
      color: '#666',
      fontWeight: '600',
    },
    activeTabText: {
      color: 'white',
    },
    tabBadge: {
      backgroundColor: '#e74c3c',
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    tabBadgeText: {
      color: 'white',
      fontSize: 10,
      fontWeight: 'bold',
    },
    ordersList: {
      flex: 1,
      paddingHorizontal: Math.max(16, width * 0.05),
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Math.max(60, height * 0.1),
    },
    emptyTitle: {
      fontSize: isTablet ? 24 : isSmallScreen ? 18 : 20,
      fontWeight: 'bold',
      color: '#2c3e50',
      marginTop: 20,
      marginBottom: 10,
      textTransform: 'capitalize',
    },
    emptyDescription: {
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      color: '#7f8c8d',
      textAlign: 'center',
      lineHeight: 22,
      paddingHorizontal: 20,
    },
    orderCard: {
      backgroundColor: 'white',
      borderRadius: 15,
      padding: Math.max(16, width * 0.04),
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#e9ecef',
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
    orderId: {
      fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
      fontWeight: 'bold',
      color: '#2c3e50',
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      color: 'white',
      fontSize: isTablet ? 12 : isSmallScreen ? 10 : 11,
      fontWeight: '600',
    },
    customerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 8,
    },
    customerName: {
      flex: 1,
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      fontWeight: '600',
      color: '#2c3e50',
    },
    callButton: {
      padding: 6,
      borderRadius: 15,
      backgroundColor: '#e3f2fd',
    },
    addressInfo: {
      marginBottom: 12,
      gap: 8,
    },
    addressRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },
    addressText: {
      flex: 1,
      fontSize: isTablet ? 14 : isSmallScreen ? 12 : 13,
      color: '#666',
      lineHeight: 18,
    },
    orderDetails: {
      marginBottom: 12,
    },
    itemsText: {
      fontSize: isTablet ? 14 : isSmallScreen ? 12 : 13,
      color: '#666',
      marginBottom: 8,
    },
    detailsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    detailText: {
      fontSize: isTablet ? 14 : isSmallScreen ? 12 : 13,
      color: '#666',
    },
    amountText: {
      fontSize: isTablet ? 14 : isSmallScreen ? 12 : 13,
      fontWeight: '600',
      color: '#2c3e50',
    },
    earningsText: {
      fontSize: isTablet ? 14 : isSmallScreen ? 12 : 13,
      fontWeight: 'bold',
      color: '#28a745',
    },
    orderActions: {
      marginBottom: 8,
    },
    acceptButton: {
      backgroundColor: '#007bff',
      paddingVertical: Math.max(10, height * 0.012),
      borderRadius: 20,
      alignItems: 'center',
    },
    acceptButtonText: {
      color: 'white',
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      fontWeight: '600',
    },
    pickedUpButton: {
      backgroundColor: '#ffc107',
      paddingVertical: Math.max(10, height * 0.012),
      borderRadius: 20,
      alignItems: 'center',
    },
    pickedUpButtonText: {
      color: 'white',
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      fontWeight: '600',
    },
    deliveredButton: {
      backgroundColor: '#28a745',
      paddingVertical: Math.max(10, height * 0.012),
      borderRadius: 20,
      alignItems: 'center',
    },
    deliveredButtonText: {
      color: 'white',
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      fontWeight: '600',
    },
    timestamp: {
      fontSize: isTablet ? 12 : isSmallScreen ? 10 : 11,
      color: '#adb5bd',
      textAlign: 'right',
    },
  });
};
