// Order Service
// Handles order management and tracking — backed by Supabase directly

import { supabase } from '../config/supabase';
import { authService } from './authService';
import { ApiResponse } from './api';
import { Order } from './types';

type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'in_transit' | 'delivered' | 'cancelled' | 'rejected';

class OrderService {
  /**
   * Resolve the internal Supabase user UUID from the stored Firebase UID.
   */
  private async getInternalUserId(): Promise<string | null> {
    try {
      const userData = await authService.getStoredUser();
      if (!userData?.id) return null;

      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('firebase_uid', userData.id)
        .single();

      if (error || !data) return null;
      return data.id;
    } catch {
      return null;
    }
  }

  // Get user orders (consumer view)
  async getUserOrders(filters?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{ orders: any[]; total: number }>> {
    try {
      const userId = await this.getInternalUserId();
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      let query = supabase
        .from('orders')
        .select(`
          *,
          merchant:merchants(id, name, address, location),
          driver:users!orders_driver_id_fkey(id, first_name, last_name, phone_number),
          items:order_items(*, product:products(id, name, image_url, unit))
        `)
        .eq('consumer_id', userId)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.range(filters.offset, (filters.offset) + (filters.limit ?? 20) - 1);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: { orders: data ?? [], total: data?.length ?? 0 } };
    } catch (error) {
      console.error('Error getting user orders:', error);
      return { success: false, error: String(error) };
    }
  }

  // Get orders assigned to the current driver
  async getDriverOrders(filters?: {
    status?: string;
  }): Promise<ApiResponse<{ orders: any[]; total: number }>> {
    try {
      const userId = await this.getInternalUserId();
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      let query = supabase
        .from('orders')
        .select(`
          *,
          merchant:merchants(id, name, address, latitude, longitude),
          consumer:users!orders_consumer_id_fkey(id, first_name, last_name, phone_number),
          items:order_items(*, product:products(id, name, image_url, unit))
        `)
        .eq('driver_id', userId)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: { orders: data ?? [], total: data?.length ?? 0 } };
    } catch (error) {
      console.error('Error getting driver orders:', error);
      return { success: false, error: String(error) };
    }
  }

  // Get order by ID
  async getOrder(orderId: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          merchant:merchants(id, name, address, latitude, longitude),
          consumer:users!orders_consumer_id_fkey(id, first_name, last_name, phone_number),
          driver:users!orders_driver_id_fkey(id, first_name, last_name, phone_number),
          items:order_items(*, product:products(id, name, image_url, unit))
        `)
        .eq('id', orderId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error getting order:', error);
      return { success: false, error: String(error) };
    }
  }

  // Update order status — used by driver (mark picked up / delivered)
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus
  ): Promise<ApiResponse<any>> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating order status:', error);
      return { success: false, error: String(error) };
    }
  }

  // Cancel order
  async cancelOrder(orderId: string, reason?: string): Promise<ApiResponse<any>> {
    try {
      const updateData: any = {
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      };
      if (reason) updateData.notes = reason;

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error cancelling order:', error);
      return { success: false, error: String(error) };
    }
  }

  // Track order — returns order details + latest driver location from Supabase
  async trackOrder(orderId: string): Promise<ApiResponse<{
    order: any;
    tracking: {
      status: string;
      driverInfo?: {
        name: string;
        phone?: string;
        location?: { latitude: number; longitude: number };
      };
    };
  }>> {
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          merchant:merchants(id, name, address, latitude, longitude),
          consumer:users!orders_consumer_id_fkey(id, first_name, last_name, phone_number),
          driver:users!orders_driver_id_fkey(id, first_name, last_name, phone_number),
          items:order_items(*, product:products(id, name, image_url, unit))
        `)
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        return { success: false, error: orderError?.message ?? 'Order not found' };
      }

      let driverInfo: any = undefined;

      if (order.driver_id) {
        const { data: driverLoc } = await supabase
          .from('driver_locations')
          .select('latitude, longitude, timestamp')
          .eq('driver_id', order.driver_id)
          .single();

        driverInfo = {
          name: order.driver
            ? `${order.driver.first_name} ${order.driver.last_name}`
            : 'Driver',
          phone: order.driver?.phone_number,
          location: driverLoc
            ? { latitude: driverLoc.latitude, longitude: driverLoc.longitude }
            : undefined,
        };
      }

      return {
        success: true,
        data: {
          order,
          tracking: {
            status: order.status,
            driverInfo,
          },
        },
      };
    } catch (error) {
      console.error('Error tracking order:', error);
      return { success: false, error: String(error) };
    }
  }

  // Subscribe to real-time order status updates
  subscribeToOrderUpdates(
    orderId: string,
    callback: (order: any) => void
  ): () => void {
    const channel = supabase
      .channel(`order_status_${orderId}`)
      .on(
        'postgres_changes' as any,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload: any) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // Get order summary for current user
  async getOrderSummary(): Promise<ApiResponse<{
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    totalSpent: number;
  }>> {
    try {
      const userId = await this.getInternalUserId();
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('orders')
        .select('status, total_amount')
        .eq('consumer_id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      const orders = data ?? [];
      return {
        success: true,
        data: {
          totalOrders: orders.length,
          completedOrders: orders.filter(o => o.status === 'delivered').length,
          pendingOrders: orders.filter(o => !['delivered', 'cancelled', 'rejected'].includes(o.status)).length,
          totalSpent: orders
            .filter(o => o.status === 'delivered')
            .reduce((sum, o) => sum + (o.total_amount ?? 0), 0),
        },
      };
    } catch (error) {
      console.error('Error getting order summary:', error);
      return { success: false, error: String(error) };
    }
  }
}

export const orderService = new OrderService();
