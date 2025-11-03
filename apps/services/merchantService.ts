// Merchant service for BrillPrime app

import { ApiResponse } from './api';
import { authService } from './authService';
import { supabaseService } from './supabaseService';
import { auth } from '../config/firebase';

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
                const user = auth.currentUser;
                if (!user) {
                        console.warn('No authenticated user for fetching merchants');
                        return [];
                }
                const { data, error } = await supabaseService.from('merchants').select('*');
                if (error) {
                        console.error('Supabase Error:', error);
                        return [];
                }
                return data || [];
        } catch (error) {
                console.error('Error fetching merchants:', error);
                return [];
        }
};

// Fetch a merchant by ID
export const getMerchantById = async (id: string): Promise<Merchant | null> => {
        try {
                const user = auth.currentUser;
                if (!user) {
                        console.warn('No authenticated user for fetching merchant details');
                        return null;
                }
                const { data, error } = await supabaseService.from('merchants').select('*').eq('id', id).single();
                if (error) {
                        console.error('Supabase Error:', error);
                        return null;
                }
                return data || null;
        } catch (error) {
                console.error('Error fetching merchant by ID:', error);
                return null;
        }
};

// Create a new merchant
export const createMerchant = async (merchant: Omit<Merchant, 'id'>): Promise<Merchant | null> => {
        try {
                const user = auth.currentUser;
                if (!user) return null;

                const { data, error } = await supabaseService.from('merchants').insert([{ ...merchant, ownerId: user.uid }]).select('*').single();
                if (error) {
                        console.error('Supabase Error:', error);
                        return null;
                }
                return data || null;
        } catch (error) {
                console.error('Error creating merchant:', error);
                return null;
        }
};

// Update an existing merchant
export const updateMerchant = async (id: string, merchant: Partial<Omit<Merchant, 'id'>>): Promise<Merchant | null> => {
        try {
                const user = auth.currentUser;
                if (!user) return null;

                const { data, error } = await supabaseService.from('merchants').update(merchant).eq('id', id).select('*').single();
                if (error) {
                        console.error('Supabase Error:', error);
                        return null;
                }
                return data || null;
        } catch (error) {
                console.error('Error updating merchant:', error);
                return null;
        }
};

// Delete a merchant
export const deleteMerchant = async (id: string): Promise<boolean> => {
        try {
                const user = auth.currentUser;
                if (!user) return false;

                const { error } = await supabaseService.from('merchants').delete().eq('id', id);
                if (error) {
                        console.error('Supabase Error:', error);
                        return false;
                }
                return true;
        } catch (error) {
                console.error('Error deleting merchant:', error);
                return false;
        }
};

// Fetch all commodities
export const getCommodities = async (): Promise<{ success: boolean; data?: Commodity[] }> => {
        try {
                const { data, error } = await supabaseService.from('commodities').select('*');
                if (error) {
                        console.error('Supabase Error:', error);
                        return { success: false, data: [] };
                }
                return { success: true, data: data || [] };
        } catch (error) {
                console.error('Error fetching commodities:', error);
                return { success: false, data: [] };
        }
};

// Fetch commodities for a specific merchant
export const getMerchantCommodities = async (merchantId: string): Promise<{ success: boolean; data?: Commodity[] }> => {
        try {
                const { data, error } = await supabaseService.from('commodities').select('*').eq('merchantId', merchantId);
                if (error) {
                        console.error('Supabase Error:', error);
                        return { success: false, data: [] };
                }
                return { success: true, data: data || [] };
        } catch (error) {
                console.error('Error fetching merchant commodities:', error);
                return { success: false, data: [] };
        }
};

// Add commodity for merchant
export const addCommodity = async (merchantId: string, commodity: any): Promise<{ success: boolean; data?: Commodity }> => {
        try {
                const { data, error } = await supabaseService.from('commodities').insert([{ ...commodity, merchantId }]).select('*').single();
                if (error) {
                        console.error('Supabase Error:', error);
                        return { success: false };
                }
                return { success: true, data: data };
        } catch (error) {
                console.error('Error adding commodity:', error);
                return { success: false };
        }
};

