
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
// Admin Service
// Handles admin operations and management API calls

import { apiClient, ApiResponse } from './api';
import { authService } from './authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AdminService {
  // Get dashboard statistics
  async getDashboardStats(): Promise<ApiResponse<{
    totalUsers: number;
    totalOrders: number;
    totalRevenue: number;
    activeDrivers: number;
    activeMerchants: number;
    pendingKYC: number;
    pendingEscrow: number;
    reportedContent: number;
  }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.get('/api/admin/dashboard/stats', {
      Authorization: `Bearer ${token}`,
    });
  }

  // Get all users with filters
  async getUsers(filters?: {
    role?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{
    users: Array<any>;
    total: number;
  }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    let endpoint = '/api/admin/users';
    const queryParams = new URLSearchParams();
    
    if (filters) {
      if (filters.role) queryParams.append('role', filters.role);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.offset) queryParams.append('offset', filters.offset.toString());
    }
    
    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`;
    }

    return apiClient.get(endpoint, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Get pending KYC verifications
  async getPendingKYC(filters?: {
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{
    submissions: Array<any>;
    total: number;
  }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    let endpoint = '/api/admin/kyc/pending';
    const queryParams = new URLSearchParams();
    
    if (filters) {
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.offset) queryParams.append('offset', filters.offset.toString());
    }
    
    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`;
    }

    return apiClient.get(endpoint, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Approve KYC
  async approveKYC(kycId: string): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.put(`/api/admin/kyc/${kycId}/approve`, {}, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Reject KYC
  async rejectKYC(kycId: string, reason: string): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.put(`/api/admin/kyc/${kycId}/reject`, { reason }, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Get escrow transactions
  async getEscrowTransactions(filters?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{
    transactions: Array<any>;
    total: number;
  }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    let endpoint = '/api/admin/escrow/transactions';
    const queryParams = new URLSearchParams();
    
    if (filters) {
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.offset) queryParams.append('offset', filters.offset.toString());
    }
    
    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`;
    }

    return apiClient.get(endpoint, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Release escrow
  async releaseEscrow(transactionId: string): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post(`/api/admin/escrow/${transactionId}/release`, {}, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Get reported content
  async getReportedContent(filters?: {
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{
    reports: Array<any>;
    total: number;
  }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    let endpoint = '/api/admin/moderation/reports';
    const queryParams = new URLSearchParams();
    
    if (filters) {
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.offset) queryParams.append('offset', filters.offset.toString());
    }
    
    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`;
    }

    return apiClient.get(endpoint, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Take moderation action
  async moderateContent(reportId: string, action: 'approve' | 'remove' | 'warn', reason?: string): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post(`/api/admin/moderation/${reportId}/${action}`, { reason }, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Suspend user
  async suspendUser(userId: string, reason: string, duration?: number): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post(`/api/admin/users/${userId}/suspend`, { reason, duration }, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Unsuspend user
  async unsuspendUser(userId: string): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.delete(`/api/admin/users/${userId}/suspend`, {
      Authorization: `Bearer ${token}`,
    });
  }
}

export const adminService = new AdminService();
