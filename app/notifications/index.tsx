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
import { notificationService } from '@/services/notificationService';

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
      const response = await notificationService.getNotifications();
      if (response.success && response.data) {
        const formattedNotifications = response.data.map(notif => ({
          ...notif,
          timestamp: notif.timestamp || notif.createdAt || 'Just now'
        }));
        setNotifications(formattedNotifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await notificationService.markAsRead(notificationId);
      if (response.success) {
        const updatedNotifications = notifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        );
        setNotifications(updatedNotifications);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await notificationService.markAllAsRead();
      if (response.success) {
        const updatedNotifications = notifications.map(notification => ({
          ...notification,
          read: true
        }));
        setNotifications(updatedNotifications);
        Alert.alert('Success', 'All notifications marked as read');
      } else {
        Alert.alert('Error', response.error || 'Failed to mark notifications as read');
      }
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
              const response = await notificationService.deleteNotification(notificationId);
              if (response.success) {
                const updatedNotifications = notifications.filter(
                  notification => notification.id !== notificationId
                );
                setNotifications(updatedNotifications);
              } else {
                Alert.alert('Error', response.error || 'Failed to delete notification');
              }
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