
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'payment' | 'system' | 'promotion';
  timestamp: string;
  read: boolean;
  action?: string;
}

export default function Notifications() {
  const router = useRouter();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Order Delivered',
      message: 'Your order #12345 has been successfully delivered to your location.',
      type: 'order',
      timestamp: '2 hours ago',
      read: false,
      action: '/orders/consumer-orders'
    },
    {
      id: '2',
      title: 'Payment Successful',
      message: 'Your payment of ₦2,500 for order #12344 was processed successfully.',
      type: 'payment',
      timestamp: '5 hours ago',
      read: false,
      action: '/transactions'
    },
    {
      id: '3',
      title: 'New Merchant Near You',
      message: 'Fresh Market just joined Brill Prime in your area. Check out their products!',
      type: 'promotion',
      timestamp: '1 day ago',
      read: true,
      action: '/commodity/commodities'
    },
    {
      id: '4',
      title: 'Order Confirmed',
      message: 'Your order #12343 has been confirmed and is being prepared.',
      type: 'order',
      timestamp: '2 days ago',
      read: true,
      action: '/orders/consumer-orders'
    },
    {
      id: '5',
      title: 'App Update Available',
      message: 'A new version of Brill Prime is available with exciting new features.',
      type: 'system',
      timestamp: '3 days ago',
      read: true
    }
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    loadNotifications();

    return () => subscription?.remove();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const savedNotifications = await AsyncStorage.getItem('userNotifications');
      if (savedNotifications) {
        setNotifications(JSON.parse(savedNotifications));
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const updatedNotifications = notifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      );
      setNotifications(updatedNotifications);
      await AsyncStorage.setItem('userNotifications', JSON.stringify(updatedNotifications));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const updatedNotifications = notifications.map(notification => ({
        ...notification,
        read: true
      }));
      setNotifications(updatedNotifications);
      await AsyncStorage.setItem('userNotifications', JSON.stringify(updatedNotifications));
      Alert.alert('Success', 'All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      Alert.alert('Error', 'Failed to mark notifications as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedNotifications = notifications.filter(
                notification => notification.id !== notificationId
              );
              setNotifications(updatedNotifications);
              await AsyncStorage.setItem('userNotifications', JSON.stringify(updatedNotifications));
            } catch (error) {
              console.error('Error deleting notification:', error);
              Alert.alert('Error', 'Failed to delete notification');
            }
          }
        }
      ]
    );
  };

  const clearAllNotifications = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to delete all notifications? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              setNotifications([]);
              await AsyncStorage.setItem('userNotifications', JSON.stringify([]));
            } catch (error) {
              console.error('Error clearing notifications:', error);
              Alert.alert('Error', 'Failed to clear notifications');
            }
          }
        }
      ]
    );
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    if (notification.action) {
      router.push(notification.action as any);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return 'cube-outline';
      case 'payment':
        return 'card-outline';
      case 'system':
        return 'settings-outline';
      case 'promotion':
        return 'gift-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order':
        return '#4682B4';
      case 'payment':
        return '#28a745';
      case 'system':
        return '#ffc107';
      case 'promotion':
        return '#e74c3c';
      default:
        return '#6c757d';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
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
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.markAllButton}
          onPress={markAllAsRead}
        >
          <Ionicons name="checkmark-done" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <Text style={[styles.actionButtonText, unreadCount === 0 && styles.disabledText]}>
              Mark All Read
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.clearButton]}
            onPress={clearAllNotifications}
            disabled={notifications.length === 0}
          >
            <Text style={[styles.clearButtonText, notifications.length === 0 && styles.disabledText]}>
              Clear All
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.notificationsList} showsVerticalScrollIndicator={false}>
          {notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-outline" size={80} color="#ccc" />
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptyDescription}>
                You're all caught up! Notifications will appear here when you have new updates.
              </Text>
            </View>
          ) : (
            notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationCard,
                  !notification.read && styles.unreadCard
                ]}
                onPress={() => handleNotificationPress(notification)}
              >
                <View style={styles.notificationContent}>
                  <View style={[
                    styles.notificationIcon,
                    { backgroundColor: getNotificationColor(notification.type) }
                  ]}>
                    <Ionicons
                      name={getNotificationIcon(notification.type) as any}
                      size={20}
                      color="white"
                    />
                  </View>
                  
                  <View style={styles.notificationText}>
                    <View style={styles.notificationHeader}>
                      <Text style={[
                        styles.notificationTitle,
                        !notification.read && styles.unreadTitle
                      ]}>
                        {notification.title}
                      </Text>
                      {!notification.read && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.notificationMessage}>
                      {notification.message}
                    </Text>
                    <Text style={styles.notificationTimestamp}>
                      {notification.timestamp}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteNotification(notification.id)}
                >
                  <Ionicons name="close" size={20} color="#ccc" />
                </TouchableOpacity>
              </TouchableOpacity>
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
    headerContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    headerTitle: {
      fontSize: isTablet ? 24 : isSmallScreen ? 18 : 20,
      fontWeight: "bold",
      color: "white",
    },
    unreadBadge: {
      backgroundColor: '#e74c3c',
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    unreadText: {
      color: 'white',
      fontSize: 12,
      fontWeight: 'bold',
    },
    markAllButton: {
      padding: Math.max(8, width * 0.02),
    },
    content: {
      flex: 1,
      backgroundColor: "white",
      borderTopLeftRadius: 35,
      borderTopRightRadius: 35,
      paddingTop: Math.max(24, height * 0.03),
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: Math.max(16, width * 0.05),
      marginBottom: 16,
    },
    actionButton: {
      flex: 1,
      backgroundColor: '#4682B4',
      paddingVertical: Math.max(10, height * 0.012),
      borderRadius: 20,
      alignItems: 'center',
    },
    clearButton: {
      backgroundColor: '#e74c3c',
    },
    actionButtonText: {
      color: 'white',
      fontSize: isTablet ? 14 : isSmallScreen ? 11 : 12,
      fontWeight: '600',
    },
    clearButtonText: {
      color: 'white',
      fontSize: isTablet ? 14 : isSmallScreen ? 11 : 12,
      fontWeight: '600',
    },
    disabledText: {
      opacity: 0.5,
    },
    notificationsList: {
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
    },
    emptyDescription: {
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      color: '#7f8c8d',
      textAlign: 'center',
      lineHeight: 22,
      paddingHorizontal: 20,
    },
    notificationCard: {
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
    unreadCard: {
      borderColor: '#4682B4',
      backgroundColor: '#f8f9ff',
    },
    notificationContent: {
      flexDirection: 'row',
      gap: 12,
    },
    notificationIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    notificationText: {
      flex: 1,
    },
    notificationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    notificationTitle: {
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      fontWeight: '600',
      color: '#2c3e50',
      flex: 1,
    },
    unreadTitle: {
      fontWeight: 'bold',
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#4682B4',
    },
    notificationMessage: {
      fontSize: isTablet ? 14 : isSmallScreen ? 12 : 13,
      color: '#7f8c8d',
      lineHeight: 18,
      marginBottom: 4,
    },
    notificationTimestamp: {
      fontSize: isTablet ? 12 : isSmallScreen ? 10 : 11,
      color: '#adb5bd',
    },
    deleteButton: {
      position: 'absolute',
      top: 12,
      right: 12,
      padding: 4,
    },
  });
};

