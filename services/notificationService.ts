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

  // Get unread count
  async getUnreadCount(role?: string): Promise<ApiResponse<{ count: number }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    // Get user role if not provided
    let userRole = role;
    if (!userRole) {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      userRole = await AsyncStorage.getItem('userRole') || 'consumer';
    }

    const endpoint = `/api/notifications/unread-count?role=${userRole}`;

    return apiClient.get(endpoint, {
      Authorization: `Bearer ${token}`,
    });
  }
}

export const notificationService = new NotificationService();