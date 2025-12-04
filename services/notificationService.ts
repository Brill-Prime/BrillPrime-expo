// Notification Service
// Handles push notifications and in-app notifications

import { apiClient, ApiResponse } from './api';
import { authService } from './authService';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'promo' | 'system' | 'delivery' | 'payment' | 'promotion';
  read: boolean;
  createdAt: string;
  timestamp?: string;
  data?: Record<string, any>;
  action?: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface NotificationSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  merchantUpdates?: boolean;
  systemNotifications?: boolean;
  // Category-specific preferences
  categories: {
    order: {
      push: boolean;
      email: boolean;
      inApp: boolean;
    };
    payment: {
      push: boolean;
      email: boolean;
      inApp: boolean;
    };
    promo: {
      push: boolean;
      email: boolean;
      inApp: boolean;
    };
    delivery: {
      push: boolean;
      email: boolean;
      inApp: boolean;
    };
    system: {
      push: boolean;
      email: boolean;
      inApp: boolean;
    };
    promotion: {
      push: boolean;
      email: boolean;
      inApp: boolean;
    };
  };
  // Scheduled notification preferences
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
  };
}

export interface ScheduledNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  scheduledFor: string;
  status: 'pending' | 'sent' | 'cancelled';
  createdAt: string;
}

class NotificationService {
  // Get user notifications
  async getNotifications(filters?: {
    type?: string;
    read?: boolean;
    limit?: number;
    offset?: number;
    role?: string;
  }): Promise<ApiResponse<Notification[]>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    // Get user role if not provided
    let userRole = filters?.role;
    if (!userRole) {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      userRole = await AsyncStorage.getItem('userRole') || 'consumer';
    }

    let endpoint = '/api/notifications';
    const queryParams = new URLSearchParams();