interface Notification {
  id: string;
  type: 'payment' | 'delivery' | 'order' | 'security' | 'promotion';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
  actionButton?: {
    text: string;
    route: string;
  };
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'payment',
      title: 'Payment Successful',
      message: 'Your payment of ₦15,000 to Lagos Fuel Station has been processed successfully.',
      timestamp: '2 minutes ago',
      read: false,
      priority: 'high',
      actionButton: { text: 'View Receipt', route: '/transactions' }
    },
    {
      id: '2',
      type: 'delivery',
      title: 'Delivery Confirmation Required',
      message: 'Your fuel delivery is complete. Please scan the QR code to confirm receipt.',
      timestamp: '5 minutes ago',
      read: false,
      priority: 'high',
    },
    {
      id: '3',
      type: 'order',
      title: 'Order Status Update',
      message: 'Your order #BP12345 has been dispatched and is on the way to your location.',
      timestamp: '1 hour ago',
      read: false,
      priority: 'medium'
    },
    {
      id: '4',
      type: 'security',
      title: 'Security Alert',
      message: 'New device login detected from Lagos, Nigeria. If this wasn\'t you, please secure your account.',
      timestamp: '3 hours ago',
      read: true,
      priority: 'high',
    },
    {
      id: '5',
      type: 'promotion',
      title: 'Special Offer Available',
      message: 'Get 10% off your next fuel purchase. Valid until midnight today!',
      timestamp: '1 day ago',
      read: true,
      priority: 'low',
    }
  ]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    return () => subscription?.remove();
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment': return 'card-outline';
      case 'delivery': return 'cube-outline';
      case 'order': return 'time-outline';
      case 'security': return 'shield-outline';
      case 'promotion': return 'gift-outline';
      default: return 'notifications-outline';
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'high') return '#e74c3c';
    switch (type) {
      case 'payment': return '#2ecc71';
      case 'delivery': return '#3498db';
      case 'order': return '#f39c12';
      case 'security': return '#e74c3c';
      case 'promotion': return '#9b59b6';
      default: return '#95a5a6';
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notif => notif.id !== notificationId)
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = () => {
    switch (activeTab) {
      case 'unread': return notifications.filter(n => !n.read);
      case 'read': return notifications.filter(n => n.read);
      default: return notifications;
    }
  };

  const renderNotification = (notification: Notification) => (
    <TouchableOpacity
      key={notification.id}
      style={[
        styles.notificationCard,
        !notification.read && styles.unreadCard
      ]}
      onPress={() => markAsRead(notification.id)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: getNotificationColor(notification.type, notification.priority) + '20' }
        ]}>
          <Ionicons
            name={getNotificationIcon(notification.type) as any}
            size={24}
            color={getNotificationColor(notification.type, notification.priority)}
          />
        </View>

        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.notificationTitle}>{notification.title}</Text>
            <View style={styles.indicators}>
              <View style={[
                styles.priorityDot,
                { backgroundColor: getNotificationColor(notification.type, notification.priority) }
              ]} />
              {!notification.read && <View style={styles.unreadDot} />}
            </View>
          </View>

          <Text style={styles.notificationMessage}>{notification.message}</Text>
          <Text style={styles.timestamp}>{notification.timestamp}</Text>

          {notification.actionButton && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push(notification.actionButton!.route)}
            >
              <Text style={styles.actionButtonText}>{notification.actionButton.text}</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteNotification(notification.id)}
        >
          <Ionicons name="close" size={20} color="#999" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const styles = getResponsiveStyles(screenData);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
          </Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(['all', 'unread', 'read'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && styles.activeTab
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab && styles.activeTabText
            ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)} ({
                tab === 'all' ? notifications.length :
                tab === 'unread' ? unreadCount :
                notifications.length - unreadCount
              })
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notifications List */}
      <ScrollView style={styles.notificationsList} showsVerticalScrollIndicator={false}>
        {filteredNotifications().length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name={activeTab === 'unread' ? 'checkmark-circle' : 'notifications-outline'}
              size={64}
              color="#ccc"
            />
            <Text style={styles.emptyTitle}>
              {activeTab === 'unread' ? 'All caught up!' : 'No notifications'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'unread'
                ? 'You have no unread notifications.'
                : 'Your notifications will appear here.'
              }
            </Text>
          </View>
        ) : (
          filteredNotifications().map(renderNotification)
        )}
      </ScrollView>
    </View>
  );
}

