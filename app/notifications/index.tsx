import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
  RefreshControl,
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
  createdAt?: string; // Added for fallback data
}

import ErrorBoundary from '@/components/ErrorBoundary';

function NotificationsScreen() {
  const router = useRouter();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const userRole = await AsyncStorage.getItem('userRole');
      const response = await notificationService.getNotifications({
        role: userRole || 'consumer'
      });

      if (response.success && response.data && response.data.length > 0) {
        // Format timestamps to be consistent
        const formattedNotifications = response.data.map(notif => ({
          ...notif,
          timestamp: notif.timestamp || notif.createdAt || 'Just now'
        }));
        setNotifications(formattedNotifications);
      } else {
        // Empty state - no notifications
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Empty state on error - don't show fake notifications
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    loadNotifications();

    // Refresh notifications every 30 seconds for real-time updates
    const interval = setInterval(loadNotifications, 30000);

    return () => {
      subscription?.remove();
      clearInterval(interval);
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
  };

  const markAsRead = async (id: string) => {
    try {
      const { notificationService } = await import('../../services/notificationService');
      const response = await notificationService.markAsRead(id);

      if (response.success) {
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === id ? { ...notif, read: true } : notif
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Still update UI even if API fails to provide immediate feedback
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      const { notificationService } = await import('../../services/notificationService');
      const response = await notificationService.markAllAsRead();

      if (response.success) {
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, read: true }))
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to mark all notifications as read');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      // Still update UI even if API fails
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );
      Alert.alert('Error', 'Failed to mark all notifications as read');
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
              const { notificationService } = await import('../../services/notificationService');
              const response = await notificationService.deleteNotification(notificationId);
              if (response.success) {
                setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
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
              // Ideally, there would be a notificationService.clearAll()
              // For now, we'll clear local state and simulate backend clearing
              setNotifications([]);
              // await AsyncStorage.setItem('userNotifications', JSON.stringify([])); // This would be for local storage persistence
              console.log('All notifications cleared locally. Backend clear action would be called here.');
              Alert.alert('Success', 'All notifications cleared.');
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
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => router.push('/notifications/history' as any)}
          >
            <Ionicons name="time-outline" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => router.push('/notifications/preferences' as any)}
          >
            <Ionicons name="settings-outline" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={markAllAsRead}
          >
            <Ionicons name="checkmark-done" size={24} color="white" />
          </TouchableOpacity>
        </View>
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

        <ScrollView
          style={styles.notificationsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4682B4']} // Customize refresh indicator color
              tintColor={'#4682B4'} // For iOS
            />
          }
        >
          {loading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color="#4682B4" />
              <Text style={styles.emptyTitle}>Loading Notifications...</Text>
            </View>
          ) : notifications.length === 0 ? (
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

export default function Notifications() {
  return (
    <ErrorBoundary>
      <NotificationsScreen />
    </ErrorBoundary>
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
    headerActions: {
      flexDirection: 'row',
      gap: 8,
    },
    headerIconButton: {
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