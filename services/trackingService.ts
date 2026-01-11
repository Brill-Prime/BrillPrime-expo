
import { apiClient, ApiResponse } from './api';

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
    return apiClient.get<OrderTracking>(`/api/tracking/order/${orderId}`);
  }

  // Update delivery location (Driver only)
  async updateDeliveryLocation(orderId: number, data: {
    latitude: number;
    longitude: number;
    status: string;
  }): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>(`/api/tracking/${orderId}/location`, data);
  }
}

export const trackingService = new TrackingService();
export type { OrderTracking };
