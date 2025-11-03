// Payment Service
// Handles payment processing and transaction management

import { ApiResponse } from './api';
import { authService } from './authService';
import { supabaseService } from './supabaseService';
import { auth } from '../config/firebase'; // Assuming auth is needed for some reason, though not used in the provided snippet
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

    // Using Supabase for payment intent creation
    const { data, error } = await supabaseService.from('payments')
      .insert([{ amount, currency, userId: authService.getCurrentUserId() }]) // Simplified, actual Supabase usage might differ
      .select('clientSecret, paymentIntentId')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as { clientSecret: string; paymentIntentId: string } };
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

    // Using Supabase to initialize payment
    const { data: initializedPayment, error } = await supabaseService.from('payments')
      .insert([{ ...data, userId: authService.getCurrentUserId() }])
      .select('transactionId, status, message')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: initializedPayment as { transactionId: string; status: 'success' | 'failed' | 'pending'; message: string } };
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

    const userId = authService.getCurrentUserId();
    let query = supabaseService.from('payments').select('*').eq('userId', userId);

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.page) {
      query = query.range((filters.page - 1) * (filters?.limit || 10), filters.page * (filters?.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    // Mock pagination for now as Supabase count might not be direct for range queries
    const total = count || 0;
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        payments: data as Transaction[],
        total: total,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    };
  }

  // Get transaction by ID
  async getTransaction(transactionId: string): Promise<ApiResponse<Transaction>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    const userId = authService.getCurrentUserId();
    const { data, error } = await supabaseService.from('transactions')
      .select('*')
      .eq('userId', userId)
      .eq('transactionId', transactionId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Transaction };
  }

  // Confirm transaction
  async confirmTransaction(transactionId: string): Promise<ApiResponse<Transaction>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    const userId = authService.getCurrentUserId();
    const { data, error } = await supabaseService.from('transactions')
      .update({ status: 'completed' }) // Assuming 'completed' is the status for confirmed
      .eq('transactionId', transactionId)
      .eq('userId', userId)
      .select('*')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Transaction };
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

    const userId = authService.getCurrentUserId();
    const { data, error } = await supabaseService.from('refunds')
      .insert([{ transactionId, reason, userId, status: 'pending' }])
      .select('refundId, status, message')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as { refundId: string; status: string; message: string } };
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

    const userId = authService.getCurrentUserId();
    const { data, error } = await supabaseService.from('payment_methods')
      .select('*')
      .eq('userId', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Array<{
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
    }> };
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

    const userId = authService.getCurrentUserId();
    const { error } = await supabaseService.from('payment_methods')
      .insert([{ ...data, userId }]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: { message: 'Payment method added successfully' } };
  }

  // Remove payment method (using profile endpoint from backend)
  async removePaymentMethod(paymentMethodId: string): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    const userId = authService.getCurrentUserId();
    const { error } = await supabaseService.from('payment_methods')
      .delete()
      .eq('id', paymentMethodId)
      .eq('userId', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: { message: 'Payment method removed successfully' } };
  }

  // Set default payment method (using profile endpoint from backend)
  async setDefaultPaymentMethod(paymentMethodId: string): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    const userId = authService.getCurrentUserId();
    // First, unset all other payment methods to be default for this user
    await supabaseService.from('payment_methods')
      .update({ isDefault: false })
      .eq('userId', userId);

    // Then, set the selected payment method as default
    const { error } = await supabaseService.from('payment_methods')
      .update({ isDefault: true })
      .eq('id', paymentMethodId)
      .eq('userId', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: { message: 'Default payment method updated successfully' } };
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

    const userId = authService.getCurrentUserId();
    const { data, error } = await supabaseService.from('toll_payments')
      .insert([{ ...tollData, userId }])
      .select('*')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Transaction };
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

    const userId = authService.getCurrentUserId();
    let query = supabaseService.from('toll_payments').select('*').eq('userId', userId);

    if (filters?.fromDate) {
      query = query.gte('createdAt', filters.fromDate);
    }
    if (filters?.toDate) {
      query = query.lte('createdAt', filters.toDate);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, (filters.offset + (filters?.limit || 10) - 1));
    }

    const { data, error, count } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: {
        payments: data as Transaction[],
        total: count || 0,
      },
    };
  }
}

export const paymentService = new PaymentService();