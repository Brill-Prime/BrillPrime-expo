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
  private readonly inFlightGets = new Map<string, Promise<ApiResponse<any>>>();

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
    // If a refresh is in-flight, await it
    if (this.tokenRefreshPromise) return this.tokenRefreshPromise;

    // Start a token acquisition routine
    this.tokenRefreshPromise = (async () => {
      try {
        const currentUser = auth?.currentUser;
        if (!currentUser) {
          this.authToken = '';
          await AsyncStorage.multiRemove(['userToken', 'tokenExpiry']);
          return null;
        }
        const token = await currentUser.getIdToken();
        this.authToken = token;
        const expiry = Date.now() + 55 * 60 * 1000;
        await AsyncStorage.multiSet([
          ['userToken', token],
          ['tokenExpiry', expiry.toString()],
        ]);
        return token;
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
    const dedupeKey = this.getGetDedupeKey(endpoint, options);
    if (dedupeKey) {
      const inFlight = this.inFlightGets.get(dedupeKey);
      if (inFlight) return inFlight;
    }

    const request = this.performRequest<T>(endpoint, options);
    if (!dedupeKey) return request;

    this.inFlightGets.set(dedupeKey, request);
    try {
      return await request;
    } finally {
      if (this.inFlightGets.get(dedupeKey) === request) {
        this.inFlightGets.delete(dedupeKey);
      }
    }
  }

  private getGetDedupeKey(endpoint: string, options: RequestInit): string | null {
    if ((options.method || 'GET').toUpperCase() !== 'GET' || options.signal) {
      return null;
    }

    const headers = new Headers(options.headers);
    const headerEntries = Array.from(headers.entries()).sort(([left], [right]) =>
      left.localeCompare(right)
    );

    return JSON.stringify([
      this.baseURL,
      endpoint,
      auth?.currentUser?.uid || null,
      headerEntries,
    ]);
  }

  private async performRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      console.log(`🌐 API Request: ${this.baseURL}${endpoint}`);
      const startTime = Date.now();

      const headers = new Headers({
        ...DEFAULT_HEADERS,
        ...(options.headers || {}),
      });

      if (!headers.has('Authorization')) {
        const token = await this.getAuthToken();
        const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
        const authHeader = token ? `Bearer ${token}` : (anonKey ? `Bearer ${anonKey}` : undefined);
        if (authHeader) headers.set('Authorization', authHeader);
      }

      const uid = auth?.currentUser?.uid;
      if (uid && !headers.has('x-firebase-uid')) {
        headers.set('x-firebase-uid', uid);
      }

      if (options.method === 'OPTIONS') {
        return {
          success: true,
          message: 'Preflight request successful'
        } as ApiResponse<T>;
      }

      const method = (options.method || 'GET').toUpperCase();
      const canRetry = method === 'GET' || method === 'HEAD';
      const configuredRetries = Number.isFinite(ENV.maxRetries)
        ? Math.trunc(ENV.maxRetries)
        : 0;
      const maxRetries = Math.min(2, Math.max(0, configuredRetries));
      const maxBackoffMs = 8000;
      let response: Response | null = null;
      let lastError: unknown = null;

      const isTransientStatus = (status: number) =>
        status === 429 || status === 502 || status === 503 || status === 504;
      const isTransientNetworkError = (error: unknown) =>
        error instanceof TypeError ||
        (error instanceof Error && error.name === 'AbortError');
      const getRetryDelay = (attempt: number, retryAfter: string | null) => {
        if (retryAfter) {
          const seconds = Number(retryAfter);
          const retryAt = Number.isFinite(seconds)
            ? seconds * 1000
            : Date.parse(retryAfter) - Date.now();
          if (Number.isFinite(retryAt) && retryAt > 0) {
            return Math.min(retryAt, maxBackoffMs);
          }
        }

        const exponentialDelay = Math.min(500 * 2 ** attempt, maxBackoffMs);
        return Math.min(
          exponentialDelay + Math.floor(Math.random() * 250),
          maxBackoffMs
        );
      };

      for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
        const controller = new AbortController();
        const callerSignal = options.signal;
        const abortFromCaller = () => controller.abort();
        if (callerSignal?.aborted) {
          controller.abort();
        } else {
          callerSignal?.addEventListener('abort', abortFromCaller, { once: true });
        }
        const timeoutId = setTimeout(() => controller.abort(), ENV.apiTimeout);

        try {
          response = await fetch(`${this.baseURL}${endpoint}`, {
            ...options,
            headers,
            mode: 'cors',
            signal: controller.signal,
          });
        } catch (err) {
          lastError = err;
        } finally {
          clearTimeout(timeoutId);
          callerSignal?.removeEventListener('abort', abortFromCaller);
        }

        if (
          lastError &&
          canRetry &&
          !callerSignal?.aborted &&
          attempt < maxRetries &&
          isTransientNetworkError(lastError)
        ) {
          await new Promise(resolve =>
            setTimeout(resolve, getRetryDelay(attempt, null))
          );
          lastError = null;
          continue;
        }

        if (
          response &&
          canRetry &&
          attempt < maxRetries &&
          isTransientStatus(response.status)
        ) {
          const delay = getRetryDelay(
            attempt,
            response.headers.get('Retry-After')
          );
          try {
            await response.arrayBuffer();
          } catch (error) {
            console.warn(`Could not drain retry response for ${endpoint}:`, error);
          }
          await new Promise(resolve => setTimeout(resolve, delay));
          response = null;
          continue;
        }

        break;
      }

      if (lastError) throw lastError;

      const duration = Date.now() - startTime;
      if (response) {
        console.log(`✅ API Response: ${endpoint} [${response.status}] (${duration}ms)`);
      }

      if (!response || !response.ok) {
        let errorText = '';
        try {
          errorText = response ? await response.text() : '';
        } catch {
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
        userFriendlyMessage = 'The request timed out. Please check your connection and try again.';
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
