// Merchant service for BrillPrime app

import { apiClient, ApiResponse } from './api';
import { authService } from './authService';

export interface Merchant {
        id: string;
        name: string;
        description?: string;
        logoUrl?: string;
}

export interface Commodity {
        id: string;
        name: string;
        description?: string;
        price: number;
        unit: string;
        category?: string;
        image?: string;
        merchantId: string;
}

// Fetch all merchants
export const getMerchants = async (): Promise<Merchant[]> => {
        try {
                const token = await authService.getToken();
                const response = await apiClient.get<Merchant[]>('/api/merchants', token ? {
                        Authorization: `Bearer ${token}`
                } : {});
                return response.success && response.data ? response.data : [];
        } catch (error) {
                console.error('API Error:', error);
                return [];
        }
};

// Fetch a merchant by ID
export const getMerchantById = async (id: string): Promise<Merchant | null> => {
        try {
                const token = await authService.getToken();
                const response = await apiClient.get<Merchant>(`/api/merchants/${id}`, token ? {
                        Authorization: `Bearer ${token}`
                } : {});
                return response.success && response.data ? response.data : null;
        } catch (error) {
                console.error('API Error:', error);
                return null;
        }
};

// Create a new merchant
export const createMerchant = async (merchant: Omit<Merchant, 'id'>): Promise<Merchant | null> => {
        try {
                const token = await authService.getToken();
                if (!token) return null;
                
                const response = await apiClient.post<Merchant>('/api/merchants', merchant, {
                        Authorization: `Bearer ${token}`
                });
                return response.success && response.data ? response.data : null;
        } catch (error) {
                console.error('API Error:', error);
                return null;
        }
};

// Update an existing merchant
export const updateMerchant = async (id: string, merchant: Partial<Omit<Merchant, 'id'>>): Promise<Merchant | null> => {
        try {
                const token = await authService.getToken();
                if (!token) return null;
                
                const response = await apiClient.put<Merchant>(`/api/merchants/${id}`, merchant, {
                        Authorization: `Bearer ${token}`
                });
                return response.success && response.data ? response.data : null;
        } catch (error) {
                console.error('API Error:', error);
                return null;
        }
};

// Delete a merchant
export const deleteMerchant = async (id: string): Promise<boolean> => {
        try {
                const token = await authService.getToken();
                if (!token) return false;
                
                const response = await apiClient.delete(`/api/merchants/${id}`, {
                        Authorization: `Bearer ${token}`
                });
                return response.success;
        } catch (error) {
                console.error('API Error:', error);
                return false;
        }
};

// Fetch all commodities
export const getCommodities = async (): Promise<{ success: boolean; data?: Commodity[] }> => {
        try {
                const token = await authService.getToken();
                const response = await apiClient.get<Commodity[]>('/api/commodities', token ? {
                        Authorization: `Bearer ${token}`
                } : {});
                return { success: response.success, data: response.data };
        } catch (error) {
                console.error('API Error:', error);
                return { success: false, data: [] };
        }
};

// Fetch commodities for a specific merchant
export const getMerchantCommodities = async (merchantId: string): Promise<{ success: boolean; data?: Commodity[] }> => {
        try {
                const token = await authService.getToken();
                const response = await apiClient.get<Commodity[]>(`/api/merchants/${merchantId}/commodities`, token ? {
                        Authorization: `Bearer ${token}`
                } : {});
                return { success: response.success, data: response.data };
        } catch (error) {
                console.error('API Error:', error);
                return { success: false, data: [] };
        }
};

// Add commodity for merchant
export const addCommodity = async (merchantId: string, commodity: any): Promise<{ success: boolean; data?: Commodity }> => {
        try {
                const token = await authService.getToken();
                if (!token) return { success: false };
                
                const response = await apiClient.post<Commodity>(`/api/merchants/${merchantId}/commodities`, commodity, {
                        Authorization: `Bearer ${token}`
                });
                return { success: response.success, data: response.data };
        } catch (error) {
                console.error('API Error:', error);
                return { success: false };
        }
};

// Update commodity
export const updateCommodity = async (merchantId: string, commodityId: string, commodity: any): Promise<{ success: boolean; data?: Commodity }> => {
        try {
                const token = await authService.getToken();
                if (!token) return { success: false };
                
                const response = await apiClient.put<Commodity>(`/api/merchants/${merchantId}/commodities/${commodityId}`, commodity, {
                        Authorization: `Bearer ${token}`
                });
                return { success: response.success, data: response.data };
        } catch (error) {
                console.error('API Error:', error);
                return { success: false };
        }
};

// Delete commodity
export const deleteCommodity = async (merchantId: string, commodityId: string): Promise<boolean> => {
        try {
                const token = await authService.getToken();
                if (!token) return false;
                
                const response = await apiClient.delete(`/api/merchants/${merchantId}/commodities/${commodityId}`, {
                        Authorization: `Bearer ${token}`
                });
                return response.success;
        } catch (error) {
                console.error('API Error:', error);
                return false;
        }
}

// Get merchant analytics
export const getAnalytics = async (merchantId: string): Promise<{ success: boolean; data?: any }> => {
        try {
                const token = await authService.getToken();
                if (!token) return { success: false };
                
                const response = await apiClient.get<any>(`/api/merchants/${merchantId}/analytics`, {
                        Authorization: `Bearer ${token}`
                });
                return { success: response.success, data: response.data };
        } catch (error) {
                console.error('API Error:', error);
                return { success: false };
        }
};

// Get merchant reviews
export const getMerchantReviews = async (merchantId: string): Promise<{ success: boolean; data?: any }> => {
        try {
                const token = await authService.getToken();
                const response = await apiClient.get<any>(`/api/merchants/${merchantId}/reviews`, token ? {
                        Authorization: `Bearer ${token}`
                } : {});
                return { success: response.success, data: response.data };
        } catch (error) {
                console.error('API Error:', error);
                return { success: false };
        }
};

export const merchantService = {
        getMerchants,
        getMerchantById,
        createMerchant,
        updateMerchant,
        deleteMerchant,
        getCommodities,
        getMerchantCommodities,
        addCommodity,
        updateCommodity,
        deleteCommodity,
        getAnalytics,
        getMerchantReviews
};
