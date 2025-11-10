// API Service Configuration
// This file provides the core API client and configuration

import { ENV } from '../config/environment';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseURL: string;
  private supabaseKey: string;

  constructor() {
    // Use Supabase URL for all backend operations
    // Firebase is only used for authentication
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('⚠️ CRITICAL: Supabase credentials missing!');
      console.error('Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
      this.baseURL = 'https://lkfprjjlqmtpamukoatl.supabase.co'; // Fallback
      this.supabaseKey = '';
    } else {
      this.baseURL = supabaseUrl;
      this.supabaseKey = supabaseAnonKey;
    }

    console.log('🔷 Supabase API URL:', this.baseURL);
    console.log('✅ Architecture: Firebase Auth + Supabase Backend');
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      // Increased timeout for cold starts
      const controller = new AbortController();
      const timeoutMs = 60000; // 60 seconds for cold start
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      // Map API endpoints to Supabase edge functions (all deployed)
      const endpointMapping: Record<string, string> = {
        // Cart endpoints
        '/api/cart': '/functions/v1/cart-get',
        '/api/cart/add': '/functions/v1/cart-add',
        '/api/cart/update': '/functions/v1/cart-update',

        // Payment & Transaction endpoints
        '/api/payment/initialize': '/functions/v1/create-transaction',
        '/api/payment/process': '/functions/v1/create-transaction',
        '/api/payment/verify': '/functions/v1/verify-transaction',
        '/api/payment/mark-paid': '/functions/v1/mark-paid',
        '/api/payment/refund': '/functions/v1/refund-payment',
        '/api/payments/initialize': '/functions/v1/create-transaction',
        '/api/payments/history': '/functions/v1/list-transactions',
        '/api/transactions': '/functions/v1/list-transactions',
        '/api/transactions/reconcile': '/functions/v1/reconcile-transactions',

        // Order endpoints
        '/api/orders': '/functions/v1/create-order',
        '/api/orders/create': '/functions/v1/create-order',
        '/api/orders/update-status': '/functions/v1/update-order-status',
        '/api/orders/cancel': '/functions/v1/cancel-order',
        '/api/orders/update-address': '/functions/v1/update-delivery-address',
        '/api/orders/report-issue': '/functions/v1/report-order-issue',

        // Merchant endpoints
        '/api/merchants/nearby': '/functions/v1/merchants-nearby',
        '/api/merchants/inventory': '/functions/v1/update-inventory',
        '/api/merchants/store-hours': '/functions/v1/manage-store-hours',
        '/api/merchants/analytics': '/functions/v1/generate-merchant-analytics',

        // Driver endpoints
        '/api/driver/location': '/functions/v1/update-driver-location',
        '/api/driver/accept-delivery': '/functions/v1/accept-delivery',
        '/api/driver/complete-delivery': '/functions/v1/complete-delivery',
        '/api/driver/earnings': '/functions/v1/calculate-earnings',
        '/api/driver/analytics': '/functions/v1/generate-driver-analytics',

        // Communication endpoints
        '/api/conversations/create': '/functions/v1/create-conversation',
        '/api/messages/send': '/functions/v1/send-message',
        '/api/notifications/send': '/functions/v1/notify-user',

        // Admin endpoints
        '/api/admin/kyc/batch-approve': '/functions/v1/batch-approve-kyc',
        '/api/admin/users/manage-status': '/functions/v1/manage-user-status',
        '/api/admin/content/review': '/functions/v1/review-flagged-content',
        '/api/admin/withdrawals/process': '/functions/v1/process-withdrawal',
        '/api/admin/analytics': '/functions/v1/generate-platform-analytics',

        // Escrow endpoints
        '/api/escrow/update': '/functions/v1/update-escrow',

        // Paystack webhook (internal)
        '/api/paystack/webhook': '/functions/v1/paystack-webhook',
      };

      // Map API endpoints to Supabase edge functions
      let finalUrl = endpoint;
      if (endpoint.startsWith('/api/')) {
        // Check for exact matches first
        if (endpointMapping[endpoint]) {
          finalUrl = endpointMapping[endpoint];
        } else {
          // Handle dynamic routes like /api/cart/{itemId}
          const baseEndpoint = endpoint.split('/').slice(0, 3).join('/');
          if (endpointMapping[baseEndpoint]) {
            finalUrl = endpoint.replace(baseEndpoint, endpointMapping[baseEndpoint]);
          } else {
            // Default conversion
            finalUrl = endpoint.replace('/api/', '/functions/v1/');
          }
        }
      }

      console.log(`🌐 API Request: ${this.baseURL}${finalUrl}`);
      const startTime = Date.now();

      const response = await fetch(`${this.baseURL}${finalUrl}`, {
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          ...options.headers,
        },
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      console.log(`✅ API Response: ${endpoint} [${response.status}] (${duration}ms)`);

      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = response.statusText;
        }
        console.error(`API Error [${response.status}] ${endpoint}:`, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      let data;
      try {
        const responseText = await response.text();
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error(`JSON Parse Error for ${endpoint}:`, parseError);
        throw new Error('Invalid JSON response from server');
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      // Improved error logging
      const errorInfo: any = { endpoint, errorType: typeof error };
      if (error && typeof error === 'object') {
        if ('name' in error) errorInfo.errorName = error.name;
        if ('message' in error) errorInfo.errorMessage = error.message;
        if ('stack' in error) errorInfo.errorStack = error.stack;
      }
      console.error('API request failed:', errorInfo);

      let errorMessage = 'An unexpected error occurred. Please try again.';
      let userFriendlyMessage = errorMessage;

      if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
        errorMessage = 'Request timeout - The server is taking too long to respond.';
        userFriendlyMessage = 'The request is taking longer than expected. The server may be waking up from sleep mode. Please wait a moment and try again.';
      } else if (error instanceof TypeError && error.message === 'Failed to fetch') {
        errorMessage = 'Network error - Failed to connect to server.';
        userFriendlyMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
      } else if (error instanceof Error) {
        errorMessage = error.message;

        // Map common error messages to user-friendly versions
        if (error.message.includes('HTTP 401')) {
          userFriendlyMessage = 'Your session has expired. Please sign in again.';
        } else if (error.message.includes('HTTP 403')) {
          userFriendlyMessage = 'You don\'t have permission to access this resource.';
        } else if (error.message.includes('HTTP 404')) {
          userFriendlyMessage = 'The requested resource was not found.';
        } else if (error.message.includes('HTTP 500')) {
          userFriendlyMessage = 'A server error occurred. Our team has been notified. Please try again later.';
        } else if (error.message.includes('HTTP 503')) {
          userFriendlyMessage = 'The service is temporarily unavailable. Please try again in a few moments.';
        } else if (error.message.includes('Invalid JSON')) {
          userFriendlyMessage = 'The server returned an invalid response. Please try again.';
        } else if (error.message.toLowerCase().includes('network')) {
          userFriendlyMessage = 'Network connection issue. Please check your internet and try again.';
        } else {
          userFriendlyMessage = errorMessage;
        }
      }

      return {
        success: false,
        error: userFriendlyMessage,
        message: userFriendlyMessage,
      };
    }
  }

  async get<T>(endpoint: string, headers?: Record<string, string>, signal?: AbortSignal): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'GET', headers, signal });
  }

  async post<T>(
    endpoint: string,
    data?: any,
    headers?: Record<string, string>,
    signal?: AbortSignal
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      signal,
    });
  }

  async put<T>(endpoint: string, data?: any, headers?: Record<string, string>, signal?: AbortSignal): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
      signal,
    });
  }

  async delete<T>(endpoint: string, headers?: Record<string, string>, signal?: AbortSignal): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE', headers, signal });
  }
}

export const apiClient = new ApiClient();
export type { ApiResponse };