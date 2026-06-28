import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { notificationService, Notification } from '../services/notificationService';
import { authService } from '../services/authService';

interface NotificationContextType {
  unreadCount: number;
  latestNotification: Notification | null;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearLatestNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null);

  const refreshNotifications = useCallback(async () => {
    try {
      await authService.ready();
      const userRole = (await AsyncStorage.getItem('userRole')) || 'consumer';
      const response = await notificationService.getUnreadCount(userRole);

      if (response.success && response.data) {
        setUnreadCount(response.data.count);
      } else {
        console.log('Failed to fetch notifications, using default count:', response?.error);
        setUnreadCount(0);
      }
    } catch (error) {
      console.log('Notification refresh failed:', error);
      setUnreadCount(0);
    }
  }, []);

  const markAsRead = useCallback(
    async (id: string) => {
      try {
        const response = await notificationService.markAsRead(id);
        if (response.success) await refreshNotifications();
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    },
    [refreshNotifications]
  );

  const markAllAsRead = useCallback(
    async () => {
      try {
        const response = await notificationService.markAllAsRead();
        if (response.success) await refreshNotifications();
      } catch (error) {
        console.error('Error marking all as read:', error);
      }
    },
    [refreshNotifications]
  );

  const clearLatestNotification = useCallback(() => {
    setLatestNotification(null);
  }, []);

  useEffect(() => {
    let activeSubscription: { unsubscribe: () => void } | null = null;

    const setupRealtimeSubscription = async () => {
      try {
        await authService.ready();
        const userData = await authService.getStoredUser();
        if (!userData?.id) return;

        const { supabase } = await import('../config/supabase');

        const { data: users } = await supabase
          .from('users')
          .select('id')
          .eq('firebase_uid', userData.id)
          .single();

        if (!users) return;

        activeSubscription = notificationService.subscribeToNotifications(
          users.id,
          async (notification: Notification) => {
            console.log('📬 New notification received:', notification);
            await refreshNotifications();
            setLatestNotification(notification);
            await notificationService.sendLocalNotification(
              notification.title,
              notification.message,
              notification.data
            );
            setTimeout(() => setLatestNotification(null), 5000);
          }
        );
      } catch (error) {
        console.error('Error setting up notification subscription:', error);
      }
    };

    setupRealtimeSubscription();
    refreshNotifications();

    const interval = setInterval(refreshNotifications, 30000);

    const handleFocus = () => {
      refreshNotifications();
    };

    const isWeb = Platform.OS === 'web';
    const canUseWindowFocus =
      isWeb &&
      typeof window !== 'undefined' &&
      typeof window.addEventListener === 'function';

    if (canUseWindowFocus) {
      try {
        window.addEventListener('focus', handleFocus);
      } catch (error) {
        console.warn('Window focus listener skipped on non-browser platform:', error);
      }
    }

    return () => {
      activeSubscription?.unsubscribe();
      clearInterval(interval);

      if (canUseWindowFocus) {
        try {
          window.removeEventListener('focus', handleFocus);
        } catch (error) {
          console.warn('Window focus cleanup skipped on non-browser platform:', error);
        }
      }
    };
  }, [refreshNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        latestNotification,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        clearLatestNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};