    if (filters) {
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.read !== undefined) queryParams.append('read', filters.read.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.offset) queryParams.append('offset', filters.offset.toString());
    }
    
    // Add role filter
    queryParams.append('role', userRole);

    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`;
    }

    return apiClient.get<Notification[]>(endpoint, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.put(`/api/notifications/${notificationId}/read`, {}, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.put('/api/notifications/read-all', {}, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.delete(`/api/notifications/${notificationId}`, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Register device for push notifications with Firebase
  async registerPushToken(token: string, platform: 'ios' | 'android' | 'web'): Promise<ApiResponse<{ message: string }>> {
    const authToken = await authService.getToken();
    if (!authToken) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      // Store token locally
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem('fcm_token', token);

      // Register with backend
      const response = await apiClient.post('/api/notifications/register-device', 
        { token, platform, deviceId: await this.getDeviceId() }, 
        { Authorization: `Bearer ${authToken}` }
      );

      if (response.success) {
        await AsyncStorage.setItem('fcm_registered', 'true');
      }

      return response;
    } catch (error) {
      console.error('Error registering push token:', error);
      return { success: false, error: 'Failed to register device' };
    }
  }

  // Get device ID for push notifications
  private async getDeviceId(): Promise<string> {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    let deviceId = await AsyncStorage.getItem('device_id');
    
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem('device_id', deviceId);
    }
    
    return deviceId;
  }

  // Initialize Firebase messaging
  async initializePushNotifications(): Promise<boolean> {
    try {
      // Check if notifications are supported
      if (typeof window === 'undefined') {
        console.log('Push notifications not supported in this environment');
        return false;
      }

      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const isRegistered = await AsyncStorage.getItem('fcm_registered');
      
      if (isRegistered === 'true') {
        return true;
      }

      // Platform-specific initialization would go here
      console.log('Push notifications initialized');
      return true;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return false;
    }
  }

  // Update notification preferences
  async updateSettings(preferences: NotificationSettings): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.put('/api/notifications/preferences', preferences, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Get notification preferences
  async getSettings(): Promise<ApiResponse<NotificationSettings>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.get('/api/notifications/preferences', {
      Authorization: `Bearer ${token}`,
    });
  }

  // Get notification history
  async getHistory(filters?: {
    fromDate?: string;
    toDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<Notification[]>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    let endpoint = '/api/notifications/history';
    const queryParams = new URLSearchParams();

    if (filters) {
      if (filters.fromDate) queryParams.append('fromDate', filters.fromDate);
      if (filters.toDate) queryParams.append('toDate', filters.toDate);
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.offset) queryParams.append('offset', filters.offset.toString());
    }

    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`;
    }

    return apiClient.get<Notification[]>(endpoint, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Helper function for retry logic
  private async withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries === 0) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.withRetry(fn, retries - 1, delay * 2);
    }
  }

  // Check network connectivity with fallback to fetch
  private async checkNetworkConnectivity(): Promise<boolean> {
    try {
      // First try using NetInfo if available
      try {
        const { NetInfo } = await import('@react-native-community/netinfo');
        const state = await NetInfo.fetch();
        if (state.isConnected !== null) {
          return state.isConnected;
        }
      } catch (netInfoError) {
        console.warn('NetInfo check failed, falling back to fetch:', netInfoError);
      }
      
      // Fallback to fetch if NetInfo is not available or fails
      if (typeof fetch !== 'undefined') {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        
        try {
          const response = await fetch('https://www.google.com', { 
            method: 'HEAD',
            cache: 'no-store',
            mode: 'no-cors',
            signal: controller.signal
          });
          clearTimeout(timeout);
          return true;
        } catch (fetchError) {
          clearTimeout(timeout);
          console.warn('Fetch-based network check failed:', fetchError);
          return false;
        }
      }
      
      // If we can't check connectivity, assume we're online
      return true;
    } catch (error) {
      console.warn('Network check failed:', error);
      return false;
    }
  }

  // Get unread count with enhanced error handling and retry logic
  async getUnreadCount(role?: string): Promise<ApiResponse<{ count: number }>> {
    try {
      // Check network connectivity first
      const isConnected = await this.checkNetworkConnectivity();
      if (!isConnected) {
        console.log('No network connection, using cached notification count');
        return { success: false, error: 'No network connection', data: { count: 0 } };
      }

      // Use retry logic for the main operation
      return await this.withRetry(async () => {
        const token = await authService.getToken();
        if (!token) {
          console.warn('No auth token available for notification fetch');
          return { success: false, error: 'Authentication required', data: { count: 0 } };
        }

        // Get user data
        const userData = await authService.getStoredUser();
        if (!userData?.id) {
          console.warn('No user data available for notification fetch');
          return { success: false, error: 'User not found', data: { count: 0 } };
        }

        // Get user role if not provided
        let userRole = role;
        if (!userRole) {
          const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
          userRole = await AsyncStorage.getItem('userRole') || 'consumer';
        }

        // Use Supabase client directly
        const { supabase } = await import('../config/supabase');
        
        // Get user ID from Supabase with error handling
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('firebase_uid', userData.id)
          .single();

        if (userError || !users) {
          console.warn('User not found in database:', userError?.message || 'No user data');
          return { success: false, error: 'User not found in database', data: { count: 0 } };
        }

        // Count unread notifications with timeout
        const countPromise = supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', users.id)
          .eq('read', false)
          .eq('role', userRole);

        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 5000)
        );

        const { count, error } = await Promise.race([countPromise, timeoutPromise])
          .catch(error => ({ count: 0, error }));

        if (error) {
          console.warn('Error getting unread count:', error.message || error);
          return { success: false, error: 'Failed to get notifications', data: { count: 0 } };
        }

        return {
          success: true,
          data: { count: count || 0 }
        };
      });
    } catch (error) {
      console.error('Error in getUnreadCount:', error);
      return {
        success: false,
        error: 'Failed to get unread count',
        data: { count: 0 }
      };
    }
  }

  /**
   * Subscribe to real-time notifications
   */
  subscribeToNotifications(
    userId: string,
    callback: (notification: Notification) => void
  ): { unsubscribe: () => void } {
    const { supabase } = require('../config/supabase');
    
    const subscription = supabase
      .channel(`notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          const notification: Notification = {
            id: payload.new.id,
            title: payload.new.title,
            message: payload.new.message,
            type: payload.new.type,
            read: payload.new.read,
            createdAt: payload.new.created_at,
            timestamp: payload.new.created_at,
            data: payload.new.data,
          };
          callback(notification);
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        subscription.unsubscribe();
      },
    };
  }

  /**
   * Send local push notification (for mobile)
   */
  async sendLocalNotification(title: string, message: string, data?: any): Promise<void> {
    try {
      // Check if running on native platform
      const { Platform } = await import('react-native');
      
      if (Platform.OS === 'web') {
        // For web, use browser notifications if available
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, {
            body: message,
            icon: '/icon.png',
            data: data,
          });
        } else {
          console.log('Web notification:', { title, message, data });
        }
      } else {
        // For native platforms, use Expo Notifications
        try {
          const Notifications = await import('expo-notifications');
          
          // Configure notification handler
          Notifications.setNotificationHandler({
            handleNotification: async () => ({
              shouldShowAlert: true,
              shouldPlaySound: true,
              shouldSetBadge: true,
            }),
          });
          
          // Schedule immediate notification
          await Notifications.scheduleNotificationAsync({
            content: {
              title,
              body: message,
              data: data || {},
              sound: true,
            },
            trigger: null, // Show immediately
          });
        } catch (expoError) {
          console.log('Expo Notifications not available, logging:', { title, message, data });
        }
      }
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  }

  /**
   * Schedule a notification for future delivery
   */
  async scheduleNotification(
    title: string,
    message: string,
    type: string,
    scheduledFor: Date
  ): Promise<ApiResponse<ScheduledNotification>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post('/api/notifications/schedule', {
      title,
      message,
      type,
      scheduledFor: scheduledFor.toISOString(),
    }, {
      Authorization: `Bearer ${token}`,
    });
  }

  /**
   * Get scheduled notifications
   */
  async getScheduledNotifications(filters?: {
    status?: 'pending' | 'sent' | 'cancelled';
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<ScheduledNotification[]>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    let endpoint = '/api/notifications/scheduled';
    const queryParams = new URLSearchParams();

    if (filters) {
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.offset) queryParams.append('offset', filters.offset.toString());
    }

    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`;
    }

    return apiClient.get<ScheduledNotification[]>(endpoint, {
      Authorization: `Bearer ${token}`,
    });
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelScheduledNotification(notificationId: string): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.delete(`/api/notifications/scheduled/${notificationId}`, {
      Authorization: `Bearer ${token}`,
    });
  }

  /**
   * Update notification preferences with category-specific settings
   */
  async updateCategoryPreferences(
    category: keyof NotificationSettings['categories'],
    preferences: { push: boolean; email: boolean; inApp: boolean }
  ): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.put('/api/notifications/preferences/category', {
      category,
      preferences,
    }, {
      Authorization: `Bearer ${token}`,
    });
  }

  /**
   * Set quiet hours for notifications
   */
  async setQuietHours(
    enabled: boolean,
    startTime: string,
    endTime: string
  ): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.put('/api/notifications/preferences/quiet-hours', {
      enabled,
      startTime,
      endTime,
    }, {
      Authorization: `Bearer ${token}`,
    });
  }

  /**
   * Get push notification history
   */
  async getPushHistory(filters?: {
    fromDate?: string;
    toDate?: string;
    status?: 'delivered' | 'failed' | 'pending';
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<Notification[]>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    let endpoint = '/api/notifications/push-history';
    const queryParams = new URLSearchParams();

    if (filters) {
      if (filters.fromDate) queryParams.append('fromDate', filters.fromDate);
      if (filters.toDate) queryParams.append('toDate', filters.toDate);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.offset) queryParams.append('offset', filters.offset.toString());
    }

    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`;
    }

    return apiClient.get<Notification[]>(endpoint, {
      Authorization: `Bearer ${token}`,
    });
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(
    to: string,
    subject: string,
    template: string,
    data: Record<string, any>
  ): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post('/api/notifications/email', {
      to,
      subject,
      template,
      data,
    }, {
      Authorization: `Bearer ${token}`,
    });
  }
}

export const notificationService = new NotificationService();