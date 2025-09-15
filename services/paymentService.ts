// Payment Service
// Handles payment processing and transaction management

import { apiClient, ApiResponse } from './api';
import { authService } from './authService';
import { Transaction, PaymentRequest } from './types';

class PaymentService {
  // Create payment intent for Stripe
  async createPaymentIntent(amount: number, currency: string = 'usd'): Promise<ApiResponse<{
    clientSecret: string;
    paymentIntentId: string;
  }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post('/api/payments/create-intent', { amount, currency }, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Process payment
  async processPayment(paymentData: PaymentRequest): Promise<ApiResponse<{
    transactionId: string;
    status: 'success' | 'failed' | 'pending';
    message: string;
  }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post('/api/payments/process', paymentData, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Get user transactions
  async getTransactions(filters?: {
    type?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{
    transactions: Transaction[];
    total: number;
    summary: {
      totalSpent: number;
      totalRefunds: number;
      totalRewards: number;
    };
  }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    let endpoint = '/api/transactions';
    const queryParams = new URLSearchParams();
    
    if (filters) {
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
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

  // Get transaction by ID
  async getTransaction(transactionId: string): Promise<ApiResponse<Transaction>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.get<Transaction>(`/api/transactions/${transactionId}`, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Request refund
  async requestRefund(transactionId: string, reason: string): Promise<ApiResponse<{
    refundId: string;
    status: string;
    message: string;
  }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post(`/api/transactions/${transactionId}/refund`, { reason }, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Get payment methods
  async getPaymentMethods(): Promise<ApiResponse<Array<{
    id: string;
    type: 'card' | 'bank' | 'wallet';
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
    isDefault: boolean;
  }>>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.get('/api/payments/methods', {
      Authorization: `Bearer ${token}`,
    });
  }

  // Add payment method
  async addPaymentMethod(paymentMethodId: string): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post('/api/payments/methods', { paymentMethodId }, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Remove payment method
  async removePaymentMethod(paymentMethodId: string): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.delete(`/api/payments/methods/${paymentMethodId}`, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Set default payment method
  async setDefaultPaymentMethod(paymentMethodId: string): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.put(`/api/payments/methods/${paymentMethodId}/default`, {}, {
      Authorization: `Bearer ${token}`,
    });
  }
}

export const paymentService = new PaymentService();
// Payment Service
// Handles payment processing and transaction management

import { apiClient, ApiResponse } from './api';
import { authService } from './authService';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'wallet' | 'cash';
  name: string;
  details: string;
  isDefault: boolean;
  last4?: string;
  expiryDate?: string;
  brand?: string;
}

export interface Transaction {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  paymentMethod: PaymentMethod;
  description: string;
  createdAt: string;
  completedAt?: string;
  reference: string;
  fees?: number;
}

export interface PaymentRequest {
  orderId: string;
  amount: number;
  currency?: string;
  paymentMethodId: string;
  description?: string;
}

class PaymentService {
  // Get user payment methods
  async getPaymentMethods(): Promise<ApiResponse<PaymentMethod[]>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.get<PaymentMethod[]>('/api/payments/methods', {
      Authorization: `Bearer ${token}`,
    });
  }

  // Add new payment method
  async addPaymentMethod(paymentData: {
    type: 'card' | 'bank' | 'wallet';
    cardNumber?: string;
    expiryMonth?: string;
    expiryYear?: string;
    cvv?: string;
    cardholderName?: string;
    bankCode?: string;
    accountNumber?: string;
    walletProvider?: string;
    walletId?: string;
  }): Promise<ApiResponse<PaymentMethod>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post<PaymentMethod>('/api/payments/methods', paymentData, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Process payment
  async processPayment(paymentRequest: PaymentRequest): Promise<ApiResponse<Transaction>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post<Transaction>('/api/payments/process', paymentRequest, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Verify payment
  async verifyPayment(transactionId: string): Promise<ApiResponse<Transaction>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.get<Transaction>(`/api/payments/verify/${transactionId}`, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Get transaction history
  async getTransactions(filters?: {
    status?: string;
    fromDate?: string;
    toDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{
    transactions: Transaction[];
    total: number;
  }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    let endpoint = '/api/payments/transactions';
    const queryParams = new URLSearchParams();
    
    if (filters) {
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.fromDate) queryParams.append('fromDate', filters.fromDate);
      if (filters.toDate) queryParams.append('toDate', filters.toDate);
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

  // Request refund
  async requestRefund(transactionId: string, reason: string): Promise<ApiResponse<Transaction>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post<Transaction>(`/api/payments/refund/${transactionId}`, 
      { reason }, 
      { Authorization: `Bearer ${token}` }
    );
  }

  // Delete payment method
  async deletePaymentMethod(paymentMethodId: string): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.delete(`/api/payments/methods/${paymentMethodId}`, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Set default payment method
  async setDefaultPaymentMethod(paymentMethodId: string): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.put(`/api/payments/methods/${paymentMethodId}/default`, {}, {
      Authorization: `Bearer ${token}`,
    });
  }
}

export const paymentService = new PaymentService();
