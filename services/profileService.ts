
import { apiClient, ApiResponse } from './api';
import { authService } from './authService';

interface Address {
  id: number;
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
  id: number;
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
  id: number;
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

    return apiClient.get<UserProfile>('/api/profile', {
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

    return apiClient.put<UserProfile>('/api/profile', data, {
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

    return apiClient.post<{ message: string }>('/api/profile/change-password', data, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Address Management
  async getAddresses(): Promise<ApiResponse<Address[]>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.get<Address[]>('/api/profile/addresses', {
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

    return apiClient.post<Address>('/api/profile/addresses', data, {
      Authorization: `Bearer ${token}`,
    });
  }

  async updateAddress(addressId: number, data: {
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

    return apiClient.put<Address>(`/api/profile/addresses/${addressId}`, data, {
      Authorization: `Bearer ${token}`,
    });
  }

  async deleteAddress(addressId: number): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.delete<{ message: string }>(`/api/profile/addresses/${addressId}`, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Payment Method Management
  async getPaymentMethods(): Promise<ApiResponse<PaymentMethod[]>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.get<PaymentMethod[]>('/api/profile/payment-methods', {
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

    return apiClient.post<PaymentMethod>('/api/profile/payment-methods', data, {
      Authorization: `Bearer ${token}`,
    });
  }

  async updatePaymentMethod(paymentMethodId: number, data: {
    accountNumber?: string;
    bankCode?: string;
    accountName?: string;
    isDefault?: boolean;
  }): Promise<ApiResponse<PaymentMethod>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.put<PaymentMethod>(`/api/profile/payment-methods/${paymentMethodId}`, data, {
      Authorization: `Bearer ${token}`,
    });
  }

  async deletePaymentMethod(paymentMethodId: number): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.delete<{ message: string }>(`/api/profile/payment-methods/${paymentMethodId}`, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Privacy Settings
  async getPrivacySettings(): Promise<ApiResponse<PrivacySettings>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.get<PrivacySettings>('/api/profile/privacy-settings', {
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

    return apiClient.put<PrivacySettings>('/api/profile/privacy-settings', data, {
      Authorization: `Bearer ${token}`,
    });
  }
}

export const profileService = new ProfileService();
export type { Address, PaymentMethod, PrivacySettings, UserProfile };
