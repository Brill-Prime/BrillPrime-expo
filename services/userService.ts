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
      // Get current user from auth
      const user = await authService.getStoredUser();
      if (!user || !user.id) {
        return { success: false, error: 'User not found' };
      }

      // Update in Supabase
      const { supabase } = await import('../config/supabase');
      
      // Build update object with only defined fields
      const updateData: any = {
        full_name: `${data.firstName} ${data.lastName}`.trim(),
        updated_at: new Date().toISOString()
      };
      
      if (data.email) updateData.email = data.email;
      if (data.phone) updateData.phone_number = data.phone;
      if (data.profileImageUrl) updateData.profile_image_url = data.profileImageUrl;
      
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        return { success: false, error: error.message || 'Failed to update profile' };
      }

      // Also update merchant table if user is a merchant
      if (user.role === 'merchant' && data.address) {
        const { error: merchantError } = await supabase
          .from('merchants')
          .update({
            business_name: data.firstName, // For merchants, firstName is business name
            address: data.address,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (merchantError) {
          console.error('Merchant update error:', merchantError);
        }
      }

      return { 
        success: true, 
        data: {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: updatedUser.phone_number,
          profileImageUrl: updatedUser.profile_image_url
        } as User
      };
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
      const user = await authService.getStoredUser();
      if (!user || !user.id) {
        return { success: false, error: 'User not found' };
      }

      const { supabase } = await import('../config/supabase');
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Get profile error:', error);
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        data: {
          id: data.id,
          email: data.email,
          role: data.role,
          firstName: data.full_name?.split(' ')[0] || '',
          lastName: data.full_name?.split(' ').slice(1).join(' ') || '',
          phone: data.phone_number,
          profileImageUrl: data.profile_image_url
        } as User
      };
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
    return apiClient.put<{ message: string }>('/api/user/settings', settings);
  }

  // Get user settings
  async getSettings(): Promise<ApiResponse<{ 
    notifications: boolean;
    locationServices: boolean;
    emailUpdates: boolean;
  }>> {
    return apiClient.get('/api/user/settings');
  }

  // Delete user account
  async deleteAccount(): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>('/api/user/account');
  }

  // Change password
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<ApiResponse<{ message: string }>> {
    return apiClient.put<{ message: string }>('/api/user/password', data);
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
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_image_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error('Update error:', updateError);
        return { success: false, error: updateError.message };
      }

      return { success: true, data: { profileImageUrl: publicUrl } };
    } catch (error: any) {
      console.error('Profile photo upload error:', error);
      return { success: false, error: error.message || 'Failed to upload profile photo' };
    }
  }

  // Update profile with photo URL (for direct URL updates)
  async updateProfilePhoto(profileImageUrl: string): Promise<ApiResponse<User>> {
    return apiClient.put<User>('/api/auth/profile', { profileImageUrl });
  }

  // Update privacy settings
  async updatePrivacySettings(settings: any): Promise<ApiResponse<{ message: string }>> {
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
      
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('firebase_uid', user.id)
        .single();

      if (!userData) {
        return { success: false, error: 'User not found in database' };
      }

      const { error } = await supabase
        .from('user_privacy_settings')
        .upsert({
          user_id: userData.id,
          data_collection: settings.dataCollection,
          analytics: settings.analytics,
          marketing_emails: settings.marketingEmails,
          location_tracking: settings.locationTracking,
          profile_visibility: settings.profileVisibility,
          activity_status: settings.activityStatus,
          order_history: settings.orderHistory,
          share_with_partners: settings.shareWithPartners,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Privacy settings update error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: { message: 'Privacy settings updated successfully' } };
    } catch (error: any) {
      console.error('Privacy settings update error:', error);
      return { success: false, error: error.message || 'Failed to update privacy settings' };
    }
  }
}

export const userService = new UserService();
