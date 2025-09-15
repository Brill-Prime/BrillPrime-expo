// Merchant Service
// Handles merchant and commodity-related API calls

import { apiClient, ApiResponse } from './api';
import { authService } from './authService';
import { Merchant, Commodity, MerchantCommodity } from './types';

class MerchantService {
  // Get all merchants
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

  // Get merchant by ID
  async getMerchant(merchantId: string): Promise<ApiResponse<Merchant>> {
    return apiClient.get<Merchant>(`/api/merchants/${merchantId}`);
  }

  // Get nearby merchants
  async getNearbyMerchants(
    latitude: number, 
    longitude: number, 
    radius: number = 10
  ): Promise<ApiResponse<Merchant[]>> {
    return apiClient.get<Merchant[]>(
      `/api/merchants/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`
    );
  }

  // Get commodities
  async getCommodities(filters?: {
    category?: string;
    search?: string;
    merchantId?: string;
  }): Promise<ApiResponse<Commodity[]>> {
    let endpoint = '/api/commodities';
    const queryParams = new URLSearchParams();
    
    if (filters) {
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.merchantId) queryParams.append('merchantId', filters.merchantId);
    }
    
    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`;
    }
    
    return apiClient.get<Commodity[]>(endpoint);
  }

  // Get commodity by ID
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