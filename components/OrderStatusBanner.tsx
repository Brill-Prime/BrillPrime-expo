
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface OrderStatusBannerProps {
  visible: boolean;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  onDismiss: () => void;
  actionText?: string;
  onAction?: () => void;
}

export default function OrderStatusBanner({
  visible,
  message,
  type,
  onDismiss,
  actionText,
  onAction,
}: OrderStatusBannerProps) {
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: Platform.OS !== 'web',
        tension: 50,
        friction: 8,
      }).start();

      // Auto dismiss after 5 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => onDismiss());
  };

  const getIconName = () => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'info': return 'information-circle';
      case 'warning': return 'warning';
      case 'error': return 'close-circle';
      default: return 'information-circle';
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return '#28a745';
      case 'info': return '#4682B4';
      case 'warning': return '#ffc107';
      case 'error': return '#dc3545';
      default: return '#4682B4';
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Ionicons name={getIconName()} size={24} color="#fff" />
      <Text style={styles.message}>{message}</Text>
      {actionText && onAction && (
        <TouchableOpacity onPress={onAction} style={styles.actionButton}>
          <Text style={styles.actionText}>{actionText}</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
        <Ionicons name="close" size={20} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
});
