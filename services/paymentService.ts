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
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post('/api/payments/create-intent', { amount, currency }, {
      Authorization: `Bearer ${token}`,
    });
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


  // Call Supabase Edge Function for payment processing
  async processPaymentViaFunction(data: {
    orderId: string;
    amount: number;
    paymentMethod: 'CARD' | 'BANK_TRANSFER';
    reference: string;
  }): Promise<ApiResponse<any>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    // Calls: https://lkfprjjlqmtpamukoatl.supabase.co/functions/v1/process-payment
    return apiClient.post(
      '/functions/v1/process-payment',
      data,
      { Authorization: `Bearer ${token}` }
    );
  }

  // Initialize Paystack payment using edge function
  async initializePaystackPayment(data: {
    email: string;
    amount: number;
    orderId: string;
    metadata?: Record<string, any>;
  }): Promise<ApiResponse<{
    authorization_url: string;
    access_code: string;
    reference: string;
  }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post(
      '/functions/v1/paystack-utils',
      {
        action: 'initialize',
        ...data
      },
      { Authorization: `Bearer ${token}` }
    );
  }

  // Verify Paystack payment using edge function
  async verifyPaystackPayment(reference: string): Promise<ApiResponse<{
    status: string;
    amount: number;
    reference: string;
    paid_at: string;
  }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post(
      '/functions/v1/paystack-utils',
      {
        action: 'verify',
        reference
      },
      { Authorization: `Bearer ${token}` }
    );
  }

  // Process refund via Paystack edge function
  async processPaystackRefund(data: {
    transaction: string;
    amount?: number;
  }): Promise<ApiResponse<any>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post(
      '/functions/v1/paystack-utils',
      {
        action: 'refund',
        ...data
      },
      { Authorization: `Bearer ${token}` }
    );
  }

    paymentMethod: 'CARD' | 'BANK_TRANSFER';
  }): Promise<ApiResponse<{
    transactionId: string;
    status: 'success' | 'failed' | 'pending';
    message: string;
  }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

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

    return apiClient.post('/api/payments/initialize', data, {
      Authorization: `Bearer ${token}`,
    });
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
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    let endpoint = '/api/payments/history';
    const queryParams = new URLSearchParams();

    if (filters) {
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
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

  // Confirm transaction
  async confirmTransaction(transactionId: string): Promise<ApiResponse<Transaction>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post<Transaction>(`/api/transactions/${transactionId}/confirm`, {}, {
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
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    // Backend endpoint is /api/profile/payment-methods
    return apiClient.get('/api/profile/payment-methods', {
      Authorization: `Bearer ${token}`,
    });
  }

  // Add payment method (using profile endpoint from backend)
  async addPaymentMethod(data: {
    type: 'CARD' | 'BANK_TRANSFER';
    accountNumber?: string;
    bankCode?: string;
    accountName?: string;
    isDefault?: boolean;
  }): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    // Backend endpoint is /api/profile/payment-methods
    return apiClient.post('/api/profile/payment-methods', data, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Remove payment method (using profile endpoint from backend)
  async removePaymentMethod(paymentMethodId: string): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    // Backend endpoint is /api/profile/payment-methods/:id
    return apiClient.delete(`/api/profile/payment-methods/${paymentMethodId}`, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Set default payment method (using profile endpoint from backend)
  async setDefaultPaymentMethod(paymentMethodId: string): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    // Backend endpoint is /api/profile/payment-methods/:id with isDefault: true
    return apiClient.put(`/api/profile/payment-methods/${paymentMethodId}`, { isDefault: true }, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Process toll payment
  async processTollPayment(tollData: {
    tollGateId: string;
    vehicleType: string;
    amount: number;
    paymentMethodId: string;
  }): Promise<ApiResponse<Transaction>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post<Transaction>('/api/toll-payments', tollData, {
      Authorization: `Bearer ${token}`,
    });
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
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

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

    return apiClient.get(endpoint, {
      Authorization: `Bearer ${token}`,
    });
  }
}

export const paymentService = new PaymentService();