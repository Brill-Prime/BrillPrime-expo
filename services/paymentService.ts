// Payment Service
// Handles payment processing and transaction management

import { apiClient, ApiResponse } from './api';
import { Transaction, PaymentRequest } from './types';

class PaymentService {
  // Create payment intent for Stripe
  async createPaymentIntent(amount: number, currency: string = 'usd'): Promise<ApiResponse<{
    clientSecret: string;
    paymentIntentId: string;
  }>> {
    return apiClient.post('/api/payments/create-intent', { amount, currency });
  }

  // Validate payment data
  private validatePaymentData = (paymentData: PaymentRequest): { isValid: boolean; error?: string } => {
    if (!paymentData.orderId) {
      return { isValid: false, error: 'Order ID is required' };
    }

    if (!paymentData.amount || paymentData.amount <= 0) {
      return { isValid: false, error: 'Valid payment amount is required' };
    }

    if (paymentData.amount > 10000000) {
      return { isValid: false, error: 'Payment amount exceeds maximum limit (₦10,000,000)' };
    }

    const validPaymentMethods = ['card', 'wallet', 'cash'];
    if (!validPaymentMethods.includes(paymentData.paymentMethod)) {
      return { isValid: false, error: 'Invalid payment method' };
    }

    return { isValid: true };
  }

  // Initialize payment (updated to match backend)
  async initializePayment(data: {
    orderId: number;
    amount: number;
    paymentMethod: 'CARD' | 'BANK_TRANSFER';
  }): Promise<ApiResponse<{
    transactionId: string;
    status: 'success' | 'failed' | 'pending';
    message: string;
  }>> {
    if (data.amount <= 0) {
      return { success: false, error: 'Valid payment amount is required' };
    }

    if (data.amount > 10000000) {
      return { success: false, error: 'Payment amount exceeds maximum limit (₦10,000,000)' };
    }

    const validPaymentMethods = ['CARD', 'BANK_TRANSFER'];
    if (!validPaymentMethods.includes(data.paymentMethod)) {
      return { success: false, error: 'Invalid payment method. Use CARD or BANK_TRANSFER only.' };
    }

    return apiClient.post('/api/payments/initialize', data);
  }

  // Get payment history (updated to match backend endpoint)
  async getPaymentHistory(filters?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{
    payments: Transaction[];
    total: number;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>> {
    let endpoint = '/api/payments/history';
    const queryParams = new URLSearchParams();

    if (filters) {
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
    }

    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`;
    }

    return apiClient.get(endpoint);
  }

  // Get transaction by ID
  async getTransaction(transactionId: string): Promise<ApiResponse<Transaction>> {
    return apiClient.get<Transaction>(`/api/transactions/${transactionId}`);
  }

  // Confirm transaction
  async confirmTransaction(transactionId: string): Promise<ApiResponse<Transaction>> {
    return apiClient.post<Transaction>(`/api/transactions/${transactionId}/confirm`, {});
  }

  // Request refund
  async requestRefund(transactionId: string, reason: string): Promise<ApiResponse<{
    refundId: string;
    status: string;
    message: string;
  }>> {
    return apiClient.post(`/api/transactions/${transactionId}/refund`, { reason });
  }

  // Get payment methods (using profile endpoint from backend)
  async getPaymentMethods(): Promise<ApiResponse<Array<{
    id: number;
    type: 'CARD' | 'BANK_TRANSFER';
    accountNumber?: string;
    bankCode?: string;
    accountName?: string;
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
    isDefault: boolean;
  }>>> {
    // Backend endpoint is /api/profile/payment-methods
    return apiClient.get('/api/profile/payment-methods');
  }

  // Add payment method (using profile endpoint from backend)
  async addPaymentMethod(data: {
    type: 'CARD' | 'BANK_TRANSFER';
    accountNumber?: string;
    bankCode?: string;
    accountName?: string;
    isDefault?: boolean;
  }): Promise<ApiResponse<{ message: string }>> {
    // Backend endpoint is /api/profile/payment-methods
    return apiClient.post('/api/profile/payment-methods', data);
  }

  // Remove payment method (using profile endpoint from backend)
  async removePaymentMethod(paymentMethodId: string): Promise<ApiResponse<{ message: string }>> {
    // Backend endpoint is /api/profile/payment-methods/:id
    return apiClient.delete(`/api/profile/payment-methods/${paymentMethodId}`);
  }

  // Set default payment method (using profile endpoint from backend)
  async setDefaultPaymentMethod(paymentMethodId: string): Promise<ApiResponse<{ message: string }>> {
    // Backend endpoint is /api/profile/payment-methods/:id with isDefault: true
    return apiClient.put(`/api/profile/payment-methods/${paymentMethodId}`, { isDefault: true });
  }

  // Process toll payment
  async processTollPayment(tollData: {
    tollGateId: string;
    vehicleType: string;
    amount: number;
    paymentMethodId: string;
  }): Promise<ApiResponse<Transaction>> {
    return apiClient.post<Transaction>('/api/toll-payments', tollData);
  }

  // Get toll payment history
  async getTollPayments(filters?: {
    fromDate?: string;
    toDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{
    payments: Transaction[];
    total: number;
  }>> {
    let endpoint = '/api/toll-payments';
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

    return apiClient.get(endpoint);
  }
}

export const paymentService = new PaymentService();
