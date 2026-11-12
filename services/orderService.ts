// Order Service
// Handles order management and tracking — backed by Supabase directly

import { supabase } from '../config/supabase';
import { authService } from './authService';
import { apiClient, ApiResponse } from './api';
import { Order } from './types';

type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'in_transit' | 'delivered' | 'cancelled' | 'rejected';

export interface DriverProfile {
  id: string;
  is_available: boolean;
  rating: number;
  total_deliveries: number;
  vehicle_type: string | null;
  vehicle_plate: string | null;
}

function toDatabaseOrderStatus(status: string): string {
  return status.toLowerCase() === 'accepted' ? 'CONFIRMED' : status.toUpperCase();
}

function fromDatabaseOrderStatus(status: string): string {
  return status.toUpperCase() === 'CONFIRMED' ? 'accepted' : status.toLowerCase();
}

class OrderService {
  /**
   * Resolve the internal Supabase user UUID from the authenticated profile function.
   */
  async getInternalUserId(): Promise<string | null> {
    try {
      const response = await apiClient.get<{ id: string }>('/functions/v1/profile');
      return response.success ? response.data?.id || null : null;
    } catch {
      return null;
    }
  }

  async getInternalDriverId(): Promise<string | null> {
    const userId = await this.getInternalUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from('drivers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) {
      console.error('Error resolving driver profile:', error);
      return null;
    }
    return data?.id || null;
  }

  async getDriverProfile(): Promise<ApiResponse<DriverProfile>> {
    const driverId = await this.getInternalDriverId();
    if (!driverId) return { success: false, error: 'Driver profile not found' };

    const { data, error } = await supabase
      .from('drivers')
      .select('id, is_available, rating, total_deliveries, vehicle_type, vehicle_plate')
      .eq('id', driverId)
      .single();
    if (error) return { success: false, error: error.message };
    return { success: true, data: data as DriverProfile };
  }

  async setDriverAvailability(isAvailable: boolean): Promise<ApiResponse<void>> {
    const driverId = await this.getInternalDriverId();
    if (!driverId) return { success: false, error: 'Driver profile not found' };

    const { data, error } = await supabase
      .from('drivers')
      .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
      .eq('id', driverId)
      .select('id')
      .maybeSingle();
    if (error) return { success: false, error: error.message };
    if (!data) return { success: false, error: 'Driver profile not found' };
    return { success: true };
  }

