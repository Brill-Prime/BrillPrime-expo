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

// Define API Endpoints (assuming this structure based on the provided changes)
const API_ENDPOINTS = {
  PROFILE: {
    GET: '/api/profile',
    CHANGE_PASSWORD: '/api/profile/change-password',
    ADDRESSES: {
      LIST: '/api/profile/addresses',
      CREATE: '/api/profile/addresses',
      UPDATE: (id: number) => `/api/profile/addresses/${id}`,
      DELETE: (id: number) => `/api/profile/addresses/${id}`,
    },
    PAYMENT_METHODS: {
      LIST: '/api/profile/payment-methods',
      CREATE: '/api/profile/payment-methods',
      UPDATE: (id: number) => `/api/profile/payment-methods/${id}`,
      DELETE: (id: number) => `/api/profile/payment-methods/${id}`,
    },
    PRIVACY_SETTINGS: {
      GET: '/api/profile/privacy-settings',
      UPDATE: '/api/profile/privacy-settings',
    },
  },
};


class ProfileService {
  // Get current user profile
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.get<UserProfile>(API_ENDPOINTS.PROFILE.GET, {
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

    return apiClient.put<UserProfile>(API_ENDPOINTS.PROFILE.GET, data, {
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

    return apiClient.post<{ message: string }>(API_ENDPOINTS.PROFILE.CHANGE_PASSWORD, data, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Address Management
  async getAddresses(): Promise<ApiResponse<Address[]>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.get<Address[]>(API_ENDPOINTS.PROFILE.ADDRESSES.LIST, {
      Authorization: `Bearer ${token}`,
    });
  }

  async addAddress(addressData: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Address>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post<Address>(API_ENDPOINTS.PROFILE.ADDRESSES.CREATE, addressData, {
      Authorization: `Bearer ${token}`,
    });
  }

  async updateAddress(addressId: number, addressData: Partial<Omit<Address, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<Address>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.put<Address>(API_ENDPOINTS.PROFILE.ADDRESSES.UPDATE(addressId), addressData, {
      Authorization: `Bearer ${token}`,
    });
  }

  async deleteAddress(addressId: number): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.delete<{ message: string }>(API_ENDPOINTS.PROFILE.ADDRESSES.DELETE(addressId), {
      Authorization: `Bearer ${token}`,
    });
  }

  // Payment Method Management
  async getPaymentMethods(): Promise<ApiResponse<PaymentMethod[]>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.get<PaymentMethod[]>(API_ENDPOINTS.PROFILE.PAYMENT_METHODS.LIST, {
      Authorization: `Bearer ${token}`,
    });
  }

  async addPaymentMethod(data: Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<PaymentMethod>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post<PaymentMethod>(API_ENDPOINTS.PROFILE.PAYMENT_METHODS.CREATE, data, {
      Authorization: `Bearer ${token}`,
    });
  }

  async updatePaymentMethod(paymentMethodId: number, data: Partial<Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<PaymentMethod>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.put<PaymentMethod>(API_ENDPOINTS.PROFILE.PAYMENT_METHODS.UPDATE(paymentMethodId), data, {
      Authorization: `Bearer ${token}`,
    });
  }

  async deletePaymentMethod(paymentMethodId: number): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.delete<{ message: string }>(API_ENDPOINTS.PROFILE.PAYMENT_METHODS.DELETE(paymentMethodId), {
      Authorization: `Bearer ${token}`,
    });
  }

  // Privacy Settings
  async getPrivacySettings(): Promise<ApiResponse<PrivacySettings>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.get<PrivacySettings>(API_ENDPOINTS.PROFILE.PRIVACY_SETTINGS.GET, {
      Authorization: `Bearer ${token}`,
    });
  }

  async updatePrivacySettings(data: Partial<PrivacySettings>): Promise<ApiResponse<PrivacySettings>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.put<PrivacySettings>(API_ENDPOINTS.PROFILE.PRIVACY_SETTINGS.UPDATE, data, {
      Authorization: `Bearer ${token}`,
    });
  }
}

export const profileService = new ProfileService();
export type { Address, PaymentMethod, PrivacySettings, UserProfile };