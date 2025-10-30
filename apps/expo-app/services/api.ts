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

  constructor() {
    // Configure for development (Replit environment)
    // Backend runs on port 3000, Expo web runs on port 5000
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Use current host with port 3000 for Replit environment
    const getBaseURL = (): string => {
      if (typeof window !== 'undefined') {
        // Browser environment - use current host with port 3000
        const currentHost = window.location.hostname;
        const currentPort = window.location.port;
        // Use port 3000 for backend API, regardless of current page port
        return process.env.EXPO_PUBLIC_API_BASE_URL || `http://${currentHost}:3000`;
      }
      // Node environment (SSR/development) - use current host
      return process.env.EXPO_PUBLIC_API_BASE_URL || `http://0.0.0.0:3000`;
    };

    this.baseURL = getBaseURL();

    console.log('🚀 API Client Initialized');
    console.log('  Environment:', isDevelopment ? 'Development' : 'Production');
    console.log('  Base URL:', this.baseURL);
    console.log('  Note: Backend server runs on port 3000, Expo web on port 5000');
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
        errorMessage = 'Request timeout - The server is taking too long to respond.';
      } else if (error instanceof TypeError && error.message === 'Failed to fetch') {
        // Check if backend is running on localhost
        if (this.baseURL.includes('localhost')) {
          errorMessage = 'Backend server is not running. Please start the backend server.';
        } else {
          errorMessage = 'Cannot connect to server. Please check your internet connection.';
        }
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