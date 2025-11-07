
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService, Notification } from '../services/notificationService';
import { authService } from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [subscription, setSubscription] = useState<{ unsubscribe: () => void } | null>(null);

  const refreshNotifications = useCallback(async () => {
    try {
      const userRole = await AsyncStorage.getItem('userRole');
      const response = await notificationService.getUnreadCount(userRole || 'consumer');
      if (response.success && response.data) {
        setUnreadCount(response.data.count);
      } else {
        // Set to 0 on error instead of leaving stale data
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error refreshing notifications:', error);
      // Set to 0 on error
      setUnreadCount(0);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await notificationService.markAsRead(id);
      if (response.success) {
        await refreshNotifications();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [refreshNotifications]);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await notificationService.markAllAsRead();
      if (response.success) {
        await refreshNotifications();
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [refreshNotifications]);

  const clearLatestNotification = useCallback(() => {
    setLatestNotification(null);
  }, []);

  // Set up real-time notification subscription
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      try {
        const userData = await authService.getStoredUser();
        if (!userData?.id) return;

        const { supabase } = await import('../config/supabase');
        
        // Get user ID from Supabase
        const { data: users } = await supabase
          .from('users')
          .select('id')
          .eq('firebase_uid', userData.id)
          .single();

        if (!users) return;

        // Subscribe to real-time notifications
        const sub = notificationService.subscribeToNotifications(
          users.id,
          async (notification) => {
            console.log('📬 New notification received:', notification);
            
            // Update unread count
            await refreshNotifications();
            
            // Show latest notification
            setLatestNotification(notification);
            
            // Send local push notification
            await notificationService.sendLocalNotification(
              notification.title,
              notification.message,
              notification.data
            );

            // Auto-clear after 5 seconds
            setTimeout(() => {
              setLatestNotification(null);
            }, 5000);
          }
        );

        setSubscription(sub);
      } catch (error) {
        console.error('Error setting up notification subscription:', error);
      }
    };

    setupRealtimeSubscription();
    refreshNotifications();
    
    // Fallback polling every 30 seconds
    const interval = setInterval(refreshNotifications, 30000);
    
    // Refresh when window regains focus
    const handleFocus = () => {
      refreshNotifications();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus);
    }
    
    return () => {
      subscription?.unsubscribe();
      clearInterval(interval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocus);
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
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