  subscribeToDriverOrders(driverId: string, callback: () => void): () => void {
    const channel = supabase
      .channel(`driver-orders:${driverId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `driver_id=eq.${driverId}` },
        callback
      )
      .subscribe((status, error) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('Driver order realtime subscription failed:', error || status);
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }

  subscribeToDriverProfile(driverId: string, callback: () => void): () => void {
    const channel = supabase
      .channel(`driver-profile:${driverId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'drivers', filter: `id=eq.${driverId}` },
        callback
      )
      .subscribe((status, error) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('Driver profile realtime subscription failed:', error || status);
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }

  async subscribeToUserOrders(callback: () => void): Promise<() => void> {
    const userId = await this.getInternalUserId();
    if (!userId) {
      console.error('Cannot subscribe to consumer orders: user profile not found');
      return () => {};
    }

    const channel = supabase
      .channel(`consumer-orders:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${userId}` },
        callback
      )
      .subscribe((status, error) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('Consumer order realtime subscription failed:', error || status);
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
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
          merchant:merchants(id, business_name, address, location),
          items:order_items(*, product:products(id, name, image_url, unit))
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', toDatabaseOrderStatus(filters.status));
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

      const orders = (data ?? []).map(order => ({
        ...order,
        status: fromDatabaseOrderStatus(order.status),
      }));
      return { success: true, data: { orders, total: orders.length } };
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
      const driverId = await this.getInternalDriverId();
      if (!driverId) {
        return { success: false, error: 'User not authenticated' };
      }

      let query = supabase
        .from('orders')
        .select(`
          *,
          merchant:merchants(id, business_name, address, location),
          consumer:users!orders_user_id_fkey(id, full_name, phone_number),
          items:order_items(*, product:products(id, name, image_url, unit))
        `)
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', toDatabaseOrderStatus(filters.status));
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      const orders = (data ?? []).map(order => ({
        ...order,
        status: fromDatabaseOrderStatus(order.status),
      }));
      return { success: true, data: { orders, total: orders.length } };
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
          merchant:merchants(id, business_name, address, location),
          items:order_items(*, product:products(id, name, image_url, unit))
        `)
        .eq('id', orderId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      let driver: { id: string; full_name: string; phone_number?: string } | null = null;
      if (data.driver_id) {
        const { data: driverProfile, error: driverProfileError } = await supabase
          .from('drivers')
          .select('user_id')
          .eq('id', data.driver_id)
          .maybeSingle();
        if (driverProfileError) return { success: false, error: driverProfileError.message };
        const { data: driverData, error: driverError } = driverProfile?.user_id
          ? await supabase
            .from('users')
            .select('id, full_name, phone_number')
            .eq('id', driverProfile.user_id)
            .maybeSingle()
          : { data: null, error: null };
        if (driverError) return { success: false, error: driverError.message };
        driver = driverData;
      }

      return {
        success: true,
        data: { ...data, driver, status: fromDatabaseOrderStatus(data.status) },
      };
    } catch (error) {
      console.error('Error getting order:', error);
      return { success: false, error: String(error) };
    }
  }

  async updateDeliveryAddress(orderId: string, address: string): Promise<ApiResponse<void>> {
    const userId = await this.getInternalUserId();
    if (!userId) return { success: false, error: 'User profile not found' };
    if (!address.trim()) return { success: false, error: 'Delivery address is required' };

    const { data, error } = await supabase
      .from('orders')
      .update({ delivery_address: address.trim(), updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('user_id', userId)
      .in('status', ['PENDING', 'CONFIRMED'])
      .select('id')
      .maybeSingle();

    if (error) return { success: false, error: error.message };
    if (!data) {
      return { success: false, error: 'Order not found or delivery address can no longer be changed' };
    }
    return { success: true };
  }

  // Update order status — used by driver (mark picked up / delivered)
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus
  ): Promise<ApiResponse<any>> {
    try {
      const driverId = await this.getInternalDriverId();
      if (!driverId) return { success: false, error: 'Driver profile not found' };

      const { data, error } = await supabase
        .from('orders')
        .update({ status: toDatabaseOrderStatus(status), updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .eq('driver_id', driverId)
        .select('id')
        .maybeSingle();

      if (error) {
        return { success: false, error: error.message };
      }
      if (!data) return { success: false, error: 'Order not assigned to this driver' };

      return { success: true };
    } catch (error) {
      console.error('Error updating order status:', error);
      return { success: false, error: String(error) };
    }
  }

  // Cancel an order owned by the current consumer while it is still cancellable.
  async cancelOrder(orderId: string, reason?: string): Promise<ApiResponse<void>> {
    try {
      const userId = await this.getInternalUserId();
      if (!userId) return { success: false, error: 'User profile not found' };

      const updateData: Record<string, string> = {
        status: 'CANCELLED',
        updated_at: new Date().toISOString(),
      };
      if (reason) updateData.notes = reason;

      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .eq('user_id', userId)
        .in('status', ['PENDING', 'CONFIRMED'])
        .select('id')
        .maybeSingle();

      if (error) {
        return { success: false, error: error.message };
      }
      if (!data) {
        return {
          success: false,
          error: 'Order not found or it can no longer be cancelled',
        };
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
        id: string;
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
          merchant:merchants(id, business_name, address, location),
          items:order_items(*, product:products(id, name, image_url, unit))
        `)
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        return { success: false, error: orderError?.message ?? 'Order not found' };
      }

