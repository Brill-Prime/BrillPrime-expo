// API Service Configuration
// This file provides the core API client and configuration

import { ENV } from '../config/environment';

// Default headers for all requests
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
  'Access-Control-Allow-Credentials': 'true'
};

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseURL: string;
  private authToken: string = '';

  constructor() {
    // Serverless architecture: Firebase for Auth, Supabase for all backend logic
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      console.warn('⚠️ EXPO_PUBLIC_SUPABASE_URL not set');
      this.baseURL = 'https://lkfprjjlqmtpamukoatl.supabase.co'; // Fallback
    } else {
      this.baseURL = supabaseUrl;
    }

    console.log('🔷 Supabase URL:', this.baseURL);
    console.log('✅ Architecture: Firebase Auth + Supabase Serverless Backend');
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const controller = new AbortController();
      const timeoutMs = 30000; // 30 seconds timeout
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      console.log(`🌐 API Request: ${this.baseURL}${endpoint}`);
      const startTime = Date.now();

      // Merge default headers with any custom headers and auth token
      const headers = new Headers({
        ...DEFAULT_HEADERS,
        ...(options.headers || {}),
        'x-firebase-uid': this.authToken
      });

      // Handle preflight requests
      if (options.method === 'OPTIONS') {
        return {
          success: true,
          message: 'Preflight request successful'
        } as ApiResponse<T>;
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
        mode: 'cors',
        credentials: 'include',
        signal: controller.signal,
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
    return this.makeRequest<T>(endpoint, { 
      method: 'GET',
      headers: headers ? { ...DEFAULT_HEADERS, ...headers } : DEFAULT_HEADERS,
      signal 
    });
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
        ...DEFAULT_HEADERS,
        'Content-Type': 'application/json',
        ...(headers || {}) 
      },
      body: data ? JSON.stringify(data) : undefined,
      signal,
    });
  }

  async put<T>(endpoint: string, data?: any, headers?: Record<string, string>, signal?: AbortSignal): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      headers: { 
        ...DEFAULT_HEADERS,
        'Content-Type': 'application/json',
        ...(headers || {}) 
      },
      body: data ? JSON.stringify(data) : undefined,
      signal,
    });
  }

  async delete<T>(endpoint: string, headers?: Record<string, string>, signal?: AbortSignal): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { 
      method: 'DELETE',
      headers: { 
        ...DEFAULT_HEADERS,
        ...(headers || {}) 
      },
      signal 
    });
  }

  // Helper method to call Supabase Edge Functions
  async callFunction<T>(functionName: string, params?: Record<string, any>, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get<T>(`/functions/v1/${functionName}${queryString}`, headers);
  }

  // Helper method to post to Supabase Edge Functions
  async callFunctionPost<T>(functionName: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.post<T>(`/functions/v1/${functionName}`, data, headers);
  }
}

export const apiClient = new ApiClient();
export type { ApiResponse };