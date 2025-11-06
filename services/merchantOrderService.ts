
import { supabase } from '../config/supabase';
import { authService } from './authService';

export interface Order {
  id: string;
  order_number: string;
  consumer_id: string;
  merchant_id: string;
  driver_id?: string;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'in_transit' | 'delivered' | 'cancelled' | 'rejected';
  total_amount: number;
  delivery_fee: number;
  delivery_address: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  consumer?: {
    id: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
  };
  driver?: {
    id: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
    vehicle_type?: string;
  };
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product?: {
    id: string;
    name: string;
    image_url?: string;
    unit: string;
  };
}

export interface OrderStats {
  pending: number;
  accepted: number;
  preparing: number;
  ready: number;
  in_transit: number;
  delivered_today: number;
  total_revenue_today: number;
}

class MerchantOrderService {
  /**
   * Get merchant ID for the current user
   */
  private async getMerchantId(): Promise<{ success: boolean; merchantId?: string; error?: string }> {
    try {
      const token = await authService.getToken();
      if (!token) {
        return { success: false, error: 'User not authenticated' };
      }

      const userData = await authService.getStoredUser();
      if (!userData || !userData.id) {
        return { success: false, error: 'User data not found' };
      }

      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('firebase_uid', userData.id)
        .single();

      if (userError || !users) {
        return { success: false, error: 'User not found in database' };
      }

      const { data: merchant, error } = await supabase
        .from('merchants')
        .select('id')
        .eq('user_id', users.id)
        .single();

      if (error || !merchant) {
        return { success: false, error: 'Merchant profile not found' };
      }

      return { success: true, merchantId: merchant.id };
    } catch (error) {
      console.error('Error getting merchant ID:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get all orders for the merchant with optional status filter
   */
  async getOrders(status?: string): Promise<{ success: boolean; orders?: Order[]; error?: string }> {
    try {
      const merchantResult = await this.getMerchantId();
      if (!merchantResult.success || !merchantResult.merchantId) {
        return { success: false, error: merchantResult.error };
      }

      let query = supabase
        .from('orders')
        .select(`
          *,
          consumer:users!orders_consumer_id_fkey(id, first_name, last_name, phone_number),
          driver:users!orders_driver_id_fkey(id, first_name, last_name, phone_number)
        `)
        .eq('merchant_id', merchantResult.merchantId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching orders:', error);
        return { success: false, error: error.message };
      }

      return { success: true, orders: data as Order[] };
    } catch (error) {
      console.error('Error getting orders:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get order details with items
   */
  async getOrderDetails(orderId: string): Promise<{ success: boolean; order?: Order; error?: string }> {
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          consumer:users!orders_consumer_id_fkey(id, first_name, last_name, phone_number),
          driver:users!orders_driver_id_fkey(id, first_name, last_name, phone_number)
        `)
        .eq('id', orderId)
        .single();

      if (orderError) {
        return { success: false, error: orderError.message };
      }

      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          product:products(id, name, image_url, unit)
        `)
        .eq('order_id', orderId);

      if (itemsError) {
        return { success: false, error: itemsError.message };
      }

      const orderWithItems = {
        ...order,
        items: items as OrderItem[],
      } as Order;

      return { success: true, order: orderWithItems };
    } catch (error) {
      console.error('Error getting order details:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: Order['status'], notes?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (notes) {
        updateData.notes = notes;
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order status:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating order status:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Accept order
   */
  async acceptOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
    return this.updateOrderStatus(orderId, 'accepted');
  }

  /**
   * Reject order
   */
  async rejectOrder(orderId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    return this.updateOrderStatus(orderId, 'rejected', reason);
  }

  /**
   * Mark order as preparing
   */
  async startPreparing(orderId: string): Promise<{ success: boolean; error?: string }> {
    return this.updateOrderStatus(orderId, 'preparing');
  }

  /**
   * Mark order as ready for pickup
   */
  async markAsReady(orderId: string): Promise<{ success: boolean; error?: string }> {
    return this.updateOrderStatus(orderId, 'ready');
  }

  /**
   * Assign driver to order
   */
  async assignDriver(orderId: string, driverId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          driver_id: driverId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) {
        console.error('Error assigning driver:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error assigning driver:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get available drivers
   */
  async getAvailableDrivers(): Promise<{ success: boolean; drivers?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select(`
          id,
          user:users(id, first_name, last_name, phone_number),
          vehicle_type,
          vehicle_number,
          is_available
        `)
        .eq('is_available', true)
        .eq('is_verified', true);

      if (error) {
        console.error('Error fetching drivers:', error);
        return { success: false, error: error.message };
      }

      return { success: true, drivers: data };
    } catch (error) {
      console.error('Error getting available drivers:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get order statistics for today
   */
  async getOrderStats(): Promise<{ success: boolean; stats?: OrderStats; error?: string }> {
    try {
      const merchantResult = await this.getMerchantId();
      if (!merchantResult.success || !merchantResult.merchantId) {
        return { success: false, error: merchantResult.error };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: orders, error } = await supabase
        .from('orders')
        .select('status, total_amount, created_at')
        .eq('merchant_id', merchantResult.merchantId);

      if (error) {
        return { success: false, error: error.message };
      }

      const stats: OrderStats = {
        pending: 0,
        accepted: 0,
        preparing: 0,
        ready: 0,
        in_transit: 0,
        delivered_today: 0,
        total_revenue_today: 0,
      };

      orders.forEach(order => {
        const orderDate = new Date(order.created_at);
        const isToday = orderDate >= today;

        if (order.status === 'pending') stats.pending++;
        if (order.status === 'accepted') stats.accepted++;
        if (order.status === 'preparing') stats.preparing++;
        if (order.status === 'ready') stats.ready++;
        if (order.status === 'in_transit') stats.in_transit++;
        
        if (order.status === 'delivered' && isToday) {
          stats.delivered_today++;
          stats.total_revenue_today += order.total_amount;
        }
      });

      return { success: true, stats };
    } catch (error) {
      console.error('Error getting order stats:', error);
      return { success: false, error: String(error) };
    }
  }
}

export const merchantOrderService = new MerchantOrderService();
