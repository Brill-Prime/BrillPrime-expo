// Merchant Service
// Handles merchant and commodity-related API calls

import { apiClient, ApiResponse } from './api';
import { authService } from './authService';
import { Merchant, Commodity, MerchantCommodity } from './types';
import { migrationService } from './migrationService';

export interface MerchantProfile {
  id: string;
  businessName: string;
  category: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  operatingHours: Record<string, string>;
  services: string[];
  documents: any[];
  isVerified: boolean;
  rating: number;
  reviewCount: number;
}

class MerchantService {
  // Get nearby merchants
  async getNearbyMerchants(latitude: number, longitude: number, radius: number = 5000): Promise<ApiResponse<Merchant[]>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.get<Merchant[]>(
      `/api/merchants?lat=${latitude}&lng=${longitude}&radius=${radius}`,
      { Authorization: `Bearer ${token}` }
    );
  }

  // Get merchant by ID
  async getMerchantById(merchantId: string): Promise<ApiResponse<Merchant>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }
    return apiClient.get<Merchant>(`/api/merchants/${merchantId}`, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Get all merchants with filters
  async getMerchants(filters?: {
    type?: string;
    location?: { latitude: number; longitude: number; radius: number };
    isOpen?: boolean;
  }): Promise<ApiResponse<Merchant[]>> {
    let endpoint = '/api/merchants';
    const queryParams = new URLSearchParams();

    if (filters) {
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.location) {
        queryParams.append('lat', filters.location.latitude.toString());
        queryParams.append('lng', filters.location.longitude.toString());
        queryParams.append('radius', filters.location.radius.toString());
      }
      if (filters.isOpen !== undefined) queryParams.append('isOpen', filters.isOpen.toString());
    }

    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`;
    }

    return apiClient.get<Merchant[]>(endpoint);
  }

  // Get merchant alias
  async getMerchant(merchantId: string): Promise<ApiResponse<Merchant>> {
    return this.getMerchantById(merchantId);
  }

  // Search merchants
  async searchMerchants(query: string, filters?: any): Promise<ApiResponse<Merchant[]>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }
    const queryParams = new URLSearchParams({ q: query });
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) queryParams.append(key, filters[key]);
      });
    }
    return apiClient.get<Merchant[]>(`/api/merchants/search?${queryParams.toString()}`, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Get merchant profile
  async getMerchantProfile(merchantId: string): Promise<ApiResponse<MerchantProfile>> {
    try {
      const response = await apiClient.get(`/api/merchants/${merchantId}`);
  return { success: true, data: response.data as MerchantProfile };
    } catch (error) {
      console.error('Error getting merchant profile:', error);
      return { success: false, error: 'Failed to get merchant profile' };
    }
  }

  // Update merchant profile
  async updateMerchantProfile(profileData: Partial<MerchantProfile>): Promise<ApiResponse<MerchantProfile>> {
    try {
      const response = await apiClient.put('/api/merchants/profile', profileData);
  return { success: true, data: response.data as MerchantProfile };
    } catch (error) {
      console.error('Error updating merchant profile:', error);
      return { success: false, error: 'Failed to update merchant profile' };
    }
  }

  // Get commodities (products)
  async getCommodities(filters?: any): Promise<ApiResponse<Commodity[]>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    const queryParams = new URLSearchParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) queryParams.append(key, filters[key]);
      });
    }

    const endpoint = queryParams.toString() 
      ? `/api/products?${queryParams.toString()}`
      : '/api/products';

    return apiClient.get<Commodity[]>(endpoint, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Get commodity by ID (product)
  async getCommodityById(commodityId: string): Promise<ApiResponse<Commodity>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.get<Commodity>(`/api/products/${commodityId}`, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Get commodity alias
  async getCommodity(commodityId: string): Promise<ApiResponse<{
    commodity: Commodity;
    merchants: MerchantCommodity[];
    reviews: Array<{
      id: string;
      userName: string;
      rating: number;
      comment: string;
      date: string;
    }>;
  }>> {
    return apiClient.get(`/api/commodities/${commodityId}`);
  }

  // Get merchant commodities
  async getMerchantCommodities(merchantId: string): Promise<ApiResponse<MerchantCommodity[]>> {
    return apiClient.get<MerchantCommodity[]>(`/api/merchants/${merchantId}/commodities`);
  }

  // Search merchants and commodities
  async search(query: string, filters?: {
    type?: 'merchants' | 'commodities' | 'all';
    location?: { latitude: number; longitude: number };
  }): Promise<ApiResponse<{
    merchants: Merchant[];
    commodities: Commodity[];
  }>> {
    const params = new URLSearchParams({ q: query });

    if (filters) {
      if (filters.type) params.append('type', filters.type);
      if (filters.location) {
        params.append('lat', filters.location.latitude.toString());
        params.append('lng', filters.location.longitude.toString());
      }
    }

    return apiClient.get(`/api/search?${params.toString()}`);
  }

  // Get merchant reviews
  async getMerchantReviews(merchantId: string): Promise<ApiResponse<Array<{
    id: string;
    userName: string;
    rating: number;
    comment: string;
    date: string;
  }>>> {
    return apiClient.get(`/api/merchants/${merchantId}/reviews`);
  }

  // Submit merchant review
  async submitMerchantReview(merchantId: string, review: {
    rating: number;
    comment: string;
  }): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post(`/api/merchants/${merchantId}/reviews`, review, {
      Authorization: `Bearer ${token}`,
    });
  }
}

export const merchantService = new MerchantService();