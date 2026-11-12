
import { apiClient, ApiResponse } from './api';
import { authService } from './authService';

interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaymentMethod {
  id: string;
  type: 'CARD' | 'BANK_TRANSFER';
  accountNumber?: string;
  bankCode?: string;
  accountName?: string;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PrivacySettings {
  shareLocation: boolean;
  showOnlineStatus: boolean;
  allowNotifications: boolean;
}

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  profilePicture?: string;
  bio?: string;
  role: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

class ProfileService {
  // Get current user profile
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.get<UserProfile>('/functions/v1/profile', {
      Authorization: `Bearer ${token}`,
    });
  }

  // Update profile
  async updateProfile(data: {
    fullName?: string;
    phone?: string;
    profilePicture?: string;
    bio?: string;
  }): Promise<ApiResponse<UserProfile>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.put<UserProfile>('/functions/v1/profile', data, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Change password
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    if (data.newPassword.length < 6) {
      return { success: false, error: 'Password should be at least 6 characters long.' };
    }
    try {
      await authService.changePassword(data.currentPassword, data.newPassword);
      return { success: true, data: { message: 'Password changed successfully' } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to change password' };
    }
  }

  // Address Management
  async getAddresses(): Promise<ApiResponse<Address[]>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.get<Address[]>('/functions/v1/account/addresses', {
      Authorization: `Bearer ${token}`,
    });
  }

  async addAddress(data: {
    label: string;
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    latitude?: number;
    longitude?: number;
    isDefault?: boolean;
  }): Promise<ApiResponse<Address>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post<Address>('/functions/v1/account/addresses', data, {
      Authorization: `Bearer ${token}`,
    });
  }

  async updateAddress(addressId: string, data: {
    label?: string;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
    isDefault?: boolean;
  }): Promise<ApiResponse<Address>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.put<Address>(`/functions/v1/account/addresses/${encodeURIComponent(String(addressId))}`, data, {
      Authorization: `Bearer ${token}`,
    });
  }

  async deleteAddress(addressId: string): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.delete<{ message: string }>(`/functions/v1/account/addresses/${encodeURIComponent(String(addressId))}`, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Payment Method Management
  async getPaymentMethods(): Promise<ApiResponse<PaymentMethod[]>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.get<PaymentMethod[]>('/functions/v1/account/payment-methods', {
      Authorization: `Bearer ${token}`,
    });
  }

  async addPaymentMethod(data: {
    type: 'CARD' | 'BANK_TRANSFER';
    accountNumber?: string;
    bankCode?: string;
    accountName?: string;
    isDefault?: boolean;
  }): Promise<ApiResponse<PaymentMethod>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post<PaymentMethod>('/functions/v1/account/payment-methods', data, {
      Authorization: `Bearer ${token}`,
    });
  }

  async updatePaymentMethod(paymentMethodId: string, data: {
    accountNumber?: string;
    bankCode?: string;
    accountName?: string;
    isDefault?: boolean;
  }): Promise<ApiResponse<PaymentMethod>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.put<PaymentMethod>(`/functions/v1/account/payment-methods/${encodeURIComponent(String(paymentMethodId))}`, data, {
      Authorization: `Bearer ${token}`,
    });
  }

  async deletePaymentMethod(paymentMethodId: string): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.delete<{ message: string }>(`/functions/v1/account/payment-methods/${encodeURIComponent(String(paymentMethodId))}`, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Privacy Settings
  async getPrivacySettings(): Promise<ApiResponse<PrivacySettings>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.get<PrivacySettings>('/functions/v1/account/privacy-settings', {
      Authorization: `Bearer ${token}`,
    });
  }

  async updatePrivacySettings(data: {
    shareLocation?: boolean;
    showOnlineStatus?: boolean;
    allowNotifications?: boolean;
  }): Promise<ApiResponse<PrivacySettings>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.put<PrivacySettings>('/functions/v1/account/privacy-settings', data, {
      Authorization: `Bearer ${token}`,
    });
  }
}

export const profileService = new ProfileService();
export type { Address, PaymentMethod, PrivacySettings, UserProfile };