      let driverInfo: {
        id: string;
        name: string;
        phone?: string;
        location?: { latitude: number; longitude: number };
      } | undefined;
      if (order.driver_id) {
        const { data: driverProfile, error: profileError } = await supabase
          .from('drivers')
          .select('user_id')
          .eq('id', order.driver_id)
          .maybeSingle();
        if (profileError) return { success: false, error: profileError.message };
        if (!driverProfile?.user_id) {
          return { success: false, error: 'Assigned driver profile not found' };
        }

        const [{ data: driver, error: driverError }, { data: driverLoc, error: locationError }] = await Promise.all([
          supabase.from('users').select('full_name, phone_number').eq('id', driverProfile.user_id).maybeSingle(),
          supabase.from('driver_locations').select('latitude, longitude').eq('driver_id', driverProfile.user_id).maybeSingle(),
        ]);
        if (driverError) return { success: false, error: driverError.message };
        if (locationError) return { success: false, error: locationError.message };
        driverInfo = {
          id: driverProfile.user_id,
          name: driver?.full_name || 'Driver',
          phone: driver?.phone_number || undefined,
          location: driverLoc
            ? { latitude: Number(driverLoc.latitude), longitude: Number(driverLoc.longitude) }
            : undefined,
        };
      }

      const normalizedOrder = { ...order, status: fromDatabaseOrderStatus(order.status) };
      return {
        success: true,
        data: {
          order: normalizedOrder,
          tracking: {
            status: normalizedOrder.status,
            driverInfo,
          },
        },
      };
    } catch (error) {
      console.error('Error tracking order:', error);
      return { success: false, error: String(error) };
    }
  }

  // ── Self-assignment / bidding ────────────────────────────────────────────

  /**
   * Return all orders that are ready and not yet claimed by any driver.
   * These are the "open marketplace" orders that drivers can bid on.
   */
  async getAvailableOrders(): Promise<ApiResponse<{ orders: any[] }>> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          merchant:merchants(id, business_name, address, location),
          consumer:users!orders_user_id_fkey(id, full_name, phone_number),
          items:order_items(*, product:products(id, name, image_url, unit))
        `)
        .eq('status', 'READY')
        .is('driver_id', null)
        .order('created_at', { ascending: false });

      if (error) return { success: false, error: error.message };
      return { success: true, data: { orders: data ?? [] } };
    } catch (error) {
      console.error('Error fetching available orders:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Atomically claim an available order for the current driver.
   *
   * Uses a conditional UPDATE (status=ready AND driver_id IS NULL) so that
   * if two drivers race, only one succeeds — the other gets `alreadyClaimed`.
   */
  async claimOrder(orderId: string): Promise<{ success: boolean; alreadyClaimed?: boolean; error?: string }> {
    try {
      const driverId = await this.getInternalDriverId();
      if (!driverId) return { success: false, error: 'Driver profile not found' };

      const { data, error } = await supabase
        .from('orders')
        .update({ driver_id: driverId, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .eq('status', 'ready')
        .is('driver_id', null)
        .select('id');

      if (error) return { success: false, error: error.message };

      // If no rows returned the update was blocked — another driver got there first
      if (!data || data.length === 0) {
        return { success: false, alreadyClaimed: true };
      }
      return { success: true };
    } catch (error) {
      console.error('Error claiming order:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Subscribe to real-time changes for the available-order pool.
   * Fires `callback` with the updated order row whenever an order becomes
   * available (status → ready, driver_id still null) or is taken.
   */
  subscribeToAvailableOrders(callback: (order: any, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void): () => void {
    const channel = supabase
      .channel('available_orders_pool')
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'orders', filter: 'status=eq.READY' },
        (payload: any) => {
          callback(payload.new ?? payload.old, payload.eventType);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
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
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      const orders = data ?? [];
      return {
        success: true,
        data: {
          totalOrders: orders.length,
          completedOrders: orders.filter(o => o.status.toLowerCase() === 'delivered').length,
          pendingOrders: orders.filter(o => !['delivered', 'cancelled', 'rejected'].includes(o.status.toLowerCase())).length,
          totalSpent: orders
            .filter(o => o.status.toLowerCase() === 'delivered')
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
