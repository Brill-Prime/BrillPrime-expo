// Order Service
// Handles order management and tracking API calls

import { apiClient, ApiResponse } from './api';
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

  // Create order (handled by checkout flow now)
  async createOrder(orderData: {
    merchantId: string;
    commodityId: string;
    quantity: number;
    deliveryAddress: string;
    deliveryType: 'yourself' | 'merchant';
    paymentMethod: 'card' | 'bank_transfer' | 'cash';
    notes?: string;
    coordinates?: { latitude: number; longitude: number };
  }): Promise<ApiResponse<Order>> {
    // Use Supabase edge function
    return apiClient.post<Order>('/functions/v1/create-order', {
      items: [{
        productId: orderData.commodityId,
        quantity: orderData.quantity
      }],
      deliveryAddressId: '1', // You'll need to handle address selection
      paymentMethodId: orderData.paymentMethod,
      notes: orderData.notes
    });
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

    return apiClient.get(endpoint);
  }

  // Get order by ID
  async getOrder(orderId: string): Promise<ApiResponse<Order>> {
    return apiClient.get<Order>(`/api/orders/${orderId}`);
  }

  // Update order status (updated endpoint)
  async updateOrderStatus(orderId: string, status: 'PENDING' | 'CONFIRMED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'): Promise<ApiResponse<Order>> {
    return apiClient.put<Order>(`/api/orders/${orderId}/status`, { status });
  }

  // Cancel order (updated endpoint)
  async cancelOrder(orderId: string, reason?: string): Promise<ApiResponse<Order>> {
    return apiClient.post<Order>(`/api/orders/${orderId}/cancel`, { reason });
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
    return apiClient.get(`/api/orders/${orderId}/tracking`);
  }

  // Get order summary/stats
  async getOrderSummary(): Promise<ApiResponse<{
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    totalSpent: number;
    averageOrderValue: number;
  }>> {
    return apiClient.get('/api/orders/summary');
  }
}

export const orderService = new OrderService();
