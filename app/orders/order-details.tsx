
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
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
}

export default function OrderDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    loadOrderDetails();
    
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    return () => subscription?.remove();
  }, [id]);

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
      };
      setOrder(mockOrder);
    } catch (error) {
      console.error('Error loading order details:', error);
      Alert.alert('Error', 'Failed to load order details');
    }
  };

  const handleReportIssue = () => {
    Alert.alert('Report Issue', 'This feature will be available soon.');
  };

  const handleShareReceipt = () => {
    Alert.alert('Share Receipt', 'Receipt sharing feature coming soon.');
  };

  const handleContactDriver = (type: 'call' | 'message') => {
    if (type === 'call') {
      Alert.alert('Call Driver', `Call ${order?.driverName}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => console.log('Calling driver...') },
      ]);
    } else {
      Alert.alert('Message Driver', `Send message to ${order?.driverName}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send', onPress: () => console.log('Messaging driver...') },
      ]);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'delivered': return { bg: 'transparent', text: '#2ecc71', border: '#2ecc71' };
      case 'cancelled': return { bg: 'transparent', text: '#e74c3c', border: '#e74c3c' };
      case 'pending': return { bg: 'transparent', text: '#f39c12', border: '#f39c12' };
      case 'preparing': return { bg: 'transparent', text: '#f39c12', border: '#f39c12' };
      case 'confirmed': return { bg: 'transparent', text: '#3498db', border: '#3498db' };
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
      default: return status;
    }
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
      <View style={[styles.header, { paddingHorizontal: Math.max(20, screenDimensions.width * 0.05) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#1b1b1b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order History Detail</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Detail Section */}
        <View style={styles.orderDetail}>
          <View style={styles.itemIcon}>
            <Text style={styles.itemIconText}>{getItemIcon(order.itemType)}</Text>
          </View>
          <Text style={styles.orderTitle}>{order.items[0].name}</Text>
          <View style={styles.orderQtyBadge}>
            <Text style={styles.orderQtyText}>{order.quantity}</Text>
          </View>
          <Text style={styles.orderPrice}>₦{order.totalAmount.toLocaleString()}.00</Text>
        </View>

        {/* Details Section */}
        <View style={[styles.details, { paddingHorizontal: Math.max(20, screenDimensions.width * 0.05) }]}>
          <View style={styles.locationContainer}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationText}>{order.location}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time taken</Text>
            <Text style={styles.detailValue}>{order.timeTaken || 'N/A'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{formatDate(order.orderDate)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time of Delivery</Text>
            <Text style={styles.detailValue}>{order.deliveryTime || 'N/A'}</Text>
          </View>
        </View>

        {/* Purchase Summary */}
        <View style={[styles.summary, { marginHorizontal: Math.max(20, screenDimensions.width * 0.05) }]}>
          <Text style={styles.summaryTitle}>Purchase Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₦{order.subtotal.toLocaleString()}.00</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery fee</Text>
            <Text style={styles.summaryValue}>₦{order.deliveryFee.toLocaleString()}.00</Text>
          </View>
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₦{order.totalAmount.toLocaleString()}.00</Text>
          </View>
        </View>

        {/* Contact Driver */}
        <View style={[styles.contactDriver, { marginHorizontal: Math.max(20, screenDimensions.width * 0.05) }]}>
          <View style={styles.driverInfo}>
            <Text style={styles.contactText}>Contact driver</Text>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverAvatarText}>M</Text>
            </View>
            <Text style={styles.driverName}>{order.driverName || 'Mike'}</Text>
          </View>
          <View style={styles.driverActions}>
            <TouchableOpacity onPress={() => handleContactDriver('message')}>
              <Text style={styles.actionIcon}>💬</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleContactDriver('call')}>
              <Text style={styles.actionIcon}>📞</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Status */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { 
            backgroundColor: statusColors.bg, 
            borderColor: statusColors.border 
          }]}>
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              {getStatusText(order.status)}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={[styles.actions, { paddingHorizontal: Math.max(20, screenDimensions.width * 0.05) }]}>
          <TouchableOpacity style={styles.reportButton} onPress={handleReportIssue}>
            <Text style={styles.reportButtonText}>Report Issue</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton} onPress={handleShareReceipt}>
            <Text style={styles.shareButtonText}>Share Receipt</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
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
    width: 80,
    height: 80,
    backgroundColor: '#2f75c2',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemIconText: {
    fontSize: 40,
  },
  orderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1b1b1b',
    marginBottom: 5,
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
    padding: 20,
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
    flexDirection: 'row',
    gap: 20,
    paddingBottom: 30,
  },
  reportButton: {
    flex: 1,
    backgroundColor: '#f2f4f8',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  reportButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2f75c2',
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#0b1437',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
