// API Service Configuration
// This file provides the core API client and configuration

import { ENV } from '../config/environment';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Default headers for all requests
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'apikey': supabaseAnonKey
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

  private isValidJwt(token: string | null | undefined): boolean {
    return !!token && typeof token === 'string' && token.split('.').length === 3 && token.length > 20;
  }

  private decodeJwtPayload(token: string): Record<string, any> | null {
    if (!this.isValidJwt(token)) return null;

    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      const binary = typeof atob === 'function'
        ? atob(padded)
        : Buffer.from(padded, 'base64').toString('binary');
      const json = decodeURIComponent(
        Array.from(binary).map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join('')
      );
      return JSON.parse(json);
    } catch (error) {
      console.warn('Failed to decode JWT payload for validation:', error);
      return null;
    }
  }

  private isSupabaseAccessToken(token: string | null | undefined): boolean {
    if (!this.isValidJwt(token)) return false;

    const claims = this.decodeJwtPayload(token as string);
    if (!claims) return false;

    const issuer = String(claims.iss || '').toLowerCase();
    const audience = String(claims.aud || '').toLowerCase();
    const projectHost = (supabaseUrl || '').replace(/^https?:\/\//i, '').replace(/\/+$/, '').toLowerCase();

    const isSupabaseIssuer = issuer.includes('supabase.co');
    const isCurrentProjectIssuer = !!projectHost && issuer.includes(projectHost);
    const isSupabaseAudience = ['authenticated', 'authenticated-user'].includes(audience);

    return isSupabaseIssuer || isCurrentProjectIssuer || isSupabaseAudience;
  }

  constructor() {
    if (!supabaseUrl) {
      console.warn('⚠️ EXPO_PUBLIC_SUPABASE_URL not set');
      this.baseURL = 'https://lkfprjjlqmtpamukoatl.supabase.co';
    } else {
      this.baseURL = supabaseUrl;
    }

    console.log('🔷 Supabase URL:', this.baseURL);
    console.log('✅ Architecture: Supabase Auth + Supabase serverless backend');
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  private async getAuthToken(): Promise<string | null> {
    if (this.authToken && this.isSupabaseAccessToken(this.authToken)) return this.authToken;

    if (this.tokenRefreshPromise) return this.tokenRefreshPromise;

    this.tokenRefreshPromise = (async () => {
      try {
        const [[, storedToken], [, expiryStr]] = await AsyncStorage.multiGet(['userToken', 'tokenExpiry']);
        const expiry = expiryStr ? parseInt(expiryStr) : 0;
        const nearExpiry = expiry < (Date.now() + 60 * 60 * 1000);

        let token = storedToken || '';

        if (storedToken && !this.isSupabaseAccessToken(storedToken)) {
          console.warn('Ignoring stale non-Supabase token stored in AsyncStorage.');
          await AsyncStorage.multiRemove(['userToken', 'tokenExpiry']);
          token = '';
        }

        if (!this.isSupabaseAccessToken(token) || nearExpiry) {
          try {
            const { data } = await supabase.auth.getSession();
            const sessionToken = data.session?.access_token;
            if (this.isSupabaseAccessToken(sessionToken)) {
              token = sessionToken;
              const newExpiry = Date.now() + (24 * 60 * 60 * 1000);
              await AsyncStorage.multiSet([
                ['userToken', token],
                ['tokenExpiry', newExpiry.toString()],
              ]);
            } else {
              await AsyncStorage.multiRemove(['userToken', 'tokenExpiry']);
              token = '';
            }
          } catch (e) {
            if (!storedToken || !this.isSupabaseAccessToken(storedToken)) {
              await AsyncStorage.multiRemove(['userToken', 'tokenExpiry']);
              token = '';
            }
          }
        }

        this.authToken = this.isSupabaseAccessToken(token) ? token : '';
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

      // Add auth headers if not provided explicitly. Never send a stale Firebase-style token
      // or any non-Supabase JWT to the Supabase function layer.
      if (!headers.has('Authorization')) {
        const token = await this.getAuthToken();
        if (this.isSupabaseAccessToken(token)) {
          headers.set('Authorization', `Bearer ${token}`);
        } else if (token) {
          console.warn('Dropping invalid auth token before request.', endpoint);
          await AsyncStorage.multiRemove(['userToken', 'tokenExpiry']);
        }
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
