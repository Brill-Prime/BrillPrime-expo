// Order Service
// Handles order management and tracking API calls

import { ApiResponse } from './api';
import { authService } from './authService';
import { supabaseService } from './supabaseService';
import { auth } from '../config/firebase';
import { Order, CreateOrderRequest } from './types';
import { firebaseSupabaseSync } from './firebaseSupabaseSync';

class OrderService {
  // Validate order data
  private validateOrderData(orderData: CreateOrderRequest): { isValid: boolean; error?: string } {
    const { validateAddress, validateNumber, validatePhone, validateName } = require('../utils/validation');

    if (!orderData.merchantId) {
      return { isValid: false, error: 'Merchant selection is required' };
    }

    if (!orderData.commodityId) {
      return { isValid: false, error: 'Commodity selection is required' };
    }

    const quantityValidation = validateNumber(
      orderData.quantity.toString(),
      'Quantity',
      { min: 1, max: 1000, allowDecimals: true }
    );
    if (!quantityValidation.isValid) {
      return quantityValidation;
    }

    const addressValidation = validateAddress(orderData.deliveryAddress);
    if (!addressValidation.isValid) {
      return addressValidation;
    }

    if (orderData.deliveryType === 'someone_else') {
      if (!orderData.recipientName) {
        return { isValid: false, error: 'Recipient name is required' };
      }

      const nameValidation = validateName(orderData.recipientName, 'Recipient name');
      if (!nameValidation.isValid) {
        return nameValidation;
      }

      if (!orderData.recipientPhone) {
        return { isValid: false, error: 'Recipient phone number is required' };
      }

      const phoneValidation = validatePhone(orderData.recipientPhone);
      if (!phoneValidation.isValid) {
        return phoneValidation;
      }
    }

    return { isValid: true };
  }

  // Create order (updated to match backend structure)
  async createOrder(orderData: {
    items: Array<{
      productId: number;
      quantity: number;
      price: number;
    }>;
    deliveryAddressId: number;
    paymentMethodId: number;
    notes?: string;
  }): Promise<ApiResponse<Order>> {
    const user = await authService.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const { data, error } = await supabaseService.supabase
      .from('orders')
      .insert([{
        ...orderData,
        user_id: user.id,
      }])
      .select('*')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Sync to Supabase if successful
    if (data) {
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        firebaseSupabaseSync.syncOrder({
          id: data.id,
          userId: firebaseUser.uid,
          merchantId: orderData.items[0]?.productId.toString() || '', // Assuming the first item's product ID can represent merchantId for sync purposes, adjust as needed
          items: data.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
          total: data.total_amount, // Assuming total_amount is available on the created order
          status: data.status,
          deliveryAddress: orderData.deliveryAddress, // Assuming deliveryAddress is part of orderData
          createdAt: data.created_at
        }).catch(err => console.error('Failed to sync order to Supabase:', err));
      }
    }


    return { success: true, data: data as Order };
  }

  // Get user orders
  async getUserOrders(filters?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{
    orders: Order[];
    total: number;
  }>> {
    const user = await authService.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    let query = supabaseService.supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    if (filters) {
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.limit) query = query.limit(filters.limit);
      if (filters.offset) query = query.offset(filters.offset);
    }

    const { data, error, count } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: { orders: data as Order[], total: count || 0 } };
  }

  // Get order by ID
  async getOrder(orderId: string): Promise<ApiResponse<Order>> {
    const user = await authService.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const { data, error } = await supabaseService.supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Order };
  }

  // Update order status (updated endpoint)
  async updateOrderStatus(orderId: string, status: 'PENDING' | 'CONFIRMED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'): Promise<ApiResponse<Order>> {
    const user = await authService.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const { data, error } = await supabaseService.supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Sync to Supabase if successful
    if (data) {
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        firebaseSupabaseSync.syncOrder({
          id: data.id,
          userId: firebaseUser.uid,
          merchantId: data.merchantId, // Assuming merchantId is available in the updated data
          items: data.items, // Assuming items are available in the updated data
          total: data.total_amount, // Assuming total_amount is available in the updated data
          status: data.status,
          deliveryAddress: data.deliveryAddress, // Assuming deliveryAddress is available in the updated data
          createdAt: data.created_at // Assuming created_at is available in the updated data
        }).catch(err => console.error('Failed to sync order to Supabase:', err));
      }
    }

    return { success: true, data: data as Order };
  }

  // Cancel order (updated endpoint)
  async cancelOrder(orderId: string, reason?: string): Promise<ApiResponse<Order>> {
    const user = await authService.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const { data, error } = await supabaseService.supabase
      .from('orders')
      .update({ status: 'CANCELLED', cancel_reason: reason })
      .eq('id', orderId)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Sync to Supabase if successful
    if (data) {
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        firebaseSupabaseSync.syncOrder({
          id: data.id,
          userId: firebaseUser.uid,
          merchantId: data.merchantId, // Assuming merchantId is available in the updated data
          items: data.items, // Assuming items are available in the updated data
          total: data.total_amount, // Assuming total_amount is available in the updated data
          status: data.status,
          deliveryAddress: data.deliveryAddress, // Assuming deliveryAddress is available in the updated data
          createdAt: data.created_at // Assuming created_at is available in the updated data
        }).catch(err => console.error('Failed to sync order to Supabase:', err));
      }
    }

    return { success: true, data: data as Order };
  }

  // Track order
  async trackOrder(orderId: string): Promise<ApiResponse<{
    order: Order;
    tracking: {
      status: string;
      statusHistory: Array<{
        status: string;
        timestamp: string;
        description: string;
      }>;
      estimatedDelivery: string;
      driverInfo?: {
        name: string;
        phone: string;
        location?: { latitude: number; longitude: number };
      };
    };
  }>> {
    const user = await authService.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    // In a real Supabase integration, tracking info might come from a dedicated 'tracking' table
    // or be embedded within the 'orders' table if simplified.
    // For this example, we'll assume some basic tracking info is available.
    const { data, error } = await supabaseService.supabase
      .from('orders')
      .select(`
        *,
        tracking:order_tracking(*)
      `)
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Mocking tracking data structure for demonstration
    const trackingData = {
      status: data.status,
      statusHistory: data.tracking ? data.tracking.map((t: any) => ({
        status: t.status,
        timestamp: new Date(t.created_at).toISOString(),
        description: t.description,
      })) : [],
      estimatedDelivery: data.estimated_delivery,
      driverInfo: data.driver_info,
    };

    return { success: true, data: { order: data as Order, tracking: trackingData } };
  }

  // Get order summary/stats
  async getOrderSummary(): Promise<ApiResponse<{
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    totalSpent: number;
    averageOrderValue: number;
  }>> {
    const user = await authService.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const { data, error } = await supabaseService.supabase
      .from('orders')
      .select('id, status, total_amount')
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    const totalOrders = data.length;
    const completedOrders = data.filter(order => order.status === 'DELIVERED').length;
    const pendingOrders = data.filter(order => order.status !== 'DELIVERED' && order.status !== 'CANCELLED').length;
    const totalSpent = data.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

    return {
      success: true,
      data: {
        totalOrders,
        completedOrders,
        pendingOrders,
        totalSpent,
        averageOrderValue,
      },
    };
  }
}

export const orderService = new OrderService();