// Update commodity
export const updateCommodity = async (merchantId: string, commodityId: string, commodity: any): Promise<{ success: boolean; data?: Commodity }> => {
        try {
                const { data, error } = await supabaseService.from('commodities').update(commodity).eq('id', commodityId).select('*').single();
                if (error) {
                        console.error('Supabase Error:', error);
                        return { success: false };
                }
                return { success: true, data: data };
        } catch (error) {
                console.error('Error updating commodity:', error);
                return { success: false };
        }
};

// Delete commodity
export const deleteCommodity = async (merchantId: string, commodityId: string): Promise<boolean> => {
        try {
                const { error } = await supabaseService.from('commodities').delete().eq('id', commodityId);
                if (error) {
                        console.error('Supabase Error:', error);
                        return false;
                }
                return true;
        } catch (error) {
                console.error('Error deleting commodity:', error);
                return false;
        }
}

// Get merchant analytics
export const getAnalytics = async (merchantId: string): Promise<{ success: boolean; data?: any }> => {
        try {
                // Supabase doesn't directly support analytics queries like a traditional backend API.
                // This would typically involve custom SQL functions or aggregating data from various tables.
                // For now, returning a placeholder or an empty result.
                console.warn('Analytics endpoint not directly supported by Supabase. Custom SQL function needed.');
                return { success: false, data: {} };
        } catch (error) {
                console.error('Error getting analytics:', error);
                return { success: false, data: {} };
        }
};

