// Location Service
// Handles location tracking and geolocation features

import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, ApiResponse } from './api';
import { authService } from './authService';
import { Merchant } from './types';
import { Platform } from 'react-native'; // Import Platform

// Define Location type for clarity and consistency
interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  timestamp: number;
  isStale?: boolean; // For cached data during errors
}

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: number;
  accuracy?: number; // Added for Supabase broadcast
}

class LocationService {
  private currentLocation: LocationData | null = null;

  // Request location permissions
  async requestLocationPermission(): Promise<boolean> {
    try {
      // For web platform, check if geolocation is available
      if (typeof window !== 'undefined' && 'geolocation' in navigator) {
        // Browser will prompt for permission when getCurrentPosition is called
        // However, we can attempt to pre-check permission status if the Permissions API is available
        if ('permissions' in navigator) {
          try {
            const permissionStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
            if (permissionStatus.state === 'denied') {
              console.warn('Web geolocation permission denied.');
              return false; // Explicitly deny if already denied
            }
          } catch (permError) {
            // Permissions API might not be fully supported, proceed with caution
            console.log('Permissions API check skipped:', permError);
          }
        }
        return true; // Assume permission can be granted when requested
      }

      // For native platforms, request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  // Get current location
  async getCurrentLocation(): Promise<Location | null> {
    try {
      if (Platform.OS === 'web') {
        // First check if geolocation is available
        if (!navigator.geolocation) {
          console.error('Geolocation not supported');
          return null;
        }

        // Check permission state before requesting location
        if ('permissions' in navigator) {
          try {
            const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
            if (permission.state === 'denied') {
              console.warn('Location permission denied by user');
              return null;
            }
          } catch (permError) {
            console.warn('Could not check permission state:', permError);
            // Continue anyway - some browsers don't support permissions API
          }
        }

        return await this.getWebLocation();
      } else {
        return await this.getNativeLocation();
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  private async getWebLocation(): Promise<Location | null> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Location request timed out after 15 seconds'));
      }, 15000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          });
        },
        (error) => {
          clearTimeout(timeoutId);
          let errorMessage = 'Unknown location error';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location unavailable. Please ensure location services are enabled and you have a GPS signal.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again.';
              break;
          }
          console.error('Web geolocation error:', { 
            code: error.code, 
            message: error.message,
            detailedMessage: errorMessage 
          });
          resolve(null); // Resolve with null instead of rejecting to prevent crashes
        },
        {
          enableHighAccuracy: false, // Use false for faster initial response
          timeout: 12000,
          maximumAge: 60000, // Accept cached location up to 1 minute old
        }
      );
    });
  }

  private async getNativeLocation(): Promise<Location | null> {
    const hasPermission = await this.requestLocationPermission();
    if (!hasPermission) {
      console.error('Native location permission denied');
      return null;
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: Date.now(), // Use current time for consistency
      };
    } catch (error) {
      console.error('Error getting native location:', error);
      return null;
    }
  }

  // Reverse geocode coordinates to address
  async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    try {
      // For web platform, use browser Geocoding API or fallback to a simple address
      if (typeof window !== 'undefined') {
        // Use a geocoding service API (OpenStreetMap Nominatim)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'BrillPrime/1.0'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          return data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        }
      }

      // For native platforms, use Expo Location
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });

      if (results.length > 0) {
        const address = results[0];
        return `${address.street || ''} ${address.city || ''}, ${address.region || ''} ${address.country || ''}`.trim();
      }

      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
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

  // Start live tracking
  async startLiveTracking(updateInterval: number = 5000): Promise<void> {
    if (this.isTracking) {
      console.log('Live tracking already active');
      return;
    }

    try {
      this.isTracking = true;
      this.trackingErrorCount = 0;

      // Get initial location
      const location = await this.getCurrentLocation();
      if (location) {
        // Cast location to LocationData for consistency, assuming accuracy is compatible
        const locationData: LocationData = {
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: location.timestamp,
          accuracy: location.accuracy ?? undefined, // Use provided accuracy or undefined
        };
        this.notifyLocationUpdate(locationData);
        await this.updateDriverLocationInDatabase(locationData);
        await this.broadcastLocationToSupabase(locationData);
      }

      // Set up tracking interval
      this.trackingInterval = setInterval(async () => {
        try {
          const newLocation = await this.getCurrentLocation();
          if (newLocation) {
            // Only update if location has changed significantly (>10 meters)
            const shouldUpdate = !this.currentLocation || 
              this.calculateDistance(
                this.currentLocation.latitude,
                this.currentLocation.longitude,
                newLocation.latitude,
                newLocation.longitude
              ) > 0.01; // ~10 meters

            if (shouldUpdate) {
              const locationData: LocationData = {
                latitude: newLocation.latitude,
                longitude: newLocation.longitude,
                timestamp: newLocation.timestamp,
                accuracy: newLocation.accuracy ?? undefined,
              };
              this.notifyLocationUpdate(locationData);
              await this.updateDriverLocationInDatabase(locationData);
              await this.broadcastLocationToSupabase(locationData);
              this.lastLocationUpdate = Date.now();
              this.trackingErrorCount = 0;
            }
          }
        } catch (error) {
          console.error('Error in tracking interval:', error);
          this.trackingErrorCount++;

          if (this.trackingErrorCount >= this.maxTrackingErrors) {
            console.error('Too many tracking errors, stopping live tracking');
            this.stopLiveTracking();
          }
        }
      }, updateInterval);

      console.log('Live tracking started');
    } catch (error) {
      console.error('Error starting live tracking:', error);
      this.isTracking = false;
      throw error;
    }
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
        // Disabled backend API call to prevent 401 errors when not authenticated
        // await apiClient.put('/api/location/live', {
        //   latitude: latestLocation.latitude,
        //   longitude: latestLocation.longitude,
        //   timestamp: latestLocation.timestamp,
        //   accuracy: 'high'
        // }, {
        //   Authorization: `Bearer ${token}`
        // });
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

  // Notify all subscribed callbacks about location update
  private notifyLocationUpdate(location: LocationData): void {
    this.currentLocation = location; // Update internal current location
    this.trackingCallbacks.forEach(callback => callback(location));
  }

  // Update live location on server
  private async updateDriverLocationInDatabase(location: LocationData): Promise<void> {
    try {
      const token = await authService.getToken();
      if (token) {
        // Disabled backend API call to prevent 401 errors when not authenticated
        // await apiClient.put('/api/location/live', {
        //   latitude: location.latitude,
        //   longitude: location.longitude,
        //   timestamp: location.timestamp
        // }, {
        //   Authorization: `Bearer ${token}`
        // });
      }
    } catch (error) {
      console.error('Failed to update live location:', error);
    }
  }

  /**
   * Broadcast location update to Supabase real-time channel
   */
  private async broadcastLocationToSupabase(location: LocationData): Promise<void> {
    try {
      // Dynamically import to avoid potential circular dependencies or issues on non-web platforms
      const auth = await import('./authService');
      const user = await auth.authService.getStoredUser();
      if (!user?.id) {
        console.warn('User ID not found, cannot broadcast location.');
        return;
      }

      const supabaseModule = await import('../config/supabase');
      const { supabase } = supabaseModule;

      // Check if supabase client is available
      if (!supabase) {
        console.error('Supabase client not initialized.');
        return;
      }

      // Update driver location in database
      const { error } = await supabase
        .from('driver_locations')
        .upsert({
          driver_id: user.id,
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: new Date().toISOString(),
          accuracy: location.accuracy,
        }, {
          onConflict: 'driver_id'
        });

      if (error) {
        // Handle Supabase API errors, specifically for 401 (Unauthorized)
        if (error.code === '401' || error.message.includes('No API key found')) {
          console.error('Supabase broadcast failed: Authentication error (401). Check Supabase API key configuration.');
        } else {
          console.error('Supabase broadcast error:', error.message);
        }
        return; // Stop here if there was an error
      }

      console.log('📍 Driver location broadcasted to Supabase');
    } catch (error) {
      console.error('Error broadcasting location:', error);
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

  // Get driver location (alias for getLiveLocation for compatibility)
  async getDriverLocation(driverId: string): Promise<LocationData> {
    const response = await this.getLiveLocation(driverId);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to get driver location');
  }

  // Optimize route for multiple delivery stops
  async optimizeRoute(stops: Array<{ latitude: number; longitude: number; priority?: number }>): Promise<{
    optimizedOrder: number[];
    totalDistance: number;
    estimatedTime: number;
  }> {
    if (stops.length <= 1) {
      return { optimizedOrder: [0], totalDistance: 0, estimatedTime: 0 };
    }

    // Simple nearest neighbor algorithm for route optimization
    const visited = new Set<number>();
    const route: number[] = [];
    let currentIndex = 0;
    let totalDistance = 0;

    route.push(currentIndex);
    visited.add(currentIndex);

    while (visited.size < stops.length) {
      let nearestIndex = -1;
      let minDistance = Infinity;

      for (let i = 0; i < stops.length; i++) {
        if (visited.has(i)) continue;

        const distance = this.calculateDistance(
          stops[currentIndex].latitude,
          stops[currentIndex].longitude,
          stops[i].latitude,
          stops[i].longitude
        );

        // Consider priority (higher priority = lower effective distance)
        const effectiveDistance = stops[i].priority 
          ? distance / stops[i].priority 
          : distance;

        if (effectiveDistance < minDistance) {
          minDistance = distance;
          nearestIndex = i;
        }
      }

      if (nearestIndex !== -1) {
        route.push(nearestIndex);
        visited.add(nearestIndex);
        totalDistance += minDistance;
        currentIndex = nearestIndex;
      }
    }

    // Estimate time based on average speed of 30 km/h
    const estimatedTime = Math.round((totalDistance / 30) * 60); // in minutes

    return {
      optimizedOrder: route,
      totalDistance: parseFloat(totalDistance.toFixed(2)),
      estimatedTime,
    };
  }

  // Get nearby merchants with live locations
  async getNearbyMerchantsLive(
    latitude: number, 
    longitude: number, 
    radius: number = 10
  ): Promise<ApiResponse<Array<Merchant & { liveLocation?: Location }>>> {
    try {
      const token = await authService.getToken();

      let endpoint = `/api/merchants/nearby/live?lat=${latitude}&lng=${longitude}&radius=${radius}`;

      return apiClient.get<Array<Merchant & { liveLocation?: Location }>>(endpoint, token ? {
        Authorization: `Bearer ${token}`
      } : undefined);
    } catch (error) {
      console.error('Error getting nearby merchants with live locations:', error);
      return { success: false, error: 'Failed to get nearby merchants' };
    }
  }
}

export const locationService = new LocationService();