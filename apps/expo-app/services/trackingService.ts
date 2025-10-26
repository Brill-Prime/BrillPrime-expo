
import { apiClient, ApiResponse } from './api';
import { authService } from './authService';

interface OrderTracking {
  orderId: number;
  driverId?: number;
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  status: string;
  estimatedDelivery?: string;
  deliveryHistory: Array<{
    status: string;
    location?: {
      latitude: number;
      longitude: number;
    };
    timestamp: string;
    note?: string;
  }>;
}

class TrackingService {
  // Track order
  async trackOrder(orderId: number): Promise<ApiResponse<OrderTracking>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.get<OrderTracking>(`/api/tracking/order/${orderId}`, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Update delivery location (Driver only)
  async updateDeliveryLocation(orderId: number, data: {
    latitude: number;
    longitude: number;
    status: string;
  }): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post<{ message: string }>(`/api/tracking/${orderId}/location`, data, {
      Authorization: `Bearer ${token}`,
    });
  }
}

export const trackingService = new TrackingService();
export type { OrderTracking };
