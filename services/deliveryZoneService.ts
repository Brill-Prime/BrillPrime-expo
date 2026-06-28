
import { supabase } from '../config/supabase';
import { ApiResponse } from './api';

interface DeliveryZone {
  id: string;
  merchant_id: string;
  name: string;
  description?: string;
  geometry: any;
  delivery_fee: number;
  min_order_amount: number;
  max_delivery_time?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ZoneCheckResult {
  zone_id: string;
  zone_name: string;
  delivery_fee: number;
  min_order_amount: number;
  max_delivery_time?: number;
}

class DeliveryZoneService {
  // Check if location is within merchant's delivery zone
  async checkDeliveryZone(
    merchantId: string,
    latitude: number,
    longitude: number
  ): Promise<ApiResponse<ZoneCheckResult | null>> {
    try {
      const { data, error } = await supabase.rpc('is_within_delivery_zone', {
        merchant_id_param: merchantId,
        lat: latitude,
        lng: longitude,
      });

      if (error) throw error;

      return {
        success: true,
        data: data?.[0] || null,
      };
    } catch (error) {
      console.error('Error checking delivery zone:', error);
      return {
        success: false,
        error: 'Failed to check delivery zone',
      };
    }
  }

  // Get all delivery zones for a merchant
  async getMerchantZones(merchantId: string): Promise<ApiResponse<DeliveryZone[]>> {
    try {
      const { data, error } = await supabase
        .from('delivery_zones')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error('Error fetching merchant zones:', error);
      return {
        success: false,
        error: 'Failed to fetch delivery zones',
      };
    }
  }

  // Create a new delivery zone (circular area)
  async createCircularZone(
    merchantId: string,
    name: string,
    centerLat: number,
    centerLng: number,
    radiusKm: number,
    deliveryFee: number,
    minOrderAmount: number = 0,
    maxDeliveryTime?: number
  ): Promise<ApiResponse<DeliveryZone>> {
    try {
      // Create a circular polygon
      const points = 32; // Number of points to approximate circle
      const coordinates: number[][] = [];
      
      for (let i = 0; i <= points; i++) {
        const angle = (i * 360) / points;
        const lat = centerLat + (radiusKm / 111) * Math.cos((angle * Math.PI) / 180);
        const lng = centerLng + (radiusKm / (111 * Math.cos((centerLat * Math.PI) / 180))) * Math.sin((angle * Math.PI) / 180);
        coordinates.push([lng, lat]);
      }

      const geometry = {
        type: 'Polygon',
        coordinates: [coordinates],
      };

      const { data, error } = await supabase
        .from('delivery_zones')
        .insert({
          merchant_id: merchantId,
          name,
          geometry: JSON.stringify(geometry),
          delivery_fee: deliveryFee,
          min_order_amount: minOrderAmount,
          max_delivery_time: maxDeliveryTime,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error creating delivery zone:', error);
      return {
        success: false,
        error: 'Failed to create delivery zone',
      };
    }
  }

  // Update delivery zone
  async updateZone(
    zoneId: string,
    updates: Partial<DeliveryZone>
  ): Promise<ApiResponse<DeliveryZone>> {
    try {
      const { data, error } = await supabase
        .from('delivery_zones')
        .update(updates)
        .eq('id', zoneId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error updating delivery zone:', error);
      return {
        success: false,
        error: 'Failed to update delivery zone',
      };
    }
  }

  // Delete delivery zone
  async deleteZone(zoneId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('delivery_zones')
        .delete()
        .eq('id', zoneId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting delivery zone:', error);
      return {
        success: false,
        error: 'Failed to delete delivery zone',
      };
    }
  }
}

export const deliveryZoneService = new DeliveryZoneService();
