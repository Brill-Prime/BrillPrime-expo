
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'order' | 'promo' | 'system' | 'delivery';
  read: boolean;
}

export default function Notifications() {
  const router = useRouter();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Order Delivered',
      message: 'Your order #12345 has been successfully delivered to your location.',
      timestamp: '2 hours ago',
      type: 'delivery',
      read: false,
    },
    {
      id: '2',
      title: 'Special Offer',
      message: '20% off on all electronics! Use code SAVE20. Valid until tomorrow.',
      timestamp: '5 hours ago',
      type: 'promo',
      read: false,
    },
    {
      id: '3',
      title: 'Order Confirmed',
      message: 'Your order #12344 has been confirmed and is being prepared.',
      timestamp: '1 day ago',
      type: 'order',
      read: true,
    },
    {
      id: '4',
      title: 'Account Update',
      message: 'Your profile information has been successfully updated.',
      timestamp: '2 days ago',
      type: 'system',
      read: true,
    },
    {
      id: '5',
      title: 'New Products Available',
      message: 'Check out the latest products in your favorite categories.',
      timestamp: '3 days ago',
      type: 'promo',
      read: true,
    },
  ]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    return () => subscription?.remove();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate loading new notifications
    setTimeout(() => setRefreshing(false), 1000);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return 'bag';
      case 'delivery':
        return 'checkmark-circle';
      case 'promo':
        return 'pricetag';
      case 'system':
        return 'settings';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order':
        return '#667eea';
      case 'delivery':
        return '#4ade80';
      case 'promo':
        return '#f59e0b';
      case 'system':
        return '#6b7280';
      default:
        return '#667eea';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const styles = getResponsiveStyles(screenData);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>Mark All</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {notifications.length > 0 ? (
          notifications.map((notification) => (
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
                  { backgroundColor: getNotificationColor(notification.type) + '20' }
                ]}>
                  <Ionicons
                    name={getNotificationIcon(notification.type) as any}
                    size={24}
                    color={getNotificationColor(notification.type)}
                  />
                </View>
                
                <View style={styles.textContainer}>
                  <View style={styles.titleRow}>
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
                  <Text style={styles.timestamp}>{notification.timestamp}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptyMessage}>
              You're all caught up! Check back later for new notifications.
            </Text>
          </View>
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
      paddingBottom: Math.max(16, height * 0.02),
      backgroundColor: 'white',
      borderBottomWidth: 1,
      borderBottomColor: '#e9ecef',
    },
    backButton: {
      padding: 8,
    },
    headerTitleContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: isTablet ? 24 : isSmallScreen ? 18 : 20,
      fontWeight: 'bold',
      color: '#333',
    },
    badge: {
      backgroundColor: '#ff6b6b',
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
    },
    badgeText: {
      color: 'white',
      fontSize: 12,
      fontWeight: 'bold',
    },
    markAllButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    markAllText: {
      color: '#667eea',
      fontWeight: '600',
      fontSize: isTablet ? 14 : 12,
    },
    content: {
      flex: 1,
      paddingHorizontal: Math.max(16, width * 0.04),
    },
    notificationCard: {
      backgroundColor: 'white',
      marginVertical: Math.max(4, height * 0.005),
      borderRadius: 12,
      padding: Math.max(16, width * 0.04),
    },
    unreadCard: {
      borderLeftWidth: 4,
      borderLeftColor: '#667eea',
    },
    notificationContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    iconContainer: {
      width: isTablet ? 50 : 40,
      height: isTablet ? 50 : 40,
      borderRadius: isTablet ? 25 : 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    textContainer: {
      flex: 1,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    notificationTitle: {
      fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
      fontWeight: '600',
      color: '#333',
      flex: 1,
    },
    unreadTitle: {
      color: '#1a1a1a',
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#667eea',
      marginLeft: 8,
    },
    notificationMessage: {
      fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
      color: '#666',
      lineHeight: isTablet ? 22 : 20,
      marginBottom: 8,
    },
    timestamp: {
      fontSize: isTablet ? 14 : isSmallScreen ? 10 : 12,
      color: '#999',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: Math.max(100, height * 0.2),
    },
    emptyTitle: {
      fontSize: isTablet ? 24 : isSmallScreen ? 18 : 20,
      fontWeight: '600',
      color: '#666',
      marginTop: 16,
      marginBottom: 8,
    },
    emptyMessage: {
      fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
      color: '#999',
      textAlign: 'center',
      paddingHorizontal: 32,
      lineHeight: 20,
    },
  });
};
