// Order Service
// Handles order management and tracking API calls

import { apiClient, ApiResponse } from './api';
import { authService } from './authService';
import { Order, CreateOrderRequest } from './types';

class OrderService {
  // Create new order
  async createOrder(orderData: CreateOrderRequest): Promise<ApiResponse<Order>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post<Order>('/api/orders', orderData, {
      Authorization: `Bearer ${token}`,
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

  // Update order status
  async updateOrderStatus(orderId: string, status: Order['status']): Promise<ApiResponse<Order>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.put<Order>(`/api/orders/${orderId}/status`, { status }, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Cancel order
  async cancelOrder(orderId: string, reason?: string): Promise<ApiResponse<Order>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.put<Order>(`/api/orders/${orderId}/cancel`, { reason }, {
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

    return apiClient.get(`/api/orders/${orderId}/track`, {
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
}

export const orderService = new OrderService();