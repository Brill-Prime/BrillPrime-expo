
import { supabase } from '../config/supabase';
import { ApiResponse } from './api';

interface GeofencePromotion {
  promo_id: string;
  merchant_id: string;
  title: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase_amount: number;
  max_discount_amount?: number;
}

class GeofencePromotionService {
  // Get active promotions for current location
  async getLocationPromotions(
    latitude: number,
    longitude: number
  ): Promise<ApiResponse<GeofencePromotion[]>> {
    try {
      const { data, error } = await supabase.rpc('get_location_promotions', {
        lat: latitude,
        lng: longitude,
      });

      if (error) throw error;

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error('Error fetching location promotions:', error);
      return {
        success: false,
        error: 'Failed to fetch promotions',
      };
    }
  }

  // Calculate discount for a promotion
  calculateDiscount(
    promotion: GeofencePromotion,
    orderAmount: number
  ): number {
    if (orderAmount < promotion.min_purchase_amount) {
      return 0;
    }

    let discount = 0;
    if (promotion.discount_type === 'percentage') {
      discount = (orderAmount * promotion.discount_value) / 100;
    } else {
      discount = promotion.discount_value;
    }

    if (promotion.max_discount_amount && discount > promotion.max_discount_amount) {
      discount = promotion.max_discount_amount;
    }

    return discount;
  }

  // Apply promotion usage
  async applyPromotion(promotionId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.rpc('increment', {
        table_name: 'geofence_promotions',
        column_name: 'usage_count',
        row_id: promotionId,
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error applying promotion:', error);
      return {
        success: false,
        error: 'Failed to apply promotion',
      };
    }
  }
}

export const geofencePromotionService = new GeofencePromotionService();
