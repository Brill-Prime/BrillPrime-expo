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
// Admin Service
// Handles admin operations and management API calls

import { apiClient, ApiResponse } from './api';
import { authService } from './authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Placeholder functions for existing methods
const getUsers = async () => ({ success: false, error: 'Not implemented' });
const updateUserRole = async () => ({ success: false, error: 'Not implemented' });
const getUserById = async () => ({ success: false, error: 'Not implemented' });
const getSystemMetrics = async () => ({ success: false, error: 'Not implemented' });
const getDashboardStats = async () => ({ success: false, error: 'Not implemented' });

// Helper function for handling API errors
const handleApiError = (error: any): ApiResponse<any> => {
  console.error('API Error:', error);
  let errorMessage = 'An unknown error occurred';
  if (error.response && error.response.data && error.response.data.message) {
    errorMessage = error.response.data.message;
  } else if (error.message) {
    errorMessage = error.message;
  }
  return { success: false, error: errorMessage };
};

// Mock apiClient and api for demonstration purposes
const api = {
  get: async (url: string, config?: any) => {
    console.log(`Mock GET request to ${url}`);
    // Simulate API response
    if (url === '/admin/system/health') {
      return { data: { status: 'ok', load: 'low' } };
    }
    throw new Error('Not found');
  },
  post: async (url: string, data?: any, config?: any) => {
    console.log(`Mock POST request to ${url} with data:`, data);
    // Simulate API response
    if (url === '/admin/system/maintenance') {
      return { data: { message: `Maintenance mode ${data.enabled ? 'enabled' : 'disabled'}` } };
    }
    if (url === '/admin/system/backup') {
      return { data: { message: 'Backup created successfully' } };
    }
    throw new Error('Not found');
  },
  put: async (url: string, data?: any, config?: any) => ({ data: {} }),
  delete: async (url: string, config?: any) => ({ data: {} }),
};

// New admin service methods
const toggleSystemMaintenance = async (enabled: boolean): Promise<ApiResponse<any>> => {
    try {
      const response = await api.post('/admin/system/maintenance', { enabled });
      return { success: true, data: response.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  const getSystemHealth = async (): Promise<ApiResponse<any>> => {
    try {
      const response = await api.get('/admin/system/health');
      return { success: true, data: response.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

  const createBackup = async (): Promise<ApiResponse<any>> => {
    try {
      const response = await api.post('/admin/system/backup');
      return { success: true, data: response.data };
    } catch (error) {
      return handleApiError(error);
    }
  };

export const adminService = {
  getUsers,
  updateUserRole,
  getUserById,
  getSystemMetrics,
  getDashboardStats,
  toggleSystemMaintenance,
  getSystemHealth,
  createBackup,
};