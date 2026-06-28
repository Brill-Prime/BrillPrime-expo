
import { supabase } from '../config/supabase';
import { ApiResponse } from './api';

interface HeatmapPoint {
  latitude: number;
  longitude: number;
  order_count: number;
  total_value: number;
  intensity?: number;
}

interface HeatmapBounds {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

class HeatmapService {
  // Get raw heatmap data
  async getHeatmapData(
    bounds: HeatmapBounds,
    daysBack: number = 30
  ): Promise<ApiResponse<HeatmapPoint[]>> {
    try {
      const { data, error } = await supabase.rpc('get_heatmap_data', {
        min_lat: bounds.minLat,
        min_lng: bounds.minLng,
        max_lat: bounds.maxLat,
        max_lng: bounds.maxLng,
        days_back: daysBack,
      });

      if (error) throw error;

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
      return {
        success: false,
        error: 'Failed to fetch heatmap data',
      };
    }
  }

  // Get clustered heatmap data (better for large areas)
  async getClusteredHeatmap(
    bounds: HeatmapBounds,
    gridSize: number = 0.01,
    daysBack: number = 30
  ): Promise<ApiResponse<HeatmapPoint[]>> {
    try {
      const { data, error } = await supabase.rpc('get_clustered_heatmap', {
        min_lat: bounds.minLat,
        min_lng: bounds.minLng,
        max_lat: bounds.maxLat,
        max_lng: bounds.maxLng,
        grid_size: gridSize,
        days_back: daysBack,
      });

      if (error) throw error;

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error('Error fetching clustered heatmap:', error);
      return {
        success: false,
        error: 'Failed to fetch heatmap data',
      };
    }
  }

  // Track order location for heatmap
  async trackOrderLocation(
    orderId: string,
    latitude: number,
    longitude: number,
    orderValue: number
  ): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.from('order_locations').insert({
        order_id: orderId,
        location: `POINT(${longitude} ${latitude})`,
        order_value: orderValue,
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error tracking order location:', error);
      return {
        success: false,
        error: 'Failed to track order location',
      };
    }
  }
}

export const heatmapService = new HeatmapService();
