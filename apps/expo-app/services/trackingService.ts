import { apiClient } from './api';
import { API_ENDPOINTS } from './apiEndpoints';
import type { ApiResponse } from './types';
import { realtimeService } from './realtimeService';

export interface TrackingData {
  orderId: string;
  status: string;
  driverLocation?: {
    latitude: number;
    longitude: number;
  };
  estimatedArrival?: string;
}

class TrackingService {
  private activeSubscriptions: Map<string, () => void> = new Map();

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

  async getOrderTracking(orderId: string): Promise<ApiResponse<TrackingData>> {
    return apiClient.get<TrackingData>(`${API_ENDPOINTS.ORDERS.TRACKING}/${orderId}`);
  }

  // Subscribe to realtime order tracking
  subscribeToOrderTracking(
    orderId: string,
    onUpdate: (data: TrackingData) => void
  ): () => void {
    // Unsubscribe from previous tracking if exists
    this.unsubscribeFromOrder(orderId);

    const unsubscribe = realtimeService.subscribeToOrderUpdates(
      orderId,
      (update) => {
        onUpdate({
          orderId: update.orderId,
          status: update.status,
          driverLocation: update.location,
          estimatedArrival: update.estimatedArrival,
        });
      }
    );

    this.activeSubscriptions.set(orderId, unsubscribe);

    return () => this.unsubscribeFromOrder(orderId);
  }

  // Subscribe to driver location updates
  subscribeToDriverLocation(
    driverId: string,
    onLocationUpdate: (location: { latitude: number; longitude: number; heading?: number }) => void
  ): () => void {
    const unsubscribe = realtimeService.subscribeToDriverLocation(
      driverId,
      (update) => {
        onLocationUpdate({
          latitude: update.latitude,
          longitude: update.longitude,
          heading: update.heading,
        });
      }
    );

    this.activeSubscriptions.set(`driver:${driverId}`, unsubscribe);

    return () => {
      const key = `driver:${driverId}`;
      const unsub = this.activeSubscriptions.get(key);
      if (unsub) {
        unsub();
        this.activeSubscriptions.delete(key);
      }
    };
  }

  // Unsubscribe from specific order tracking
  private unsubscribeFromOrder(orderId: string): void {
    const unsubscribe = this.activeSubscriptions.get(orderId);
    if (unsubscribe) {
      unsubscribe();
      this.activeSubscriptions.delete(orderId);
    }
  }

  // Unsubscribe from all tracking
  unsubscribeAll(): void {
    this.activeSubscriptions.forEach((unsubscribe) => unsubscribe());
    this.activeSubscriptions.clear();
  }
}

export const trackingService = new TrackingService();
export type { OrderTracking };