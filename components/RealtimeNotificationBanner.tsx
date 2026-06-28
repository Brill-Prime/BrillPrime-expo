
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../contexts/NotificationContext';
import { useRouter } from 'expo-router';

export default function RealtimeNotificationBanner() {
  const { latestNotification, clearLatestNotification } = useNotifications();
  const router = useRouter();
  const slideAnim = React.useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (latestNotification) {
      // Slide in
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: Platform.OS !== 'web',
        tension: 50,
        friction: 8,
      }).start();
    } else {
      // Slide out
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }
  }, [latestNotification]);

  const handlePress = () => {
    if (latestNotification?.data?.order_id) {
      router.push(`/orders/order-details?id=${latestNotification.data.order_id}`);
    } else if (latestNotification?.action) {
      router.push(latestNotification.action as any);
    } else {
      router.push('/notifications');
    }
    clearLatestNotification();
  };

  const getIconName = (type: string) => {
    switch (type) {
      case 'order': return 'cube';
      case 'payment': return 'card';
      case 'delivery': return 'car';
      case 'promotion': return 'gift';
      default: return 'notifications';
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'order': return '#4682B4';
      case 'payment': return '#28a745';
      case 'delivery': return '#ff9800';
      case 'promotion': return '#e74c3c';
      default: return '#6c757d';
    }
  };

  if (!latestNotification) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(latestNotification.type),
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <Ionicons
          name={getIconName(latestNotification.type) as any}
          size={24}
          color="#fff"
        />
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {latestNotification.title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {latestNotification.message}
          </Text>
        </View>
        <TouchableOpacity
          onPress={clearLatestNotification}
          style={styles.closeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  closeButton: {
    padding: 4,
  },
});
