// Authentication Service
// Handles all authentication-related API calls

import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, ApiResponse } from './api';
import { 
  AuthResponse, 
  SignUpRequest, 
  SignInRequest, 
  ResetPasswordRequest,
  ConfirmPasswordResetRequest,
  VerifyOTPRequest,
  User
} from './types';

class AuthService {
  private readonly TOKEN_KEY = 'userToken';
  private readonly USER_KEY = 'userData';
  private readonly ROLE_KEY = 'userRole';

  // Sign up new user
  async signUp(data: SignUpRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiClient.post<AuthResponse>('/api/auth/signup', data);

      if (response.success && response.data) {
        // Store user data locally
        await this.storeAuthData(response.data);
      }

      return response;
    } catch (error) {
      console.error('SignUp error:', error);

      // Handle network errors gracefully - create offline demo account
      if (error.message?.includes('Failed to fetch') || error.message?.includes('network')) {
        console.log('Network error detected, creating offline demo account');

        // Create demo user data
        const demoUser: User = {
          id: 'demo-' + Date.now(),
          email: data.email,
          role: data.role as 'consumer' | 'merchant' | 'driver',
          name: data.email.split('@')[0],
          phone: '',
          isVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const demoToken = 'demo-token-' + Date.now();
        const expiryTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

        // Store demo auth data
        await AsyncStorage.multiSet([
          [this.TOKEN_KEY, demoToken],
          [this.USER_KEY, JSON.stringify(demoUser)],
          [this.ROLE_KEY, demoUser.role],
          ['tokenExpiry', expiryTime.toString()],
          ['userName', demoUser.name],
          ['isOfflineMode', 'true'],
        ]);

        return {
          success: true,
          data: { token: demoToken, user: demoUser }
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  // Sign in user
  async signIn(data: SignInRequest & { role?: string }): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiClient.post<AuthResponse>('/api/auth/signin', data);

      if (response.success && response.data) {
        // Validate role if provided
        if (data.role && response.data.user.role !== data.role) {
          return {
            success: false,
            error: `Account role mismatch. Expected ${data.role} but account is ${response.data.user.role}`
          };
        }

        // Store user data locally with expiry
        await this.storeAuthData(response.data);
      }

      return response;
    } catch (error) {
      console.error('SignIn error:', error);

      // Handle network errors - check if user exists in offline storage
      if (error.message?.includes('Failed to fetch') || error.message?.includes('network')) {
        console.log('Network error detected, checking for existing offline account');

        const storedEmail = await AsyncStorage.getItem('userEmail');
        const storedRole = await AsyncStorage.getItem('userRole');
        const storedName = await AsyncStorage.getItem('userName');

        if (storedEmail === data.email && storedRole) {
          // User exists in offline storage, allow sign in
          const demoUser: User = {
            id: 'demo-' + Date.now(),
            email: storedEmail,
            role: storedRole as 'consumer' | 'merchant' | 'driver',
            name: storedName || storedEmail.split('@')[0],
            phone: '',
            isVerified: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          const demoToken = 'demo-token-' + Date.now();
          const expiryTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

          await AsyncStorage.multiSet([
            [this.TOKEN_KEY, demoToken],
            [this.USER_KEY, JSON.stringify(demoUser)],
            [this.ROLE_KEY, demoUser.role],
            ['tokenExpiry', expiryTime.toString()],
            ['isOfflineMode', 'true'],
          ]);

          return {
            success: true,
            data: { user: demoUser, token: demoToken }
          };
        } else {
          return {
            success: false,
            error: 'No offline account found. Please sign up first when online.'
          };
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  // Verify OTP
  async verifyOTP(data: VerifyOTPRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<AuthResponse>('/api/auth/verify-otp', data);

    if (response.success && response.data) {
      // Store user data locally
      await this.storeAuthData(response.data);
    }

    return response;
  }

  // Request password reset
  async requestPasswordReset(data: ResetPasswordRequest): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/api/auth/forgot-password', data);
  }

  // Confirm password reset
  async confirmPasswordReset(data: ConfirmPasswordResetRequest): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/api/auth/reset-password', data);
  }

  // Get current user
  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const token = await this.getToken();
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }

      // Check if we're in offline mode
      const isOfflineMode = await AsyncStorage.getItem('isOfflineMode');

      if (isOfflineMode === 'true') {
        // Return offline user data
        const [email, role, name] = await AsyncStorage.multiGet([
          'userEmail', 'userRole', 'userName'
        ]);

        if (email[1] && role[1]) {
          const offlineUser: User = {
            id: 'demo-offline',
            email: email[1],
            role: role[1] as 'consumer' | 'merchant' | 'driver',
            name: name[1] || email[1].split('@')[0],
            phone: '',
            isVerified: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          return {
            success: true,
            data: offlineUser
          };
        }
      }

      const response = await apiClient.get<User>('/api/auth/user', {
        Authorization: `Bearer ${token}`,
      });

      if (response.success && response.data) {
        // Clear offline mode if API is working
        await AsyncStorage.removeItem('isOfflineMode');
        return response;
      } else {
        return {
          success: false,
          error: response.error || 'Failed to get user data'
        };
      }
    } catch (error) {
      console.error('getCurrentUser error:', error);

      // Handle network errors - fallback to offline mode
      if (error.message?.includes('Failed to fetch') || error.message?.includes('network')) {
        console.log('Network error, falling back to offline user data');

        const [email, role, name] = await AsyncStorage.multiGet([
          'userEmail', 'userRole', 'userName'
        ]);

        if (email[1] && role[1] && token) {
          const offlineUser: User = {
            id: 'demo-offline',
            email: email[1],
            role: role[1] as 'consumer' | 'merchant' | 'driver',
            name: name[1] || email[1].split('@')[0],
            phone: '',
            isVerified: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          await AsyncStorage.setItem('isOfflineMode', 'true');

          return {
            success: true,
            data: offlineUser
          };
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      // Call API to invalidate token
      const token = await this.getToken();
      if (token) {
        await apiClient.post('/api/auth/signout', {}, {
          Authorization: `Bearer ${token}`,
        });
      }
    } catch (error) {
      console.error('Error during API signout:', error);
    } finally {
      // Clear local storage regardless of API call result
      await this.clearAuthData();
    }
  }

  // Helper methods
  private async storeAuthData(authData: AuthResponse): Promise<void> {
    try {
      const tokenExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours from now

      await AsyncStorage.multiSet([
        [this.TOKEN_KEY, authData.token],
        [this.USER_KEY, JSON.stringify(authData.user)],
        [this.ROLE_KEY, authData.user.role],
        ['tokenExpiry', tokenExpiry.toString()],
        ['selectedRole', authData.user.role] // Update selected role to match actual user role
      ]);
    } catch (error) {
      console.error('Error storing auth data:', error);
    }
  }

  private async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.TOKEN_KEY,
        this.USER_KEY,
        this.ROLE_KEY,
        'tokenExpiry',
        'selectedRole',
        'pendingUserData',
        'tempUserEmail',
        'tempUserRole',
        'isOfflineMode' // Also clear offline mode flag
      ]);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  async getStoredUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting stored user:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    if (!token) return false;

    // Check token expiry
    const expiry = await AsyncStorage.getItem('tokenExpiry');
    if (!expiry || Date.now() > parseInt(expiry)) {
      await this.clearAuthData();
      return false;
    }

    return true;
  }

  // Check if token needs refresh (expires in next hour)
  async needsTokenRefresh(): Promise<boolean> {
    const expiry = await AsyncStorage.getItem('tokenExpiry');
    if (!expiry) return true;

    const expiryTime = parseInt(expiry);
    const oneHourFromNow = Date.now() + (60 * 60 * 1000);

    return expiryTime < oneHourFromNow;
  }

  // Refresh token if needed
  async refreshTokenIfNeeded(): Promise<boolean> {
    try {
      if (!(await this.needsTokenRefresh())) {
        return true; // Token is still valid
      }

      // Attempt to refresh token using getCurrentUser (which handles network errors)
      const response = await this.getCurrentUser();
      if (response.success && response.data) {
        // Token is still valid on server, just update expiry
        const tokenExpiry = Date.now() + (24 * 60 * 60 * 1000);
        await AsyncStorage.setItem('tokenExpiry', tokenExpiry.toString());
        return true;
      } else {
        // Token is invalid or refresh failed, clear auth data
        await this.clearAuthData();
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      // If getCurrentUser threw an error (e.g., network issue during refresh attempt)
      // we don't necessarily want to clear tokens immediately. The logic within
      // getCurrentUser should handle fallback to offline mode.
      // If it's a genuine error that prevents even checking expiry, we might need to clear.
      // For now, assume network errors are handled by fallback.
      // If it's a different error, clearing might be appropriate.
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        console.log('Network error during token refresh attempt, keeping tokens for potential offline use.');
        return false; // Indicate refresh didn't fully succeed due to network, but don't invalidate.
      } else {
        console.error('Non-network error during token refresh, clearing auth data.');
        await this.clearAuthData();
        return false;
      }
    }
  }

  // Validate token format and structure
  private isValidTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') return false;

    // Basic JWT format check (header.payload.signature)
    const parts = token.split('.');
    return parts.length === 3;
  }

  // Enhanced authentication check with better error handling
  async isAuthenticatedWithValidation(): Promise<{ isAuthenticated: boolean; shouldRefresh: boolean; error?: string }> {
    try {
      const token = await this.getToken();
      if (!token) {
        return { isAuthenticated: false, shouldRefresh: false, error: 'No token found' };
      }

      if (!this.isValidTokenFormat(token)) {
        await this.clearAuthData();
        return { isAuthenticated: false, shouldRefresh: false, error: 'Invalid token format' };
      }

      // Check token expiry
      const expiry = await AsyncStorage.getItem('tokenExpiry');
      if (!expiry || Date.now() > parseInt(expiry)) {
        // Token expired, try to refresh
        const refreshed = await this.refreshTokenIfNeeded();
        return { 
          isAuthenticated: refreshed, 
          shouldRefresh: false, 
          error: refreshed ? undefined : 'Token expired and refresh failed' 
        };
      }

      // Check if token needs refresh soon
      const needsRefresh = await this.needsTokenRefresh();

      return { 
        isAuthenticated: true, 
        shouldRefresh: needsRefresh 
      };
    } catch (error) {
      console.error('Authentication validation error:', error);
      // If any error occurs during validation, assume not authenticated.
      // The specific error might be from AsyncStorage or other operations.
      return { 
        isAuthenticated: false, 
        shouldRefresh: false, 
        error: 'Authentication validation failed due to an error' 
      };
    }
  }
}

export const authService = new AuthService();