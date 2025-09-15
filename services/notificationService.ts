
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
