// Order Service
// Handles order management and tracking API calls

import { apiClient, ApiResponse } from './api';
import { authService } from './authService';
import { Order, CreateOrderRequest } from './types';

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
    deliveryAddress: string;
    deliveryInstructions?: string;
    paymentMethod: 'CARD' | 'BANK_TRANSFER';
  }): Promise<ApiResponse<{ orderId: string; amount: number }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post<{ orderId: string; amount: number }>(
      '/api/orders',
      orderData,
      { Authorization: `Bearer ${token}` }
    );
  }

  // Create order via Supabase Edge Function
  async createOrderViaFunction(orderData: {
    items: Array<{
      productId: string;
      quantity: number;
      price: number;
    }>;
    deliveryAddress: string;
    deliveryInstructions?: string;
    paymentMethod: 'CARD' | 'BANK_TRANSFER';
    userId: string;
    merchantId: string;
  }): Promise<ApiResponse<{ orderId: string; order: any }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post<{ orderId: string; order: any }>(
      '/functions/v1/create-order',
      orderData,
      { Authorization: `Bearer ${token}` }
    );
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
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    let endpoint = '/api/orders';
    const queryParams = new URLSearchParams();

    if (filters) {
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.offset) queryParams.append('offset', filters.offset.toString());
    }

    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`;
    }

    return apiClient.get(endpoint, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Get order by ID
  async getOrder(orderId: string): Promise<ApiResponse<Order>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.get<Order>(`/api/orders/${orderId}`, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Update order status (updated endpoint)
  async updateOrderStatus(orderId: string, status: 'PENDING' | 'CONFIRMED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'): Promise<ApiResponse<Order>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.put<Order>(`/api/orders/${orderId}/status`, { status }, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Cancel order (updated endpoint)
  async cancelOrder(orderId: string, reason?: string): Promise<ApiResponse<Order>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post<Order>(`/api/orders/${orderId}/cancel`, { reason }, {
      Authorization: `Bearer ${token}`,
    });
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
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.get(`/api/orders/${orderId}/tracking`, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Get order summary/stats
  async getOrderSummary(): Promise<ApiResponse<{
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    totalSpent: number;
    averageOrderValue: number;
  }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.get('/api/orders/summary', {
      Authorization: `Bearer ${token}`,
    });
  }

  // Call Supabase Edge Function to update order status
  async updateOrderStatusViaFunction(orderId: string, data: {
    newStatus: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
    driverId?: string;
    notes?: string;
  }): Promise<ApiResponse<Order>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    // Calls: https://your-project.supabase.co/functions/v1/update-order-status
    return apiClient.post<Order>(
      '/functions/v1/update-order-status',
      {
        orderId,
        newStatus: data.newStatus,
        driverId: data.driverId,
        notes: data.notes
      },
      { Authorization: `Bearer ${token}` }
    );
  }

  // Call Supabase Edge Function to assign driver
  async assignDriverViaFunction(orderId: string, deliveryLocation: {
    latitude: number;
    longitude: number;
  }): Promise<ApiResponse<any>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    // Calls: https://your-project.supabase.co/functions/v1/assign-driver
    return apiClient.post(
      '/functions/v1/assign-driver',
      { orderId, deliveryLocation },
      { Authorization: `Bearer ${token}` }
    );
  }
}

export const orderService = new OrderService();