import { supabase } from '../config/supabase';
import { authService } from './authService';
import { apiClient, ApiResponse } from './api';

// Response type for consistency
type SupabaseResponse<T> = { data: T | null; error: any };

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
  async getSystemMetrics(): Promise<SupabaseResponse<SystemMetrics>> {
    if (!supabase) {
      return { data: null, error: 'Supabase not available' };
    }

    try {
      // Get user counts
      const { count: totalUsers, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get active merchants
      const { count: activeMerchants, error: merchantsError } = await supabase
        .from('merchants')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get pending KYC
      const { count: pendingKYC, error: kycError } = await supabase
        .from('kyc_documents')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Get escrow transactions
      const { count: pendingEscrow, error: escrowError } = await supabase
        .from('escrow_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'held');

      // Get today's transactions
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayTransactions, error: todayError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Get total transactions
      const { count: totalTransactions, error: totalError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // Get disputed transactions
      const { count: disputedTransactions, error: disputedError } = await supabase
        .from('escrow_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'disputed');

      if (usersError || merchantsError || kycError || escrowError || todayError || totalError || disputedError) {
        return { data: null, error: 'Failed to fetch system metrics' };
      }

      const metrics: SystemMetrics = {
        platform: {
          totalUsers: totalUsers || 0,
          activeUsers: totalUsers || 0, // Simplified - could be based on recent activity
          onlineDrivers: 0, // Would need driver location tracking
          activeMerchants: activeMerchants || 0,
          systemUptime: 99.9, // Placeholder
          serverHealth: 'healthy',
          pendingKYC: pendingKYC || 0,
          pendingEscrow: pendingEscrow || 0,
          reportedContent: 0, // Would need content reports table
        },
        transactions: {
          totalTransactions: totalTransactions || 0,
          todayTransactions: todayTransactions || 0,
          pendingTransactions: pendingEscrow || 0,
          disputedTransactions: disputedTransactions || 0,
          totalVolume: 0, // Would need to sum order amounts
          escrowBalance: 0, // Would need to sum escrow amounts
        },
        security: {
          fraudAlerts: 0,
          suspiciousActivities: 0,
          blockedUsers: 0,
          securityIncidents: 0,
        },
      };

      return { data: metrics, error: null };
    } catch (error) {
      console.error('Error fetching system metrics:', error);
      return { data: null, error: 'Failed to fetch system metrics' };
    }
  }

  async getAnalytics(timeframe: Timeframe): Promise<SupabaseResponse<AdminAnalytics>> {
    if (!supabase) {
      return { data: null, error: 'Supabase not available' };
    }

    try {
      const now = new Date();
      let startDate: Date;

      switch (timeframe) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Get user analytics
      const { count: totalUsers, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      const { count: newUsers, error: newUsersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      // Get transaction analytics
      const { count: totalTransactions, error: transactionsError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      const { count: periodTransactions, error: periodTransactionsError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

      if (usersError || newUsersError || transactionsError || periodTransactionsError) {
        return { data: null, error: 'Failed to fetch analytics' };
      }

      const analytics: AdminAnalytics = {
        revenue: {
          total: 0, // Would need to sum payment amounts
          daily: 0,
          weekly: 0,
          monthly: 0,
          growth: 0,
        },
        users: {
          total: totalUsers || 0,
          active: totalUsers || 0, // Simplified
          new: newUsers || 0,
          retention: 85, // Placeholder
        },
        transactions: {
          total: totalTransactions || 0,
          successful: totalTransactions || 0, // Simplified
          failed: 0,
          pending: 0,
          averageValue: 0, // Would need to calculate average
        },
      };

      return { data: analytics, error: null };
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      return { data: null, error: 'Failed to fetch analytics' };
    }
  }

  // User Management
  async getUsers(filters: {
    role?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<SupabaseResponse<{ users: User[]; total: number }>> {
    if (!supabase) {
      return { data: null, error: 'Supabase not available' };
    }

    try {
      let query = supabase
        .from('users')
        .select('id, email, name, role, status, created_at, last_login', { count: 'exact' });

      if (filters.role) {
        query = query.eq('role', filters.role);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.search) {
        query = query.or(`email.ilike.%${filters.search}%,name.ilike.%${filters.search}%`);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      const users: User[] = (data || []).map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        createdAt: user.created_at,
        lastLogin: user.last_login,
      }));

      return { data: { users, total: count || 0 }, error: null };
    } catch (error) {
      console.error('Failed to fetch users:', error);
      return { data: null, error: 'Failed to fetch users' };
    }
  }

  async toggleUserBlock(
    userId: string,
    blocked: boolean,
    reason?: string,
  ): Promise<SupabaseResponse<{ message: string }>> {
    if (!supabase) {
      return { data: null, error: 'Supabase not available' };
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({
          status: blocked ? 'banned' : 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        return { data: null, error: error.message };
      }

      // Log the action if reason provided
      if (reason) {
        await supabase
          .from('admin_logs')
          .insert({
            action: blocked ? 'block_user' : 'unblock_user',
            target_user_id: userId,
            reason,
            admin_id: (await authService.getCurrentUser())?.id,
          });
      }

      return { data: { message: `User ${blocked ? 'blocked' : 'unblocked'} successfully` }, error: null };
    } catch (error) {
      console.error('Failed to update user block status:', error);
      return { data: null, error: 'Failed to update user block status' };
    }
  }

  async suspendUser(
    userId: string,
    reason: string,
    duration?: number,
  ): Promise<SupabaseResponse<{ message: string }>> {
    if (!supabase) {
      return { data: null, error: 'Supabase not available' };
    }

    try {
      const suspensionEnd = duration ? new Date(Date.now() + duration * 60 * 1000).toISOString() : null;

      const { error } = await supabase
        .from('users')
        .update({
          status: 'suspended',
          suspension_end: suspensionEnd,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        return { data: null, error: error.message };
      }

      // Log the suspension
      await supabase
        .from('admin_logs')
        .insert({
          action: 'suspend_user',
          target_user_id: userId,
          reason,
          duration,
          admin_id: (await authService.getCurrentUser())?.id,
        });

      return { data: { message: 'User suspended successfully' }, error: null };
    } catch (error) {
      console.error('Failed to suspend user:', error);
      return { data: null, error: 'Failed to suspend user' };
    }
  }

  async unsuspendUser(userId: string): Promise<SupabaseResponse<{ message: string }>> {
    if (!supabase) {
      return { data: null, error: 'Supabase not available' };
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({
          status: 'active',
          suspension_end: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        return { data: null, error: error.message };
      }

      // Log the unsuspension
      await supabase
        .from('admin_logs')
        .insert({
          action: 'unsuspend_user',
          target_user_id: userId,
          admin_id: (await authService.getCurrentUser())?.id,
        });

      return { data: { message: 'User unsuspended successfully' }, error: null };
    } catch (error) {
      console.error('Failed to unsuspend user:', error);
      return { data: null, error: 'Failed to unsuspend user' };
    }
  }

  // KYC Management
  async getPendingKYC(filters: {
    limit?: number;
    offset?: number;
  } = {}): Promise<SupabaseResponse<{ submissions: KYCSubmission[]; total: number }>> {
    if (!supabase) {
      return { data: null, error: 'Supabase not available' };
    }

    try {
      let query = supabase
        .from('kyc_documents')
        .select(`
          id,
          user_id,
          status,
          type,
          submitted_at,
          reviewed_at,
          reviewer_id,
          documents
        `, { count: 'exact' })
        .eq('status', 'pending');

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      const submissions: KYCSubmission[] = (data || []).map(kyc => ({
        id: kyc.id,
        userId: kyc.user_id,
        status: kyc.status,
        type: kyc.type,
        submittedAt: kyc.submitted_at,
        reviewedAt: kyc.reviewed_at,
        reviewerId: kyc.reviewer_id,
        documents: kyc.documents || [],
      }));

      return { data: { submissions, total: count || 0 }, error: null };
    } catch (error) {
      console.error('Failed to fetch pending KYC submissions:', error);
      return { data: null, error: 'Failed to fetch pending KYC submissions' };
    }
  }

  async approveKYC(kycId: string): Promise<SupabaseResponse<{ message: string }>> {
    if (!supabase) {
      return { data: null, error: 'Supabase not available' };
    }

    try {
      const { error } = await supabase
        .from('kyc_documents')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewer_id: (await authService.getCurrentUser())?.id,
        })
        .eq('id', kycId);

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: { message: 'KYC approved successfully' }, error: null };
    } catch (error) {
      console.error('Failed to approve KYC:', error);
      return { data: null, error: 'Failed to approve KYC' };
    }
  }

  async rejectKYC(kycId: string, reason: string): Promise<SupabaseResponse<{ message: string }>> {
    if (!supabase) {
      return { data: null, error: 'Supabase not available' };
    }

    try {
      const { error } = await supabase
        .from('kyc_documents')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewer_id: (await authService.getCurrentUser())?.id,
          rejection_reason: reason,
        })
        .eq('id', kycId);

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: { message: 'KYC rejected successfully' }, error: null };
    } catch (error) {
      console.error('Failed to reject KYC:', error);
      return { data: null, error: 'Failed to reject KYC' };
    }
  }

  // Escrow Management
  async getEscrowTransactions(filters: {
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<SupabaseResponse<{ transactions: EscrowTransaction[]; total: number }>> {
    if (!supabase) {
      return { data: null, error: 'Supabase not available' };
    }

    try {
      let query = supabase
        .from('escrow_transactions')
        .select(`
          id,
          order_id,
          amount,
          status,
          created_at,
          updated_at,
          release_date,
          merchant_id,
          customer_id
        `, { count: 'exact' });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      const transactions: EscrowTransaction[] = (data || []).map(tx => ({
        id: tx.id,
        orderId: tx.order_id,
        amount: tx.amount,
        status: tx.status,
        createdAt: tx.created_at,
        updatedAt: tx.updated_at,
        releaseDate: tx.release_date,
        merchantId: tx.merchant_id,
        merchantName: '', // Would need to join with users table
        customerId: tx.customer_id,
        customerName: '', // Would need to join with users table
      }));

      return { data: { transactions, total: count || 0 }, error: null };
    } catch (error) {
      console.error('Failed to fetch escrow transactions:', error);
      return { data: null, error: 'Failed to fetch escrow transactions' };
    }
  }

  async releaseEscrow(transactionId: string): Promise<SupabaseResponse<{ message: string }>> {
    if (!supabase) {
      return { data: null, error: 'Supabase not available' };
    }

    try {
      const { error } = await supabase
        .from('escrow_transactions')
        .update({
          status: 'released',
          updated_at: new Date().toISOString(),
          release_date: new Date().toISOString(),
        })
        .eq('id', transactionId);

      if (error) {
        return { data: null, error: error.message };
      }

      // Log the action
      await supabase
        .from('admin_logs')
        .insert({
          action: 'release_escrow',
          target_transaction_id: transactionId,
          admin_id: (await authService.getCurrentUser())?.id,
        });

      return { data: { message: 'Escrow released successfully' }, error: null };
    } catch (error) {
      console.error('Failed to release escrow:', error);
      return { data: null, error: 'Failed to release escrow' };
    }
  }

  // Content Moderation
  async getReportedContent(filters: {
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<SupabaseResponse<{ reports: ContentReport[]; total: number }>> {
    if (!supabase) {
      return { data: null, error: 'Supabase not available' };
    }

    try {
      let query = supabase
        .from('content_reports')
        .select(`
          id,
          type,
          reason,
          status,
          reported_at,
          resolved_at,
          moderator_id,
          content,
          reporter_id
        `, { count: 'exact' });

      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      const reports: ContentReport[] = (data || []).map(report => ({
        id: report.id,
        type: report.type,
        reason: report.reason,
        status: report.status,
        reportedAt: report.reported_at,
        resolvedAt: report.resolved_at,
        moderatorId: report.moderator_id,
        content: report.content,
        reporter: {
          id: report.reporter_id,
          name: '', // Would need to join with users table
        },
      }));

      return { data: { reports, total: count || 0 }, error: null };
    } catch (error) {
      console.error('Failed to fetch reported content:', error);
      return { data: null, error: 'Failed to fetch reported content' };
    }
  }

  async moderateContent(
    reportId: string,
    action: 'approve' | 'remove' | 'warn',
    reason?: string,
  ): Promise<SupabaseResponse<{ message: string }>> {
    if (!supabase) {
      return { data: null, error: 'Supabase not available' };
    }

    try {
      const statusMap = {
        approve: 'resolved',
        remove: 'resolved',
        warn: 'reviewed',
      };

      const { error } = await supabase
        .from('content_reports')
        .update({
          status: statusMap[action],
          resolved_at: new Date().toISOString(),
          moderator_id: (await authService.getCurrentUser())?.id,
          moderation_reason: reason,
        })
        .eq('id', reportId);

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: { message: `Content ${action}d successfully` }, error: null };
    } catch (error) {
      console.error(`Failed to ${action} content:`, error);
      return { data: null, error: `Failed to ${action} content` };
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
