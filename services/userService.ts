// User Service
// Handles user profile and account management API calls

import { apiClient, ApiResponse } from './api';
import { authService } from './authService';
import { User, UpdateProfileRequest } from './types';

class UserService {
  // Validate profile update data
  private validateProfileData(data: UpdateProfileRequest): { isValid: boolean; error?: string } => {
    const { validateName, validateEmail, validatePhone, validateAddress } = require('../utils/validation');
    
    const firstNameValidation = validateName(data.firstName, 'First name');
    if (!firstNameValidation.isValid) {
      return firstNameValidation;
    }
    
    const lastNameValidation = validateName(data.lastName, 'Last name');
    if (!lastNameValidation.isValid) {
      return lastNameValidation;
    }
    
    const emailValidation = validateEmail(data.email);
    if (!emailValidation.isValid) {
      return emailValidation;
    }
    
    const phoneValidation = validatePhone(data.phone);
    if (!phoneValidation.isValid) {
      return phoneValidation;
    }
    
    if (data.address) {
      const addressValidation = validateAddress(data.address);
      if (!addressValidation.isValid) {
        return addressValidation;
      }
    }
    
    return { isValid: true };
  }

  // Update user profile
  async updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<User>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }
    
    // Validate before sending
    const validation = this.validateProfileData(data);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    return apiClient.put<User>('/api/user/profile', data, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Get user profile
  async getProfile(): Promise<ApiResponse<User>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.get<User>('/api/user/profile', {
      Authorization: `Bearer ${token}`,
    });
  }

  // Update user settings
  async updateSettings(settings: { 
    notifications: boolean;
    locationServices: boolean;
    emailUpdates: boolean;
  }): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.put<{ message: string }>('/api/user/settings', settings, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Get user settings
  async getSettings(): Promise<ApiResponse<{ 
    notifications: boolean;
    locationServices: boolean;
    emailUpdates: boolean;
  }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.get('/api/user/settings', {
      Authorization: `Bearer ${token}`,
    });
  }

  // Delete user account
  async deleteAccount(): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.delete<{ message: string }>('/api/user/account', {
      Authorization: `Bearer ${token}`,
    });
  }

  // Change password
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.put<{ message: string }>('/api/user/password', data, {
      Authorization: `Bearer ${token}`,
    });
  }
}

export const userService = new UserService();