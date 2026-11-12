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

    try {
      return apiClient.put<User>('/functions/v1/profile', data, {
        Authorization: 'Bearer ' + token,
      });
    } catch (error: any) {
      console.error('Profile update error:', error);
      return { success: false, error: error.message || 'Failed to update profile' };
    }
  }

  // Get user profile
  async getProfile(): Promise<ApiResponse<User>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      return apiClient.get<User>('/functions/v1/profile', {
        Authorization: 'Bearer ' + token,
      });
    } catch (error: any) {
      console.error('Get profile error:', error);
      return { success: false, error: error.message || 'Failed to get profile' };
    }
  }

  // Update user settings
  async updateSettings(settings: { 
    notifications: boolean;
    locationServices: boolean;
    emailUpdates: boolean;
  }): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) return { success: false, error: 'Authentication required' };
    return apiClient.put<{ message: string }>('/functions/v1/account/settings', settings, {
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
    if (!token) return { success: false, error: 'Authentication required' };
    return apiClient.get('/functions/v1/account/settings', {
      Authorization: `Bearer ${token}`,
    });
  }

  // Delete user account
  async deleteAccount(): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) return { success: false, error: 'Authentication required' };
    return apiClient.delete<{ message: string }>('/functions/v1/account/user/account', {
      Authorization: `Bearer ${token}`,
    });
  }

  // Change password
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<ApiResponse<{ message: string }>> {
    if (data.newPassword !== data.confirmPassword) {
      return { success: false, error: 'Password confirmation does not match.' };
    }
    try {
      await authService.changePassword(data.currentPassword, data.newPassword);
      return { success: true, data: { message: 'Password changed successfully' } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to change password' };
    }
  }

  // Upload profile photo
  async uploadProfilePhoto(imageUri: string): Promise<ApiResponse<{ profileImageUrl: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      const user = await authService.getStoredUser();
      if (!user || !user.id) {
        return { success: false, error: 'User not found' };
      }

      const { supabase } = await import('../config/supabase');
      
      // Convert image URI to blob for upload
      let blob: Blob;
      if (imageUri.startsWith('data:')) {
        // Base64 image
        const response = await fetch(imageUri);
        blob = await response.blob();
      } else if (imageUri.startsWith('file://')) {
        // File URI (mobile)
        const response = await fetch(imageUri);
        blob = await response.blob();
      } else {
        // Already a URL, no need to upload
        return { success: true, data: { profileImageUrl: imageUri } };
      }

      // Generate unique filename
      const fileExt = blob.type.split('/')[1] || 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-photos/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, blob, {
          contentType: blob.type,
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return { success: false, error: uploadError.message };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      // Update user record with new image URL
      const updateResponse = await apiClient.put<User>(
        '/functions/v1/profile',
        { profileImageUrl: publicUrl },
        { Authorization: `Bearer ${token}` },
      );
      if (!updateResponse.success) {
        return { success: false, error: updateResponse.error || 'Failed to update profile photo URL' };
      }

      return { success: true, data: { profileImageUrl: publicUrl } };
    } catch (error: any) {
      console.error('Profile photo upload error:', error);
      return { success: false, error: error.message || 'Failed to upload profile photo' };
    }
  }

  // Update profile with photo URL (for direct URL updates)
  async updateProfilePhoto(profileImageUrl: string): Promise<ApiResponse<User>> {
    const token = await authService.getToken();
    if (!token) return { success: false, error: 'Authentication required' };
    return apiClient.put<User>('/functions/v1/profile', { profileImageUrl }, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Update privacy settings
  async updatePrivacySettings(settings: any): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      return await apiClient.put<{ message: string }>(
        '/functions/v1/account/privacy-settings',
        settings,
        { Authorization: `Bearer ${token}` },
      );
    } catch (error: any) {
      console.error('Privacy settings update error:', error);
      return { success: false, error: error.message || 'Failed to update privacy settings' };
    }
  }
}

export const userService = new UserService();
