
// Location Service
// Handles location-based services and merchant data

import * as Location from 'expo-location';
import { apiClient, ApiResponse } from './api';
import { authService } from './authService';
import { Merchant } from './types';

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: number;
}

class LocationService {
  private currentLocation: LocationData | null = null;

  // Request location permissions
  async requestLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  // Get current location
  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: Date.now()
      };

      return this.currentLocation;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  // Reverse geocode coordinates to address
  async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      
      if (results.length > 0) {
        const address = results[0];
        return `${address.street || ''} ${address.city || ''}, ${address.region || ''} ${address.country || ''}`.trim();
      }
      
      return null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  // Get nearby merchants from API
  async getNearbyMerchants(
    latitude: number, 
    longitude: number, 
    radius: number = 10,
    type?: string
  ): Promise<ApiResponse<Merchant[]>> {
    try {
      const token = await authService.getToken();
      
      let endpoint = `/api/merchants/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`;
      if (type) {
        endpoint += `&type=${type}`;
      }

      return apiClient.get<Merchant[]>(endpoint, token ? {
        Authorization: `Bearer ${token}`
      } : undefined);
    } catch (error) {
      console.error('Error getting nearby merchants:', error);
      return { success: false, error: 'Failed to get nearby merchants' };
    }
  }

  // Calculate distance between two coordinates
  calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km
    
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  // Get cached location
  getCachedLocation(): LocationData | null {
    // Return cached location if it's less than 5 minutes old
    if (this.currentLocation && (Date.now() - this.currentLocation.timestamp) < 300000) {
      return this.currentLocation;
    }
    return null;
  }

  // Clear cached location
  clearLocationCache(): void {
    this.currentLocation = null;
  }

  // Live tracking functionality
  private trackingInterval: NodeJS.Timeout | null = null;
  private trackingCallbacks: Array<(location: LocationData) => void> = [];

  // Start live location tracking
  async startLiveTracking(intervalMs: number = 5000): Promise<void> {
    if (this.trackingInterval) {
      this.stopLiveTracking();
    }

    this.trackingInterval = setInterval(async () => {
      const location = await this.getCurrentLocation();
      if (location) {
        this.trackingCallbacks.forEach(callback => callback(location));
        // Send location update to API
        await this.updateLiveLocation(location);
      }
    }, intervalMs);
  }

  // Stop live location tracking
  stopLiveTracking(): void {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
  }

  // Subscribe to live location updates
  onLocationUpdate(callback: (location: LocationData) => void): () => void {
    this.trackingCallbacks.push(callback);
    return () => {
      const index = this.trackingCallbacks.indexOf(callback);
      if (index > -1) {
        this.trackingCallbacks.splice(index, 1);
      }
    };
  }

  // Update live location on server
  private async updateLiveLocation(location: LocationData): Promise<void> {
    try {
      const token = await authService.getToken();
      if (token) {
        await apiClient.put('/api/location/live', {
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: location.timestamp
        }, {
          Authorization: `Bearer ${token}`
        });
      }
    } catch (error) {
      console.error('Failed to update live location:', error);
    }
  }

  // Get live location of a specific user (driver/consumer)
  async getLiveLocation(userId: string): Promise<ApiResponse<LocationData>> {
    try {
      const token = await authService.getToken();
      if (!token) {
        return { success: false, error: 'Authentication required' };
      }

      return apiClient.get<LocationData>(`/api/location/live/${userId}`, {
        Authorization: `Bearer ${token}`
      });
    } catch (error) {
      console.error('Error getting live location:', error);
      return { success: false, error: 'Failed to get live location' };
    }
  }

  // Get nearby merchants with live locations
  async getNearbyMerchantsLive(
    latitude: number, 
    longitude: number, 
    radius: number = 10
  ): Promise<ApiResponse<Array<Merchant & { liveLocation?: LocationData }>>> {
    try {
      const token = await authService.getToken();
      
      let endpoint = `/api/merchants/nearby/live?lat=${latitude}&lng=${longitude}&radius=${radius}`;

      return apiClient.get<Array<Merchant & { liveLocation?: LocationData }>>(endpoint, token ? {
        Authorization: `Bearer ${token}`
      } : undefined);
    } catch (error) {
      console.error('Error getting nearby merchants with live locations:', error);
      return { success: false, error: 'Failed to get nearby merchants' };
    }
  }
}

export const locationService = new LocationService();
