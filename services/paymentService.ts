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
    return apiClient.post('/functions/v1/payment-process', { action: 'create-intent', amount, currency });
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

    return apiClient.post('/functions/v1/payment-process', { action: 'initialize', ...data });
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
    let endpoint = '/functions/v1/transactions';
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
    return apiClient.get<Transaction>(`/functions/v1/transactions/${encodeURIComponent(transactionId)}`);
  }

  // Confirm transaction
  async confirmTransaction(transactionId: string): Promise<ApiResponse<Transaction>> {
    return apiClient.post<Transaction>(`/functions/v1/payment-process/transactions/${encodeURIComponent(transactionId)}/confirm`, {});
  }

  // Request refund
  async requestRefund(transactionId: string, reason: string): Promise<ApiResponse<{
    refundId: string;
    status: string;
    message: string;
  }>> {
    return apiClient.post(`/functions/v1/payment-process/transactions/${encodeURIComponent(transactionId)}/refund`, { reason });
  }

  // Get payment methods (using profile endpoint from backend)
  async getPaymentMethods(): Promise<ApiResponse<Array<{
    id: string;
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
    return apiClient.get('/functions/v1/account/payment-methods');
  }

  // Add payment method (using profile endpoint from backend)
  async addPaymentMethod(data: {
    type: 'CARD' | 'BANK_TRANSFER';
    accountNumber?: string;
    bankCode?: string;
    accountName?: string;
    isDefault?: boolean;
  }): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post('/functions/v1/account/payment-methods', data);
  }

  // Remove payment method (using profile endpoint from backend)
  async removePaymentMethod(paymentMethodId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete(`/functions/v1/account/payment-methods/${encodeURIComponent(paymentMethodId)}`);
  }

  // Set default payment method (using profile endpoint from backend)
  async setDefaultPaymentMethod(paymentMethodId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.put(`/functions/v1/account/payment-methods/${encodeURIComponent(paymentMethodId)}`, { isDefault: true });
  }

  // Process toll payment
  async processTollPayment(tollData: {
    tollGateId: string;
    vehicleType: string;
    amount: number;
    paymentMethodId: string;
  }): Promise<ApiResponse<Transaction>> {
    return apiClient.post<Transaction>('/functions/v1/payment-process', { action: 'toll-payment', ...tollData });
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
    void filters;
    return Promise.resolve({
      success: false,
      error: 'Toll payment history is unavailable because toll payment storage is not configured.',
    });
  }
}

export const paymentService = new PaymentService();
