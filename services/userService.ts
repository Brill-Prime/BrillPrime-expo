// User Service
// Handles user profile and account management API calls

import { apiClient, ApiResponse } from './api';
import { authService } from './authService';
import { User, UpdateProfileRequest } from './types';

class UserService {
  // Validate profile update data
  private validateProfileData(data: UpdateProfileRequest): { isValid: boolean; error?: string } {
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

    return apiClient.put<User>('/api/auth/profile', data, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Get user profile
  async getProfile(): Promise<ApiResponse<User>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.get<User>('/api/auth/profile', {
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

  // Upload profile photo
  async uploadProfilePhoto(imageUri: string): Promise<ApiResponse<{ profileImageUrl: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      // Convert image to base64 or FormData for upload
      const formData = new FormData();
      
      // Extract filename from URI
      const filename = imageUri.split('/').pop() || 'profile.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('profileImage', {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      // Use fetch for FormData upload (apiClient doesn't handle FormData well)
      // Note: Do NOT set Content-Type header manually - let fetch set it with the boundary
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://api.brillprime.com'}/api/user/profile-photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.message || 'Failed to upload profile photo' };
      }
    } catch (error: any) {
      console.error('Profile photo upload error:', error);
      return { success: false, error: error.message || 'Failed to upload profile photo' };
    }
  }

  // Update profile with photo URL (for direct URL updates)
  async updateProfilePhoto(profileImageUrl: string): Promise<ApiResponse<User>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.put<User>('/api/auth/profile', { profileImageUrl }, {
      Authorization: `Bearer ${token}`,
    });
  }
}

export const userService = new UserService();