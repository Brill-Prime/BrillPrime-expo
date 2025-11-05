
import { apiClient, ApiResponse } from './api';
import { authService } from './authService';
import { API_ENDPOINTS } from './apiEndpoints';

/**
 * Centralized service for all Supabase Edge Functions
 * Base URL: https://lkfprjjlqmtpamukoatl.supabase.co
 */
class EdgeFunctionsService {
  // Create Order
  async createOrder(data: {
    userId: string;
    merchantId: string;
    items: Array<{
      productId: string;
      quantity: number;
      price: number;
    }>;
    deliveryAddress: string;
    deliveryInstructions?: string;
    paymentMethod: 'CARD' | 'BANK_TRANSFER';
  }): Promise<ApiResponse<{ orderId: string; order: any }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post(
      API_ENDPOINTS.EDGE_FUNCTIONS.CREATE_ORDER,
      data,
      { Authorization: `Bearer ${token}` }
    );
  }

  // Update Escrow
  async updateEscrow(data: {
    escrowId: string;
    status?: 'PENDING' | 'HELD' | 'RELEASED' | 'DISPUTED' | 'REFUNDED';
    action?: 'release' | 'refund' | 'dispute';
    notes?: string;
    reason?: string;
  }): Promise<ApiResponse<{ message: string; escrow?: any }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post(
      API_ENDPOINTS.EDGE_FUNCTIONS.UPDATE_ESCROW,
      data,
      { Authorization: `Bearer ${token}` }
    );
  }

  // Refund Payment
  async refundPayment(data: {
    orderId: string;
    amount: number;
    reason: string;
  }): Promise<ApiResponse<{ message: string; refund?: any }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post(
      API_ENDPOINTS.EDGE_FUNCTIONS.REFUND_PAYMENT,
      data,
      { Authorization: `Bearer ${token}` }
    );
  }

  // Mark Order as Paid
  async markPaid(data: {
    orderId: string;
    reference: string;
    amount: number;
    paymentMethod: 'CARD' | 'BANK_TRANSFER';
  }): Promise<ApiResponse<{ message: string; transaction?: any }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post(
      API_ENDPOINTS.EDGE_FUNCTIONS.MARK_PAID,
      data,
      { Authorization: `Bearer ${token}` }
    );
  }

  // Verify Transaction
  async verifyTransaction(data: {
    reference: string;
    orderId?: string;
  }): Promise<ApiResponse<{ 
    status: string; 
    transaction?: any;
    verified: boolean;
  }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post(
      API_ENDPOINTS.EDGE_FUNCTIONS.VERIFY_TRANSACTION,
      data,
      { Authorization: `Bearer ${token}` }
    );
  }

  // Create Transaction
  async createTransaction(data: {
    orderId: string;
    amount: number;
    paymentMethod: 'CARD' | 'BANK_TRANSFER';
    reference: string;
    userId: string;
    gateway?: string;
  }): Promise<ApiResponse<{ 
    transactionId: string;
    transaction: any;
  }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post(
      API_ENDPOINTS.EDGE_FUNCTIONS.CREATE_TRANSACTION,
      data,
      { Authorization: `Bearer ${token}` }
    );
  }

  // Paystack Utilities (Initialize, Verify, Refund)
  async paystackUtils(data: {
    action: 'initialize' | 'verify' | 'refund';
    email?: string;
    amount?: number;
    orderId?: string;
    reference?: string;
    transaction?: string;
    metadata?: Record<string, any>;
  }): Promise<ApiResponse<any>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post(
      API_ENDPOINTS.EDGE_FUNCTIONS.PAYSTACK_UTILS,
      data,
      { Authorization: `Bearer ${token}` }
    );
  }

  // Test all edge functions connectivity
  async testConnectivity(): Promise<{
    [key: string]: { success: boolean; error?: string };
  }> {
    const results: { [key: string]: { success: boolean; error?: string } } = {};
    
    const functions = Object.entries(API_ENDPOINTS.EDGE_FUNCTIONS);
    
    for (const [name, endpoint] of functions) {
      // Skip webhook as it's for Paystack callbacks
      if (name === 'PAYSTACK_WEBHOOK') {
        results[name] = { success: true, error: 'Webhook endpoint (external use only)' };
        continue;
      }

      try {
        const token = await authService.getToken();
        const response = await fetch(
          `https://lkfprjjlqmtpamukoatl.supabase.co${endpoint}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ test: true })
          }
        );
        
        results[name] = { 
          success: response.ok, 
          error: response.ok ? undefined : `HTTP ${response.status}`
        };
      } catch (error: any) {
        results[name] = { success: false, error: error.message };
      }
    }

    return results;
  }
}

export const edgeFunctionsService = new EdgeFunctionsService();
