// Location Service
// Handles location tracking and geolocation features

import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  private isTracking: boolean = false;
  private lastLocationUpdate: number = 0;
  private trackingErrorCount: number = 0;
  private maxTrackingErrors: number = 5;
  private trackingQueue: LocationData[] = [];

  // Start live location tracking with error recovery
  async startLiveTracking(intervalMs: number = 5000): Promise<void> {
    if (this.trackingInterval) {
      this.stopLiveTracking();
    }

    this.isTracking = true;
    this.trackingErrorCount = 0;

    const trackLocation = async () => {
      try {
        const location = await this.getCurrentLocation();
        if (location && this.isTracking) {
          // Performance optimization: only update if location changed significantly
          const lastLocation = this.currentLocation;
          if (!lastLocation || 
              this.calculateDistance(
                lastLocation.latitude, 
                lastLocation.longitude, 
                location.latitude, 
                location.longitude
              ) > 0.001 || // ~100 meters
              Date.now() - this.lastLocationUpdate > 30000) { // or 30 seconds passed

            this.lastLocationUpdate = Date.now();
            this.trackingCallbacks.forEach(callback => {
              try {
                callback(location);
              } catch (error) {
                console.error('Tracking callback error:', error);
              }
            });

            // Queue location for API update with retry mechanism
            await this.queueLocationUpdate(location);
          }

          this.trackingErrorCount = 0; // Reset error count on success
        }
      } catch (error) {
        console.error('Live tracking error:', error);
        this.trackingErrorCount++;

        if (this.trackingErrorCount >= this.maxTrackingErrors) {
          console.warn('Max tracking errors reached, stopping live tracking');
          this.stopLiveTracking();
        }
      }
    };

    // Initial location update
    await trackLocation();

    // Set up interval
    this.trackingInterval = setInterval(trackLocation, intervalMs);
  }

  // Stop live location tracking
  stopLiveTracking(): void {
    this.isTracking = false;
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
    // Process any remaining queued locations
    this.processLocationQueue();
  }

  // Queue location update with batching for performance
  private async queueLocationUpdate(location: LocationData): Promise<void> {
    this.trackingQueue.push(location);

    // Process queue when it reaches batch size or after timeout
    if (this.trackingQueue.length >= 3) {
      await this.processLocationQueue();
    } else {
      // Set timeout to process queue if not full
      setTimeout(() => {
        if (this.trackingQueue.length > 0) {
          this.processLocationQueue();
        }
      }, 10000); // 10 seconds timeout
    }
  }

  // Process queued location updates
  private async processLocationQueue(): Promise<void> {
    if (this.trackingQueue.length === 0) return;

    const locationsToProcess = [...this.trackingQueue];
    this.trackingQueue = [];

    try {
      const token = await authService.getToken();
      if (token) {
        // Send batch update or just the latest location
        const latestLocation = locationsToProcess[locationsToProcess.length - 1];
        await apiClient.put('/api/location/live', {
          latitude: latestLocation.latitude,
          longitude: latestLocation.longitude,
          timestamp: latestLocation.timestamp,
          accuracy: 'high'
        }, {
          Authorization: `Bearer ${token}`
        });
      }
    } catch (error) {
      console.error('Failed to process location queue:', error);
      // Re-queue failed locations for retry (keep only latest)
      if (locationsToProcess.length > 0) {
        this.trackingQueue.unshift(locationsToProcess[locationsToProcess.length - 1]);
      }
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

  // Enhanced live location cache
  private liveLocationCache: Map<string, { location: LocationData; timestamp: number }> = new Map();
  private cacheTimeout: number = 10000; // 10 seconds

  // Get live location of a specific user with caching
  async getLiveLocation(userId: string): Promise<ApiResponse<LocationData>> {
    try {
      // Check cache first
      const cached = this.liveLocationCache.get(userId);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return { success: true, data: cached.location };
      }

      const token = await authService.getToken();
      if (!token) {
        return { success: false, error: 'Authentication required' };
      }

      const response = await apiClient.get<LocationData>(`/api/location/live/${userId}`, {
        Authorization: `Bearer ${token}`
      });

      // Cache successful response
      if (response.success && response.data) {
        this.liveLocationCache.set(userId, {
          location: response.data,
          timestamp: Date.now()
        });
      }

      return response;
    } catch (error) {
      console.error('Error getting live location:', error);

      // Return cached data if available during error
      const cached = this.liveLocationCache.get(userId);
      if (cached) {
        return { 
          success: true, 
          data: { ...cached.location, isStale: true }
        };
      }

      return { success: false, error: 'Failed to get live location' };
    }
  }

  // Clear live location cache
  clearLiveLocationCache(userId?: string): void {
    if (userId) {
      this.liveLocationCache.delete(userId);
    } else {
      this.liveLocationCache.clear();
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