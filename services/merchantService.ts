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

                // Note: This endpoint needs to be implemented in backend
                // For now, return mock data structure
                const response = await apiClient.get<any>(`/api/merchants/${merchantId}/analytics`, {
                        Authorization: `Bearer ${token}`
                });
                return { success: response.success, data: response.data };
        } catch (error) {
                console.error('API Error:', error);
                // Return structured mock data on error until backend implements this endpoint
                return {
                        success: false,
                        data: {
                                totalSales: 0,
                                totalOrders: 0,
                                averageOrderValue: 0,
                                monthlyGrowth: 0,
                                customerRetention: 0,
                                topSellingProducts: [],
                                dailySales: [],
                                categoryBreakdown: [],
                                customerMetrics: {
                                        newCustomers: 0,
                                        returningCustomers: 0,
                                        averageOrdersPerCustomer: 0,
                                        customerSatisfaction: 0
                                },
                                inventoryMetrics: {
                                        totalItems: 0,
                                        lowStockItems: 0,
                                        outOfStockItems: 0,
                                        turnoverRate: 0
                                },
                                paymentMethods: []
                        }
                };
        }
};

// Get merchant reviews (using ratings endpoint from backend)
export const getMerchantReviews = async (merchantId: string): Promise<{ success: boolean; data?: any }> => {
        try {
                const token = await authService.getToken();
                // Backend has /api/ratings/user/:userId endpoint
                // We need to adapt this to get merchant reviews
                const response = await apiClient.get<any>(`/api/ratings/user/${merchantId}`, token ? {
                        Authorization: `Bearer ${token}`
                } : {});

                if (response.success && response.data) {
                        // Transform the ratings data to reviews format
                        return {
                                success: true,
                                data: {
                                        averageRating: calculateAverageRating(response.data),
                                        reviews: response.data.map((rating: any) => ({
                                                id: rating.id,
                                                userName: rating.user?.fullName || 'Anonymous',
                                                rating: rating.rating,
                                                comment: rating.comment,
                                                date: rating.createdAt
                                        }))
                                }
                        };
                }
                return { success: false, data: { averageRating: 0, reviews: [] } };
        } catch (error) {
                console.error('API Error:', error);
                return { success: false, data: { averageRating: 0, reviews: [] } };
        }
};

// Helper function to calculate average rating
const calculateAverageRating = (ratings: any[]): number => {
        if (!ratings || ratings.length === 0) return 0;
        const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
        return Math.round((sum / ratings.length) * 10) / 10;
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