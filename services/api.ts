// API Service Configuration
// This file provides the core API client and configuration

import { ENV } from '../config/environment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';

// Default headers for all requests
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''
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
  private tokenRefreshPromise: Promise<string | null> | null = null;

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

  private async getAuthToken(): Promise<string | null> {
    // Use cached token if available
    if (this.authToken) return this.authToken;

    // If a refresh is in-flight, await it
    if (this.tokenRefreshPromise) return this.tokenRefreshPromise;

    // Start a token acquisition routine
    this.tokenRefreshPromise = (async () => {
      try {
        const [[, storedToken], [, expiryStr]] = await AsyncStorage.multiGet(['userToken', 'tokenExpiry']);
        const expiry = expiryStr ? parseInt(expiryStr) : 0;
        const nearExpiry = expiry < (Date.now() + 60 * 60 * 1000); // within 1 hour

        let token = storedToken || '';

        // If token missing or near expiry, try to refresh from Firebase
        if (!token || nearExpiry) {
          const currentUser = auth?.currentUser;
          if (currentUser) {
            try {
              const refreshed = await currentUser.getIdToken(true);
              token = refreshed;
              const newExpiry = Date.now() + (24 * 60 * 60 * 1000);
              await AsyncStorage.multiSet([
                ['userToken', token],
                ['tokenExpiry', newExpiry.toString()],
              ]);
            } catch (e) {
              // If refresh fails, keep stored token if present; otherwise null
              if (!storedToken) {
                await AsyncStorage.multiRemove(['userToken', 'tokenExpiry']);
                token = '';
              }
            }
          }
        }

        this.authToken = token || '';
        return this.authToken || null;
      } finally {
        this.tokenRefreshPromise = null;
      }
    })();

    return this.tokenRefreshPromise;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const controller = new AbortController();
      const timeoutMs = ENV.apiTimeout; // configurable timeout
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      console.log(`🌐 API Request: ${this.baseURL}${endpoint}`);
      const startTime = Date.now();

      // Merge default headers with any custom headers
      const headers = new Headers({
        ...DEFAULT_HEADERS,
        ...(options.headers || {}),
      });

      // Add auth headers if not provided explicitly
      if (!headers.has('Authorization')) {
        const token = await this.getAuthToken();
        const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
        const authHeader = token ? `Bearer ${token}` : (anonKey ? `Bearer ${anonKey}` : undefined);
        if (authHeader) headers.set('Authorization', authHeader);
      }

      // Include Firebase UID if available
      const uid = auth?.currentUser?.uid;
      if (uid && !headers.has('x-firebase-uid')) {
        headers.set('x-firebase-uid', uid);
      }

      // Handle preflight requests
      if (options.method === 'OPTIONS') {
        return {
          success: true,
          message: 'Preflight request successful'
        } as ApiResponse<T>;
      }

      const maxRetries = Math.max(0, ENV.maxRetries);
      let attempt = 0;
      let lastError: any = null;
      let response: Response | null = null;

      const isTransientError = (err: any, resp?: Response | null) => {
        if (resp && (resp.status === 503 || resp.status === 429)) return true;
        if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') return true; // timeout
        if (err instanceof TypeError && err.message === 'Failed to fetch') return true; // network
        return false;
      };

      while (attempt <= maxRetries) {
        try {
          response = await fetch(`${this.baseURL}${endpoint}`, {
            ...options,
            headers,
            mode: 'cors',
            signal: controller.signal,
          });
          lastError = null;
          break;
        } catch (err) {
          lastError = err;
          if (attempt < maxRetries && isTransientError(err)) {
            // exponential backoff with jitter
            const base = 500; // ms
            const delay = Math.min(base * Math.pow(2, attempt), 8000) + Math.floor(Math.random() * 250);
            await new Promise(res => setTimeout(res, delay));
            attempt++;
            continue;
          }
          throw err;
        }
      }

      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      if (response) {
        console.log(`✅ API Response: ${endpoint} [${response.status}] (${duration}ms)`);
      }

      if (!response || !response.ok) {
        let errorText = '';
        try {
          errorText = response ? await response.text() : '';
        } catch (e) {
          errorText = response ? response.statusText : '';
        }
        const statusCode = response ? response.status : 'NO_RESPONSE';
        console.error(`API Error [${statusCode}] ${endpoint}:`, errorText);
        throw new Error(`HTTP ${statusCode}: ${errorText || (response ? response.statusText : 'No response')}`);
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
