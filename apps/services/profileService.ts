import { ApiResponse } from './api';
import { authService } from './authService';
import { supabaseService } from './supabaseService';
import { auth } from '../config/firebase';

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
    const user = await authService.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const { data, error } = await supabaseService.getProfile(user.id);
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as UserProfile };
  }

  // Update profile
  async updateProfile(data: {
    fullName?: string;
    phone?: string;
    profilePicture?: string;
    bio?: string;
  }): Promise<ApiResponse<UserProfile>> {
    const user = await authService.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const { data: updatedProfile, error } = await supabaseService.updateProfile(user.id, data);
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: updatedProfile as UserProfile };
  }

  // Change password
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<{ message: string }>> {
    const user = await authService.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const { error } = await supabaseService.changePassword(user.id, data.currentPassword, data.newPassword);
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: { message: 'Password changed successfully' } };
  }

  // Address Management
  async getAddresses(): Promise<ApiResponse<Address[]>> {
    const user = await authService.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const { data, error } = await supabaseService.getAddresses(user.id);
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Address[] };
  }

  async addAddress(addressData: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Address>> {
    const user = await authService.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const { data, error } = await supabaseService.addAddress(user.id, addressData);
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Address };
  }

  async updateAddress(addressId: number, addressData: Partial<Omit<Address, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<Address>> {
    const user = await authService.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const { data, error } = await supabaseService.updateAddress(addressId, addressData);
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Address };
  }

  async deleteAddress(addressId: number): Promise<ApiResponse<{ message: string }>> {
    const user = await authService.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const { error } = await supabaseService.deleteAddress(addressId);
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: { message: 'Address deleted successfully' } };
  }

  // Payment Method Management
  async getPaymentMethods(): Promise<ApiResponse<PaymentMethod[]>> {
    const user = await authService.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const { data, error } = await supabaseService.getPaymentMethods(user.id);
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as PaymentMethod[] };
  }

  async addPaymentMethod(data: Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<PaymentMethod>> {
    const user = await authService.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const { data: newPaymentMethod, error } = await supabaseService.addPaymentMethod(user.id, data);
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: newPaymentMethod as PaymentMethod };
  }

  async updatePaymentMethod(paymentMethodId: number, data: Partial<Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<PaymentMethod>> {
    const user = await authService.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const { data: updatedPaymentMethod, error } = await supabaseService.updatePaymentMethod(paymentMethodId, data);
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: updatedPaymentMethod as PaymentMethod };
  }

  async deletePaymentMethod(paymentMethodId: number): Promise<ApiResponse<{ message: string }>> {
    const user = await authService.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const { error } = await supabaseService.deletePaymentMethod(paymentMethodId);
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: { message: 'Payment method deleted successfully' } };
  }

  // Privacy Settings
  async getPrivacySettings(): Promise<ApiResponse<PrivacySettings>> {
    const user = await authService.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const { data, error } = await supabaseService.getPrivacySettings(user.id);
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as PrivacySettings };
  }

  async updatePrivacySettings(data: Partial<PrivacySettings>): Promise<ApiResponse<PrivacySettings>> {
    const user = await authService.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const { data: updatedSettings, error } = await supabaseService.updatePrivacySettings(user.id, data);
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: updatedSettings as PrivacySettings };
  }
}

export const profileService = new ProfileService();
export type { Address, PaymentMethod, PrivacySettings, UserProfile };