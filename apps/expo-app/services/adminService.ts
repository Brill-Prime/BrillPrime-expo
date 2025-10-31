import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, type ApiResponse } from './api';
import { authService } from './authService';

// Types
type Timeframe = 'day' | 'week' | 'month' | 'year';
type ReportType = 'transactions' | 'users' | 'analytics';
type ReportFormat = 'csv' | 'pdf';
type Priority = 'low' | 'medium' | 'high';
type TargetAudience = 'all' | 'consumers' | 'merchants' | 'drivers';

// Interfaces
export interface SystemMetrics {
  platform: {
    totalUsers: number;
    activeUsers: number;
    onlineDrivers: number;
    activeMerchants: number;
    systemUptime: number;
    serverHealth: string;
    pendingKYC: number;
    pendingEscrow: number;
    reportedContent: number;
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
    pending: number;
    averageValue: number;
  };
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: 'active' | 'suspended' | 'banned';
  createdAt: string;
  lastLogin?: string;
}

interface KYCSubmission {
  id: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  type: 'individual' | 'business';
  submittedAt: string;
  reviewedAt?: string;
  reviewerId?: string;
  documents: Array<{
    type: string;
    url: string;
    status: 'pending' | 'verified' | 'rejected';
  }>;
}

interface EscrowTransaction {
  id: string;
  orderId: string;
  amount: number;
  status: 'pending' | 'released' | 'refunded' | 'disputed';
  createdAt: string;
  updatedAt: string;
  releaseDate?: string;
  merchantId: string;
  merchantName: string;
  customerId: string;
  customerName: string;
}

interface ContentReport {
  id: string;
  type: 'user' | 'product' | 'comment' | 'review';
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved';
  reportedAt: string;
  resolvedAt?: string;
  moderatorId?: string;
  content: any;
  reporter: {
    id: string;
    name: string;
  };
}


