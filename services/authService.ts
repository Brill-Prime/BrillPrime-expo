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
    const response = await apiClient.post<AuthResponse>('/api/auth/signup', data);
    
    if (response.success && response.data) {
      // Store user data locally
      await this.storeAuthData(response.data);
    }
    
    return response;
  }

  // Sign in user
  async signIn(data: SignInRequest & { role?: string }): Promise<ApiResponse<AuthResponse>> {
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
    const token = await this.getToken();
    if (!token) {
      return { success: false, error: 'No authentication token found' };
    }

    return apiClient.get<User>('/api/auth/user', {
      Authorization: `Bearer ${token}`,
    });
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
        'tempUserRole'
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

      const response = await this.getCurrentUser();
      if (response.success && response.data) {
        // Token is still valid on server, just update expiry
        const tokenExpiry = Date.now() + (24 * 60 * 60 * 1000);
        await AsyncStorage.setItem('tokenExpiry', tokenExpiry.toString());
        return true;
      } else {
        // Token is invalid, clear auth data
        await this.clearAuthData();
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }
}

export const authService = new AuthService();