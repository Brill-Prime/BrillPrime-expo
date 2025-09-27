
// Notification Service
// Handles push notifications and in-app notifications

import { apiClient, ApiResponse } from './api';
import { authService } from './authService';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'promo' | 'system' | 'delivery';
  read: boolean;
  createdAt: string;
  data?: Record<string, any>;
}

class NotificationService {
  // Get user notifications
  async getNotifications(filters?: {
    type?: string;
    read?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<Notification[]>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    let endpoint = '/api/notifications';
    const queryParams = new URLSearchParams();
    
    if (filters) {
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.read !== undefined) queryParams.append('read', filters.read.toString());
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

  // Register device for push notifications
  async registerPushToken(token: string, platform: 'ios' | 'android'): Promise<ApiResponse<{ message: string }>> {
    const authToken = await authService.getToken();
    if (!authToken) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post('/api/notifications/register-device', 
      { token, platform }, 
      { Authorization: `Bearer ${authToken}` }
    );
  }

  // Update notification preferences
  async updatePreferences(preferences: {
    orderUpdates: boolean;
    promotions: boolean;
    systemNotifications: boolean;
    emailNotifications: boolean;
  }): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.put('/api/notifications/preferences', preferences, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Get notification preferences
  async getPreferences(): Promise<ApiResponse<{
    orderUpdates: boolean;
    promotions: boolean;
    systemNotifications: boolean;
    emailNotifications: boolean;
  }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.get('/api/notifications/preferences', {
      Authorization: `Bearer ${token}`,
    });
  }
}

export const notificationService = new NotificationService();
// Notification Service
// Handles push notifications and in-app notifications

import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, ApiResponse } from './api';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'payment' | 'system' | 'promotion';
  timestamp: string;
  read: boolean;
  action?: string;
  data?: any;
}

export interface NotificationSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  merchantUpdates: boolean;
}

class NotificationService {
  async getNotifications(): Promise<ApiResponse<Notification[]>> {
    try {
      const response = await apiClient.get('/notifications');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error getting notifications:', error);
      // Return cached notifications as fallback
      const cached = await AsyncStorage.getItem('userNotifications');
      return { 
        success: true, 
        data: cached ? JSON.parse(cached) : [] 
      };
    }
  }

  async markAsRead(notificationId: string): Promise<ApiResponse<void>> {
    try {
      await apiClient.put(`/notifications/${notificationId}/read`);
      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: 'Failed to mark notification as read' };
    }
  }

  async updateSettings(settings: NotificationSettings): Promise<ApiResponse<void>> {
    try {
      await apiClient.put('/notifications/settings', settings);
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(settings));
      return { success: true };
    } catch (error) {
      console.error('Error updating notification settings:', error);
      return { success: false, error: 'Failed to update notification settings' };
    }
  }

  async getSettings(): Promise<ApiResponse<NotificationSettings>> {
    try {
      const response = await apiClient.get('/notifications/settings');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error getting notification settings:', error);
      // Return default settings
      return {
        success: true,
        data: {
          pushNotifications: true,
          emailNotifications: true,
          orderUpdates: true,
          promotions: false,
          merchantUpdates: true,
        }
      };
    }
  }

  async registerForPushNotifications(token: string): Promise<ApiResponse<void>> {
    try {
      await apiClient.post('/notifications/register', { token });
      return { success: true };
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return { success: false, error: 'Failed to register for push notifications' };
    }
  }
}

export const notificationService = new NotificationService();
