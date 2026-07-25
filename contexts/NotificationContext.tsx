import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService, Notification } from '../services/notificationService';
import { authService } from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

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
  const subscriptionRef = React.useRef<{ unsubscribe: () => void } | null>(null);

  const refreshNotifications = useCallback(async () => {
    try {
      // Check if user is authenticated before trying to fetch notifications
      const token = await authService.getToken();
      if (!token) {
        // User not authenticated, set count to 0
        setUnreadCount(0);
        return;
      }

      const userRole = await AsyncStorage.getItem('userRole');
      const response = await notificationService.getUnreadCount(userRole || 'consumer');
      if (response.success && response.data) {
        setUnreadCount(response.data.count);
      } else {
        // Set to 0 on error instead of leaving stale data
        console.log('Failed to fetch notifications, using default count');
        setUnreadCount(0);
      }
    } catch (error) {
      // Silently fail - notifications are not critical
      console.log('Notification refresh skipped:', error);
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
    let isMounted = true;

    const setupRealtimeSubscription = async () => {
      try {
        // Only set up subscription if user is authenticated
        const token = await authService.getToken();
        if (!token) {
          console.log('User not authenticated, skipping notification subscription');
          return;
        }

        const userData = await authService.getStoredUser();
        if (!userData?.id) return;

        // Import supabase dynamically to avoid issues during app startup
        let supabase;
        try {
          const supabaseModule = await import('../config/supabase');
          supabase = supabaseModule.supabase;
        } catch (importError) {
          console.error('Failed to import supabase:', importError);
          return;
        }

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
            if (!isMounted) return;

            console.log('📬 New notification received:', notification);

            // Update unread count
            await refreshNotifications();

            // Show latest notification
            setLatestNotification(notification);

            // Send local push notification
            try {
              await notificationService.sendLocalNotification(
                notification.title,
                notification.message,
                notification.data
              );
            } catch (notificationError) {
              console.error('Error sending local notification:', notificationError);
            }

            // Auto-clear after 5 seconds
            setTimeout(() => {
              if (isMounted) {
                setLatestNotification(null);
              }
            }, 5000);
          }
        );

        if (isMounted) {
          subscriptionRef.current = sub;
        }
      } catch (error) {
        console.error('Error setting up notification subscription:', error);
      }
    };

    setupRealtimeSubscription();
    refreshNotifications();

    // Fallback polling every 30 seconds
    const interval = setInterval(() => {
      if (isMounted) {
        refreshNotifications();
      }
    }, 30000);

    // Refresh when app regains focus (only on web)
    const handleFocus = () => {
      if (isMounted) {
        refreshNotifications();
      }
    };

    // Only add event listeners on web platform
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus);
    }

    return () => {
      isMounted = false;
      if (subscriptionRef.current?.unsubscribe) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      clearInterval(interval);
      // Only remove event listeners on web platform
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
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