class AdminService {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await authService.getToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    return { Authorization: `Bearer ${token}` };
  }

  // System Metrics & Analytics
  async getSystemMetrics(): Promise<ApiResponse<SystemMetrics>> {
    try {
      const headers = await this.getAuthHeaders();
      return await apiClient.get('/api/admin/metrics', headers);
    } catch (error) {
      console.error('Error fetching system metrics:', error);
      return { success: false, error: 'Failed to fetch system metrics' };
    }
  }

  async getAnalytics(timeframe: Timeframe): Promise<ApiResponse<AdminAnalytics>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await apiClient.get<AdminAnalytics>(
        `/api/admin/analytics?timeframe=${timeframe}`,
        headers
      );
      if (!response.success) {
        return { success: false, error: response.error };
      }
      return { success: true, data: response.data! };
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch analytics',
      };
    }
  }

  // User Management
  async getUsers(filters: {
    role?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<ApiResponse<{ users: User[]; total: number }>> {
    try {
      const headers = await this.getAuthHeaders();
      const queryParams = new URLSearchParams();

      if (filters.role) queryParams.append('role', filters.role);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.offset) queryParams.append('offset', filters.offset.toString());

      const endpoint = `/api/admin/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await apiClient.get<{ users: User[]; total: number }>(endpoint, headers);

      if (!response.success) {
        return { success: false, error: response.error };
      }

      return { success: true, data: response.data! };
    } catch (error) {
      console.error('Failed to fetch users:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch users',
      };
    }
  }

  async toggleUserBlock(
    userId: string,
    blocked: boolean,
    reason?: string,
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await apiClient.post<{ message: string }>(
        `/api/admin/users/${userId}/block`,
        { blocked, reason },
        headers,
      );

      if (!response.success) {
        return { success: false, error: response.error };
      }

      return { success: true, data: response.data! };
    } catch (error) {
      console.error('Failed to update user block status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update user block status',
      };
    }
  }

  async suspendUser(
    userId: string,
    reason: string,
    duration?: number,
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await apiClient.post<{ message: string }>(
        `/api/admin/users/${userId}/suspend`,
        { reason, duration },
        headers,
      );

      if (!response.success) {
        return { success: false, error: response.error };
      }

      return { success: true, data: response.data! };
    } catch (error) {
      console.error('Failed to suspend user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to suspend user',
      };
    }
  }

  async unsuspendUser(userId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await apiClient.delete<{ message: string }>(
        `/api/admin/users/${userId}/suspend`,
        headers,
      );

      if (!response.success) {
        return { success: false, error: response.error };
      }

      return { success: true, data: response.data! };
    } catch (error) {
      console.error('Failed to unsuspend user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to unsuspend user',
      };
    }
  }

  // KYC Management
  async getPendingKYC(filters: {
    limit?: number;
    offset?: number;
  } = {}): Promise<ApiResponse<{ submissions: KYCSubmission[]; total: number }>> {
    try {
      const headers = await this.getAuthHeaders();
      const queryParams = new URLSearchParams();

      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.offset) queryParams.append('offset', filters.offset.toString());

      const endpoint = `/api/admin/kyc/pending${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await apiClient.get<{ submissions: KYCSubmission[]; total: number }>(
        endpoint,
        headers,
      );

      if (!response.success) {
        return { success: false, error: response.error };
      }

      return { success: true, data: response.data! };
    } catch (error) {
      console.error('Failed to fetch pending KYC submissions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch pending KYC submissions',
      };
    }
  }

  async approveKYC(kycId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await apiClient.put<{ message: string }>(
        `/api/admin/kyc/${kycId}/approve`,
        {},
        headers,
      );

      if (!response.success) {
        return { success: false, error: response.error };
      }

      return { success: true, data: response.data! };
    } catch (error) {
      console.error('Failed to approve KYC:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to approve KYC',
      };
    }
  }

  async rejectKYC(kycId: string, reason: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await apiClient.put<{ message: string }>(
        `/api/admin/kyc/${kycId}/reject`,
        { reason },
        headers,
      );

      if (!response.success) {
        return { success: false, error: response.error };
      }

      return { success: true, data: response.data! };
    } catch (error) {
      console.error('Failed to reject KYC:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reject KYC',
      };
    }
  }

  // Escrow Management
  async getEscrowTransactions(filters: {
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<ApiResponse<{ transactions: EscrowTransaction[]; total: number }>> {
    try {
      const headers = await this.getAuthHeaders();
      const queryParams = new URLSearchParams();

      if (filters.status) queryParams.append('status', filters.status);
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.offset) queryParams.append('offset', filters.offset.toString());

      const endpoint = `/api/admin/escrow/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await apiClient.get<{ transactions: EscrowTransaction[]; total: number }>(
        endpoint,
        headers,
      );

      if (!response.success) {
        return { success: false, error: response.error };
      }

      return { success: true, data: response.data! };
    } catch (error) {
      console.error('Failed to fetch escrow transactions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch escrow transactions',
      };
    }
  }

  async releaseEscrow(transactionId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await apiClient.post<{ message: string }>(
        `/api/admin/escrow/${transactionId}/release`,
        {},
        headers,
      );

      if (!response.success) {
        return { success: false, error: response.error };
      }

      return { success: true, data: response.data! };
    } catch (error) {
      console.error('Failed to release escrow:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to release escrow',
      };
    }
  }

  // Content Moderation
  async getReportedContent(filters: {
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<ApiResponse<{ reports: ContentReport[]; total: number }>> {
    try {
      const headers = await this.getAuthHeaders();
      const queryParams = new URLSearchParams();

      if (filters.type) queryParams.append('type', filters.type);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.offset) queryParams.append('offset', filters.offset.toString());

      const endpoint = `/api/admin/moderation/reports${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await apiClient.get<{ reports: ContentReport[]; total: number }>(
        endpoint,
        headers,
      );

      if (!response.success) {
        return { success: false, error: response.error };
      }

      return { success: true, data: response.data! };
    } catch (error) {
      console.error('Failed to fetch reported content:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch reported content',
      };
    }
  }

  async moderateContent(
    reportId: string,
    action: 'approve' | 'remove' | 'warn',
    reason?: string,
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await apiClient.post<{ message: string }>(
        `/api/admin/moderation/${reportId}/${action}`,
        { reason },
        headers,
      );

      if (!response.success) {
        return { success: false, error: response.error };
      }

      return { success: true, data: response.data! };
    } catch (error) {
      console.error(`Failed to ${action} content:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : `Failed to ${action} content`,
      };
    }
  }

  // Announcements
  async sendAnnouncement(data: {
    title: string;
    message: string;
    targetAudience: TargetAudience;
    priority: Priority;
  }): Promise<ApiResponse<{ sent: number }>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await apiClient.post<{ sent: number }>(
        '/api/admin/announcements',
        data,
        headers,
      );

      if (!response.success) {
        return { success: false, error: response.error };
      }

      return { success: true, data: response.data! };
    } catch (error) {
      console.error('Failed to send announcement:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send announcement',
      };
    }
  }

  // Toggle maintenance mode
  async setMaintenanceMode(enabled: boolean, message?: string): Promise<ApiResponse<{ status: string }>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await apiClient.post<{ status: string }>(
        '/api/admin/maintenance',
        { enabled, message },
        headers,
      );

      if (!response.success) {
        return { success: false, error: response.error };
      }

      return { success: true, data: response.data! };
    } catch (error) {
      console.error('Failed to set maintenance mode:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set maintenance mode',
      };
    }
  }

  // Export reports
  async exportReport(type: ReportType, format: ReportFormat): Promise<ApiResponse<{ downloadUrl: string }>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await apiClient.post<{ downloadUrl: string }>(
        '/api/admin/reports/export',
        { type, format },
        headers,
      );

      if (!response.success) {
        return { success: false, error: response.error };
      }

      return { success: true, data: response.data! };
    } catch (error) {
      console.error('Failed to export report:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export report',
      };
    }
  }
}

export const adminService = new AdminService();