const getResponsiveStyles = (screenData: any) => {
  const { width, height } = screenData;
  const isTablet = width >= 768;
  const isSmallScreen = width < 350;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f8f9fa',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Math.max(16, width * 0.04),
      paddingTop: Math.max(50, height * 0.07),
      paddingBottom: 16,
      backgroundColor: 'white',
      borderBottomWidth: 1,
      borderBottomColor: '#e9ecef',
    },
    backButton: {
      padding: 8,
    },
    headerContent: {
      flex: 1,
      marginLeft: 12,
    },
    headerTitle: {
      fontSize: isTablet ? 20 : isSmallScreen ? 16 : 18,
      fontWeight: 'bold',
      color: '#333',
    },
    headerSubtitle: {
      fontSize: isTablet ? 14 : isSmallScreen ? 12 : 13,
      color: '#666',
      marginTop: 2,
    },
    markAllButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    markAllText: {
      fontSize: isTablet ? 14 : isSmallScreen ? 12 : 13,
      color: '#667eea',
      fontWeight: '600',
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: 'white',
      paddingHorizontal: Math.max(16, width * 0.04),
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#e9ecef',
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
      marginHorizontal: 4,
      alignItems: 'center',
    },
    activeTab: {
      backgroundColor: '#667eea',
    },
    tabText: {
      fontSize: isTablet ? 14 : isSmallScreen ? 12 : 13,
      color: '#666',
      fontWeight: '500',
    },
    activeTabText: {
      color: 'white',
      fontWeight: '600',
    },
    notificationsList: {
      flex: 1,
      paddingHorizontal: Math.max(16, width * 0.04),
    },
    notificationCard: {
      backgroundColor: 'white',
      borderRadius: 12,
      marginVertical: 6,
      padding: 16,
      borderLeftWidth: 4,
      borderLeftColor: 'transparent',
    },
    unreadCard: {
      borderLeftColor: '#667eea',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    notificationContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    textContainer: {
      flex: 1,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    notificationTitle: {
      fontSize: isTablet ? 16 : isSmallScreen ? 14 : 15,
      fontWeight: '600',
      color: '#333',
      flex: 1,
    },
    indicators: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    priorityDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#667eea',
    },
    notificationMessage: {
      fontSize: isTablet ? 14 : isSmallScreen ? 12 : 13,
      color: '#666',
      lineHeight: 18,
      marginBottom: 8,
    },
    timestamp: {
      fontSize: isTablet ? 12 : isSmallScreen ? 10 : 11,
      color: '#999',
      marginBottom: 8,
    },
    actionButton: {
      backgroundColor: '#667eea',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 16,
      alignSelf: 'flex-start',
    },
    actionButtonText: {
      fontSize: isTablet ? 14 : isSmallScreen ? 12 : 13,
      color: 'white',
      fontWeight: '500',
    },
    deleteButton: {
      padding: 8,
      marginLeft: 8,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
      paddingHorizontal: 32,
    },
    emptyTitle: {
      fontSize: isTablet ? 20 : isSmallScreen ? 16 : 18,
      fontWeight: '600',
      color: '#666',
      marginTop: 16,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: isTablet ? 16 : isSmallScreen ? 14 : 15,
      color: '#999',
      marginTop: 8,
      textAlign: 'center',
      lineHeight: 20,
    },
  });
};