// Get merchant orders
export const getMerchantOrders = async (merchantId: string, filters?: {
        status?: string;
        limit?: number;
        offset?: number;
}): Promise<{ success: boolean; data?: any[] }> => {
        try {
                let query = supabaseService.from('orders').select('*').eq('merchantId', merchantId);

                if (filters) {
                        if (filters.status) query = query.eq('status', filters.status);
                        if (filters.limit) query = query.limit(filters.limit);
                        if (filters.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
                }

                const { data, error } = await query;

                if (error) {
                        console.error('Supabase Error:', error);
                        return { success: false, data: [] };
                }
                return { success: true, data: data || [] };
        } catch (error) {
                console.error('Error fetching merchant orders:', error);
                return { success: false, data: [] };
        }
};

// Update merchant store settings
export const updateStoreSettings = async (merchantId: string, settings: {
        businessHours?: Record<string, string>;
        deliveryRadius?: number;
        minimumOrder?: number;
        deliveryFee?: number;
        isOpen?: boolean;
        acceptsOrders?: boolean;
}): Promise<{ success: boolean; data?: any }> => {
        try {
                const { data, error } = await supabaseService.from('merchant_settings').update(settings).eq('merchantId', merchantId).select('*').single();
                if (error) {
                        console.error('Supabase Error:', error);
                        return { success: false };
                }
                return { success: true, data: data };
        } catch (error) {
                console.error('Error updating store settings:', error);
                return { success: false };
        }
};

// Get merchant store settings
export const getStoreSettings = async (merchantId: string): Promise<{ success: boolean; data?: any }> => {
        try {
                const { data, error } = await supabaseService.from('merchant_settings').select('*').eq('merchantId', merchantId).single();
                if (error) {
                        console.error('Supabase Error:', error);
                        return { success: false };
                }
                return { success: true, data: data };
        } catch (error) {
                console.error('Error getting store settings:', error);
                return { success: false };
        }
};

// Get merchant reviews (using ratings endpoint from backend)
export const getMerchantReviews = async (merchantId: string): Promise<{ success: boolean; data?: any }> => {
        try {
                const { data, error } = await supabaseService.from('ratings').select(`*, user:users(fullName)`).eq('merchantId', merchantId);
                if (error) {
                        console.error('Supabase Error:', error);
                        return { success: false, data: { averageRating: 0, reviews: [] } };
                }

                if (data && data.length > 0) {
                        return {
                                success: true,
                                data: {
                                        averageRating: calculateAverageRating(data),
                                        reviews: data.map((rating: any) => ({
                                                id: rating.id,
                                                userName: rating.user?.fullName || 'Anonymous',
                                                rating: rating.rating,
                                                comment: rating.comment,
                                                date: rating.createdAt
                                        }))
                                }
                        };
                }
                return { success: true, data: { averageRating: 0, reviews: [] } };
        } catch (error) {
                console.error('Error fetching merchant reviews:', error);
                return { success: false, data: { averageRating: 0, reviews: [] } };
        }
};

// Helper function to calculate average rating
const calculateAverageRating = (ratings: any[]): number => {
        if (!ratings || ratings.length === 0) return 0;
        const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
        return Math.round((sum / ratings.length) * 10) / 10;
};

// Submit merchant review
export const submitMerchantReview = async (merchantId: string, review: { rating: number; comment: string }): Promise<{ success: boolean; error?: string; data?: any }> => {
        try {
                const user = auth.currentUser;
                if (!user) return { success: false, error: 'Authentication required' };

                const { data, error } = await supabaseService.from('ratings').insert([{
                        merchantId,
                        userId: user.uid,
                        rating: review.rating,
                        comment: review.comment
                }]).select('*').single();

                if (error) {
                        console.error('Supabase Error:', error);
                        return { success: false, error: 'Failed to submit review' };
                }
                return { success: true, data: data };
        } catch (error) {
                console.error('Error submitting merchant review:', error);
                return { success: false, error: 'Failed to submit review' };
        }
};

// Get merchant customers
export const getCustomers = async (merchantId: string): Promise<{ success: boolean; data?: any[] }> => {
        try {
                // This assumes a 'customers' table linked to merchants, or a way to query users associated with a merchant.
                // Adjust the Supabase query based on your actual database schema.
                const { data, error } = await supabaseService.from('users').select('*').eq('merchantId', merchantId);
                if (error) {
                        console.error('Supabase Error:', error);
                        return { success: false, data: [] };
                }
                return { success: true, data: data || [] };
        } catch (error) {
                console.error('Error fetching customers:', error);
                return { success: false, data: [] };
        }
};

// Fetch nearby merchants
export const getNearbyMerchants = async (latitude: number, longitude: number, radius?: number): Promise<Merchant[]> => {
        try {
                // Supabase does not have built-in geospatial functions like PostGIS out-of-the-box.
                // You would typically need to enable PostGIS extension in your Supabase project
                // and use SQL queries with geospatial operators.
                // For simplicity here, we'll simulate this by fetching all merchants and filtering client-side,
                // or you'd construct a more complex SQL query for Supabase.
                console.warn('Geospatial queries require Supabase PostGIS extension or custom SQL. Fetching all merchants as a fallback.');

                const { data, error } = await supabaseService.from('merchants').select('*');
                if (error) {
                        console.error('Supabase Error:', error);
                        return [];
                }

                // Basic client-side filtering if PostGIS is not enabled
                if (data && radius) {
                        const merchantsWithDistance = data.map(merchant => {
                                // Simple distance calculation (Haversine formula recommended for accuracy)
                                const R = 6371; // Radius of the earth in km
                                const dLat = deg2rad(latitude - (merchant.latitude as number)); // Assuming merchant has lat/lng
                                const dLon = deg2rad(longitude - (merchant.longitude as number));
                                const a =
                                        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                                        Math.cos(deg2rad(latitude)) * Math.cos(deg2rad(merchant.latitude as number)) *
                                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
                                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                                const distance = R * c; // Distance in km

                                return { ...merchant, distance };
                        });
                        return merchantsWithDistance.filter(merchant => (merchant.distance as number) <= radius);
                }

                return data || [];

        } catch (error) {
                console.error('Error fetching nearby merchants:', error);
                return [];
        }
};

// Helper for deg2rad
const deg2rad = (deg: number): number => {
        return deg * (Math.PI / 180);
}

export const merchantService = {
        getMerchants,
        getMerchantById,
        getNearbyMerchants,
        createMerchant,
        updateMerchant,
        deleteMerchant,
        getCommodities,
        getMerchantCommodities,
        addCommodity,
        updateCommodity,
        deleteCommodity,
        getAnalytics,
        getMerchantOrders,
        updateStoreSettings,
        getStoreSettings,
        getMerchantReviews,
        submitMerchantReview,
        getCustomers
};