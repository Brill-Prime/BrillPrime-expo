
import { supabase } from '../config/supabase';
import { authService } from './authService';
import { apiClient } from './api';

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

export interface AvailableDriver {
  id: string;
  userId: string;
  name: string;
  phone: string;
  vehicleType: string;
  rating: number;
  completedDeliveries: number;
  status: 'available';
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

      const query = status ? `?status=${encodeURIComponent(status)}` : '';
      const response = await apiClient.get<Order[]>(
        `/functions/v1/catalog/merchants/${encodeURIComponent(merchantResult.merchantId)}/orders${query}`
      );
      if (!response.success || !response.data) {
        return { success: false, error: response.error || 'Unable to fetch orders' };
      }

      return { success: true, orders: response.data };
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
      const merchantResult = await this.getMerchantId();
      if (!merchantResult.success || !merchantResult.merchantId) {
        return { success: false, error: merchantResult.error };
      }

      const response = await apiClient.get<Order>(
        `/functions/v1/catalog/merchants/${encodeURIComponent(merchantResult.merchantId)}/orders/${encodeURIComponent(orderId)}`
      );
      if (!response.success || !response.data) {
        return { success: false, error: response.error || 'Unable to fetch order details' };
      }

      return { success: true, order: response.data };
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
      const merchantResult = await this.getMerchantId();
      if (!merchantResult.success || !merchantResult.merchantId) {
        return { success: false, error: merchantResult.error || 'Merchant profile not found' };
      }

      const updateData: any = {
        status: status === 'accepted' ? 'CONFIRMED' : status.toUpperCase(),
        updated_at: new Date().toISOString(),
      };

      if (notes) {
        updateData.notes = notes;
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .eq('merchant_id', merchantResult.merchantId)
        .select('id')
        .maybeSingle();

      if (error) {
        console.error('Error updating order status:', error);
        return { success: false, error: error.message };
      }
      if (!data) return { success: false, error: 'Order not found for this merchant' };

      // Send notifications to consumer and driver
      await this.sendOrderStatusNotification(orderId, status, notes);

      return { success: true };
    } catch (error) {
      console.error('Error updating order status:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Send order status notification to relevant parties
   */
  private async sendOrderStatusNotification(orderId: string, status: Order['status'], notes?: string): Promise<void> {
    try {
      // Get order details
      const { data: order } = await supabase
        .from('orders')
        .select('user_id, driver_id')
        .eq('id', orderId)
        .single();

      if (!order) return;

      const normalizedStatus = status.toLowerCase();
      const statusMessages: Record<string, string> = {
        accepted: 'Your order has been accepted and is being prepared',
        rejected: notes ? `Your order was rejected: ${notes}` : 'Your order was rejected',
        preparing: 'Your order is being prepared',
        ready: 'Your order is ready for pickup',
        in_transit: 'Your order is on the way',
        delivered: 'Your order has been delivered',
      };

      const message = statusMessages[normalizedStatus] || `Order status updated to ${normalizedStatus}`;
      const orderLabel = orderId.slice(-8).toUpperCase();

      // Notify consumer
      if (order.user_id) {
        await supabase.from('notifications').insert({
          user_id: order.user_id,
          title: `Order #${orderLabel}`,
          message,
          type: 'order',
          data: { order_id: orderId, status: normalizedStatus },
          read: false,
        });
      }

      // Notify driver if assigned and status is relevant
      if (order.driver_id && ['ready', 'in_transit'].includes(normalizedStatus)) {
        const { data: driver } = await supabase
          .from('drivers')
          .select('user_id')
          .eq('id', order.driver_id)
          .maybeSingle();
        if (!driver?.user_id) return;
        await supabase.from('notifications').insert({
          user_id: driver.user_id,
          title: `Order #${orderLabel}`,
          message: normalizedStatus === 'ready' ? 'Order ready for pickup' : 'Delivery in progress',
          type: 'delivery',
          data: { order_id: orderId, status: normalizedStatus },
          read: false,
        });
      }
    } catch (error) {
      console.error('Error sending order notification:', error);
      // Don't throw - notification failure shouldn't break order update
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
   * Cancel order (for accepted/preparing orders)
   */
  async cancelOrder(orderId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if order can be cancelled
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single();

      if (fetchError || !order) {
        return { success: false, error: 'Order not found' };
      }

      // Only allow cancellation for orders that are accepted or preparing
      if (!['accepted', 'preparing'].includes(order.status)) {
        return { success: false, error: 'Order cannot be cancelled at this stage' };
      }

      return this.updateOrderStatus(orderId, 'cancelled', reason);
    } catch (error) {
      console.error('Error cancelling order:', error);
      return { success: false, error: String(error) };
    }
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
      const merchantResult = await this.getMerchantId();
      if (!merchantResult.success || !merchantResult.merchantId) {
        return { success: false, error: merchantResult.error || 'Merchant profile not found' };
      }

      const { data, error } = await supabase
        .from('orders')
        .update({
          driver_id: driverId,
          status: 'READY',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .eq('merchant_id', merchantResult.merchantId)
        .select('id')
        .maybeSingle();

      if (error) {
        console.error('Error assigning driver:', error);
        return { success: false, error: error.message };
      }
      if (!data) return { success: false, error: 'Order not found for this merchant' };

      return { success: true };
    } catch (error) {
      console.error('Error assigning driver:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get available drivers
   */
  async getAvailableDrivers(): Promise<{ success: boolean; drivers?: AvailableDriver[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select(`
          id,
          user_id,
          rating,
          total_deliveries,
          user:users(id, full_name, phone_number),
          vehicle_type,
          vehicle_plate,
          is_available
        `)
        .eq('is_available', true)
        .eq('is_verified', true);

      if (error) {
        console.error('Error fetching drivers:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        drivers: (data || []).map((driver: any) => ({
          id: driver.id,
          userId: driver.user_id,
          name: driver.user?.full_name || 'Driver',
          phone: driver.user?.phone_number || '',
          vehicleType: [driver.vehicle_type, driver.vehicle_plate].filter(Boolean).join(' · ') || 'Vehicle not provided',
          rating: Number(driver.rating) || 0,
          completedDeliveries: Number(driver.total_deliveries) || 0,
          status: 'available' as const,
        })),
      };
    } catch (error) {
      console.error('Error getting available drivers:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Subscribe to real-time order updates
   */
  subscribeToOrders(
    merchantId: string,
    callback: (payload: any) => void
  ): { unsubscribe: () => void } {
    const subscription = supabase
      .channel(`merchant_orders_${merchantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `merchant_id=eq.${merchantId}`,
        },
        callback
      )
      .subscribe();

    return {
      unsubscribe: () => {
        subscription.unsubscribe();
      },
    };
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
        const status = order.status.toLowerCase();

        if (status === 'pending') stats.pending++;
        if (status === 'accepted' || status === 'confirmed') stats.accepted++;
        if (status === 'preparing') stats.preparing++;
        if (status === 'ready') stats.ready++;
        if (status === 'in_transit') stats.in_transit++;
        if (status === 'delivered' && isToday) {
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
