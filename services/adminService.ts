
```typescript
// Admin Service
// Handles admin-specific operations and analytics

import { apiClient, ApiResponse } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SystemMetrics {
  platform: {
    totalUsers: number;
    activeUsers: number;
    onlineDrivers: number;
    activeMerchants: number;
    systemUptime: number;
    serverHealth: string;
  };
  transactions: {
    totalTransactions: number;
    todayTransactions: number;
    pendingTransactions: number;
    disputedTransactions: number;
    totalVolume: number;
    escrowBalance: number;
  };
  security: {
    fraudAlerts: number;
    suspiciousActivities: number;
    blockedUsers: number;
    securityIncidents: number;
  };
}

export interface AdminAnalytics {
  revenue: {
    total: number;
    daily: number;
    weekly: number;
    monthly: number;
    growth: number;
  };
  users: {
    total: number;
    active: number;
    new: number;
    retention: number;
  };
  transactions: {
    total: number;
    successful: number;
    failed: number;
    averageValue: number;
  };
}

class AdminService {
  private async getAdminToken(): Promise<string | null> {
    return await AsyncStorage.getItem('adminToken');
  }

  // Get system metrics
  async getSystemMetrics(): Promise<ApiResponse<SystemMetrics>> {
    const token = await this.getAdminToken();
    if (!token) {
      return { success: false, error: 'Admin authentication required' };
    }

    try {
      return await apiClient.get<SystemMetrics>('/api/admin/system-metrics', {
        Authorization: `Bearer ${token}`,
      });
    } catch (error) {
      console.error('Get system metrics error:', error);
      return { success: false, error: 'Failed to fetch system metrics' };
    }
  }

  // Get analytics data
  async getAnalytics(timeframe: 'day' | 'week' | 'month' | 'year'): Promise<ApiResponse<AdminAnalytics>> {
    const token = await this.getAdminToken();
    if (!token) {
      return { success: false, error: 'Admin authentication required' };
    }

    try {
      return await apiClient.get<AdminAnalytics>(`/api/admin/analytics?timeframe=${timeframe}`, {
        Authorization: `Bearer ${token}`,
      });
    } catch (error) {
      console.error('Get analytics error:', error);
      return { success: false, error: 'Failed to fetch analytics' };
    }
  }

  // Send platform-wide announcement
  async sendAnnouncement(data: {
    title: string;
    message: string;
    targetAudience: 'all' | 'consumers' | 'merchants' | 'drivers';
    priority: 'low' | 'medium' | 'high';
  }): Promise<ApiResponse<{ sent: number }>> {
    const token = await this.getAdminToken();
    if (!token) {
      return { success: false, error: 'Admin authentication required' };
    }

    try {
      return await apiClient.post<{ sent: number }>('/api/admin/announcements', data, {
        Authorization: `Bearer ${token}`,
      });
    } catch (error) {
      console.error('Send announcement error:', error);
      return { success: false, error: 'Failed to send announcement' };
    }
  }

  // Toggle maintenance mode
  async setMaintenanceMode(enabled: boolean, message?: string): Promise<ApiResponse<{ status: string }>> {
    const token = await this.getAdminToken();
    if (!token) {
      return { success: false, error: 'Admin authentication required' };
    }

    try {
      return await apiClient.post<{ status: string }>('/api/admin/maintenance', {
        enabled,
        message
      }, {
        Authorization: `Bearer ${token}`,
      });
    } catch (error) {
      console.error('Set maintenance mode error:', error);
      return { success: false, error: 'Failed to set maintenance mode' };
    }
  }

  // Export reports
  async exportReport(type: 'transactions' | 'users' | 'analytics', format: 'csv' | 'pdf'): Promise<ApiResponse<{ downloadUrl: string }>> {
    const token = await this.getAdminToken();
    if (!token) {
      return { success: false, error: 'Admin authentication required' };
    }

    try {
      return await apiClient.post<{ downloadUrl: string }>('/api/admin/reports/export', {
        type,
        format
      }, {
        Authorization: `Bearer ${token}`,
      });
    } catch (error) {
      console.error('Export report error:', error);
      return { success: false, error: 'Failed to export report' };
    }
  }

  // Block/Unblock user
  async toggleUserBlock(userId: string, blocked: boolean, reason?: string): Promise<ApiResponse<{ message: string }>> {
    const token = await this.getAdminToken();
    if (!token) {
      return { success: false, error: 'Admin authentication required' };
    }

    try {
      return await apiClient.post<{ message: string }>('/api/admin/users/toggle-block', {
        userId,
        blocked,
        reason
      }, {
        Authorization: `Bearer ${token}`,
      });
    } catch (error) {
      console.error('Toggle user block error:', error);
      return { success: false, error: 'Failed to toggle user block status' };
    }
  }
}

export const adminService = new AdminService();
```
