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
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://lkfprjjlqmtpamukoatl.supabase.co';
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseAnonKey) {
      console.error('⚠️ CRITICAL: Supabase anon key missing!');
      console.error('Please set EXPO_PUBLIC_SUPABASE_ANON_KEY');
      this.baseURL = supabaseUrl;
      this.supabaseKey = '';
    } else {
      this.baseURL = supabaseUrl;
      this.supabaseKey = supabaseAnonKey;
    }
    
    console.log('🔷 Supabase API URL:', this.baseURL);
    console.log('✅ Architecture: Firebase Auth + Supabase Backend');
    console.log('✅ Edge Functions: paystack-utils, paystack-webhook');
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      // Increased timeout for Render cold starts (free tier can take 50+ seconds)
      const controller = new AbortController();
      const timeoutMs = 60000; // 60 seconds for cold start
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      console.log(`🌐 API Request: ${this.baseURL}${endpoint}`);
      const startTime = Date.now();

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.supabaseKey,
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

      let errorMessage = 'Unknown error occurred';

      if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
        errorMessage = 'Request timeout - The server is taking too long to respond. It may be waking up from sleep (this can take up to 60 seconds on first load).';
      } else if (error instanceof TypeError && error.message === 'Failed to fetch') {
        errorMessage = 'Cannot connect to server. Please check your internet connection or try again in a moment.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
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