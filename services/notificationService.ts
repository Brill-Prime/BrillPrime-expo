
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
  async registerPushToken(token: string, platform: 'ios' | 'android' | 'web'): Promise<ApiResponse<{ message: string }>> {
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
}

export const notificationService = new NotificationService();
