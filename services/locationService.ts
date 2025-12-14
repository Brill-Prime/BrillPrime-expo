// Location Service
// Handles location tracking and geolocation features

import * as Location from "expo-location";
import type { LocationObject } from "expo-location";
import { apiClient, ApiResponse } from "./api";
import { authService } from "./authService";
import { Merchant } from "./types";
import { Platform } from "react-native"; // Import Platform

// Define Location type for clarity and consistency
interface LocationDataFormat {
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
  accuracy?: number;
  heading?: number; // Direction of movement in degrees (0-360)
  speed?: number; // Speed in m/s
  isMoving?: boolean; // Whether user is currently moving
  isStale?: boolean; // For cached data during errors
}

class LocationService {
  private currentLocation: LocationData | null = null;
  private previousLocation: LocationData | null = null;
  private movementHistory: LocationData[] = [];
  private readonly MOVEMENT_THRESHOLD = 0.5; // meters - minimum distance to consider as movement
  private readonly HISTORY_SIZE = 5; // Keep last 5 locations for smoothing

  // Request location permissions
  async requestLocationPermission(): Promise<boolean> {
    try {
      // For web platform, check if geolocation is available
      if (Platform.OS === "web") {
        // Browser will prompt for permission when getCurrentPosition is called
        // However, we can attempt to pre-check permission status if the Permissions API is available
        if (typeof navigator !== "undefined" && "permissions" in navigator) {
          try {
            const permissionStatus = await navigator.permissions.query({
              name: "geolocation" as PermissionName,
            });
            if (permissionStatus.state === "denied") {
              console.warn("Web geolocation permission denied.");
              return false; // Explicitly deny if already denied
            }
          } catch (permError) {
            // Permissions API might not be fully supported, proceed with caution
            console.log("Permissions API check skipped:", permError);
          }
        }
        return true; // Assume permission can be granted when requested
      }

      // For native platforms, request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("Error requesting location permission:", error);
      return false;
    }
  }

  // Get current location
  async getCurrentLocation(): Promise<LocationObject | null> {
    try {
      if (Platform.OS === "web") {
        // First check if geolocation is available
        if (typeof navigator === "undefined" || !navigator.geolocation) {
          console.error("Geolocation not supported");
          return null;
        }

        // Check permission state before requesting location
        if (typeof navigator !== "undefined" && "permissions" in navigator) {
          try {
            const permission = await navigator.permissions.query({
              name: "geolocation" as PermissionName,
            });
            if (permission.state === "denied") {
              console.warn("Location permission denied by user");
              return null;
            }
          } catch (permError) {
            console.warn("Could not check permission state:", permError);
            // Continue anyway - some browsers don't support permissions API
          }
        }

        return await this.getWebLocation();
      } else {
        return await this.getNativeLocation();
      }
    } catch (error) {
      console.error("Error getting current location:", error);
      return null;
    }
  }

  private async getWebLocation(): Promise<LocationObject | null> {
    // Only run on web platform
    if (
      Platform.OS !== "web" ||
      typeof navigator === "undefined" ||
      !navigator.geolocation
    ) {
      return null;
    }

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        console.warn("Primary location request timed out, trying fallback...");
        // Fallback with lower accuracy requirements
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log("📍 Fallback location obtained:", {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: `±${position.coords.accuracy?.toFixed(0)}m`,
            });
            resolve({
              coords: {
                latitude: isFinite(position.coords.latitude) ? position.coords.latitude : 0,
                longitude: isFinite(position.coords.longitude) ? position.coords.longitude : 0,
                altitude: position.coords.altitude,
                accuracy: position.coords.accuracy,
                altitudeAccuracy: position.coords.altitudeAccuracy,
                heading: position.coords.heading,
                speed: position.coords.speed,
              },
              timestamp: position.timestamp,
            });
          },
          (error) => {
            console.error("Fallback location also failed:", error.message);
            resolve(null);
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 60000, // Accept cached location up to 1 minute old
          }
        );
      }, 15000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          console.log("📍 High-accuracy location obtained:", {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: `±${position.coords.accuracy?.toFixed(0)}m`,
            heading: position.coords.heading,
            speed: position.coords.speed
              ? `${position.coords.speed.toFixed(1)}m/s`
              : "N/A",
          });
          resolve({
            coords: {
              latitude: isFinite(position.coords.latitude) ? position.coords.latitude : 0,
              longitude: isFinite(position.coords.longitude) ? position.coords.longitude : 0,
              altitude: position.coords.altitude,
              accuracy: position.coords.accuracy,
              altitudeAccuracy: position.coords.altitudeAccuracy,
              heading: position.coords.heading,
              speed: position.coords.speed,
            },
            timestamp: position.timestamp,
          });
        },
        (error) => {
          // Don't clear timeout - let fallback attempt run
          let errorMessage = "Unknown location error";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              clearTimeout(timeoutId);
              errorMessage =
                "Location permission denied. Please enable location access in your browser settings.";
              console.error("Web geolocation error:", errorMessage);
              resolve(null);
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location unavailable. Waiting for fallback...";
              console.warn(errorMessage);
              break;
            case error.TIMEOUT:
              errorMessage =
                "Primary location request timed out. Waiting for fallback...";
              console.warn(errorMessage);
              break;
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000, // Cache location for 5 seconds to reduce load
        }
      );
    });
  }

  private async getNativeLocation(): Promise<LocationObject | null> {
    const hasPermission = await this.requestLocationPermission();
    if (!hasPermission) {
      console.error("Native location permission denied");
      return null;
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      console.log("📍 High-accuracy native location obtained:", {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: `±${location.coords.accuracy?.toFixed(0)}m`,
        heading: location.coords.heading,
        speed: location.coords.speed
          ? `${location.coords.speed.toFixed(1)}m/s`
          : "N/A",
      });

      return location; // Already in correct format
    } catch (error) {
      console.error("Error getting native location:", error);
      return null;
    }
  }

  // Reverse geocode coordinates to address
  async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<string | null> {
    try {
      // For web platform, use browser Geocoding API or fallback to a simple address
      if (Platform.OS === "web" && typeof window !== "undefined") {
        // Use a geocoding service API (OpenStreetMap Nominatim)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          {
            headers: {
              Accept: "application/json",
              "User-Agent": "BrillPrime/1.0",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          return (
            data.display_name ||
            `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          );
        }
      }

      // For native platforms, use Expo Location
      if (Platform.OS !== "web") {
        const results = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        if (results.length > 0) {
          const address = results[0];
          return `${address.street || ""} ${address.city || ""}, ${
            address.region || ""
          } ${address.country || ""}`.trim();
        }
      }

      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    } catch (error) {
      console.error("Error reverse geocoding:", error);
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

      return apiClient.get<Merchant[]>(
        endpoint,
        token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : undefined
      );
    } catch (error) {
      console.error("Error getting nearby merchants:", error);
      return { success: false, error: "Failed to get nearby merchants" };
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
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km

    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Calculate bearing/heading between two points
  private calculateBearing(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const dLon = this.deg2rad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(this.deg2rad(lat2));
    const x =
      Math.cos(this.deg2rad(lat1)) * Math.sin(this.deg2rad(lat2)) -
      Math.sin(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.cos(dLon);
    const bearing = Math.atan2(y, x);
    // Convert from radians to degrees and normalize to 0-360
    return ((bearing * 180) / Math.PI + 360) % 360;
  }

  // Detect if user is moving based on location history
  private detectMovement(newLocation: LocationData): {
    isMoving: boolean;
    heading?: number;
    speed?: number;
  } {
    if (!this.previousLocation) {
      return { isMoving: false };
    }

    const distance =
      this.calculateDistance(
        this.previousLocation.latitude,
        this.previousLocation.longitude,
        newLocation.latitude,
        newLocation.longitude
      ) * 1000; // Convert to meters

    const timeDiff =
      (newLocation.timestamp - this.previousLocation.timestamp) / 1000; // Convert to seconds
    const speed = timeDiff > 0 ? distance / timeDiff : 0;

    const isMoving = distance > this.MOVEMENT_THRESHOLD;

    let heading: number | undefined;
    if (isMoving) {
      heading = this.calculateBearing(
        this.previousLocation.latitude,
        this.previousLocation.longitude,
        newLocation.latitude,
        newLocation.longitude
      );

      // Smooth heading using movement history
      if (this.movementHistory.length > 0) {
        const recentHeadings = this.movementHistory
          .slice(-3)
          .filter((loc) => loc.heading !== undefined)
          .map((loc) => loc.heading!);

        if (recentHeadings.length > 0) {
          // Average recent headings for smoother direction changes
          heading =
            recentHeadings.reduce((sum, h) => sum + h, heading) /
            (recentHeadings.length + 1);
        }
      }
    }

    return { isMoving, heading, speed };
  }

  // Get cached location
  getCachedLocation(): LocationData | null {
    // Return cached location if it's less than 5 minutes old
    if (
      this.currentLocation &&
      Date.now() - this.currentLocation.timestamp < 300000
    ) {
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
  private trackingCallbacks: ((location: LocationData) => void)[] = [];
  private isTracking: boolean = false;
  private lastLocationUpdate: number = 0;
  private trackingErrorCount: number = 0;
  private maxTrackingErrors: number = 5;
  private trackingQueue: LocationData[] = [];

  // Start live tracking
  async startLiveTracking(updateInterval: number = 5000): Promise<void> {
    if (this.isTracking) {
      console.log("[LocationService] Live tracking already active");
      return;
    }

    try {
      console.log(
        "[LocationService] Starting live tracking with interval:",
        updateInterval,
        "ms"
      );
      this.isTracking = true;
      this.trackingErrorCount = 0;

      // Get initial location
      console.log("[LocationService] Requesting initial location...");
      const location = await this.getCurrentLocation();
      if (location) {
        console.log("[LocationService] ✅ Initial location obtained:", {
          latitude: location.coords.latitude.toFixed(6),
          longitude: location.coords.longitude.toFixed(6),
          accuracy: location.coords.accuracy
            ? `±${location.coords.accuracy.toFixed(0)}m`
            : "N/A",
        });

        // Cast location to LocationData for consistency, assuming accuracy is compatible
        const locationData: LocationData = {
          latitude: isFinite(location.coords.latitude) ? location.coords.latitude : 0,
          longitude: isFinite(location.coords.longitude) ? location.coords.longitude : 0,
          timestamp: location.timestamp,
          accuracy: location.coords.accuracy ?? undefined, // Use provided accuracy or undefined
        };
        this.notifyLocationUpdate(locationData);
        await this.updateDriverLocationInDatabase(locationData);
        await this.broadcastLocationToSupabase(locationData);
      } else {
        console.error("[LocationService] ❌ Failed to get initial location");
        throw new Error(
          "Unable to get initial location. Please check location permissions."
        );
      }

      // Set up tracking interval
      console.log("[LocationService] Setting up tracking interval...");
      this.trackingInterval = setInterval(async () => {
        try {
          const newLocation = await this.getCurrentLocation();
          if (newLocation) {
            const locationData: LocationData = {
              latitude: isFinite(newLocation.coords.latitude) ? newLocation.coords.latitude : 0,
              longitude: isFinite(newLocation.coords.longitude) ? newLocation.coords.longitude : 0,
              timestamp: newLocation.timestamp,
              accuracy: newLocation.coords.accuracy ?? undefined,
            };

            // Detect movement and calculate heading
            const movement = this.detectMovement(locationData);
            locationData.isMoving = movement.isMoving;
            locationData.heading = movement.heading;
            locationData.speed = movement.speed;

            // Update if location changed or if user is moving
            const shouldUpdate =
              !this.currentLocation ||
              movement.isMoving ||
              this.calculateDistance(
                this.currentLocation.latitude,
                this.currentLocation.longitude,
                locationData.latitude, // Fixed: was newLocation.latitude
                locationData.longitude // Fixed: was newLocation.longitude
              ) > 0.01; // ~10 meters

            if (shouldUpdate) {
              // Update history
              this.movementHistory.push({ ...locationData });
              if (this.movementHistory.length > this.HISTORY_SIZE) {
                this.movementHistory.shift();
              }

              // Update previous location
              this.previousLocation = this.currentLocation
                ? { ...this.currentLocation }
                : null;

              console.log("[LocationService] 📍 Location update:", {
                lat: locationData.latitude.toFixed(6),
                lng: locationData.longitude.toFixed(6),
                isMoving: movement.isMoving,
                heading: movement.heading?.toFixed(1),
                speed: movement.speed
                  ? `${movement.speed.toFixed(2)} m/s`
                  : "N/A",
              });

              this.notifyLocationUpdate(locationData);
              await this.updateDriverLocationInDatabase(locationData);
              await this.broadcastLocationToSupabase(locationData);
              this.lastLocationUpdate = Date.now();
              this.trackingErrorCount = 0;
            } else {
              console.log(
                "[LocationService] No significant change, skipping update"
              );
            }
          } else {
            console.warn(
              "[LocationService] Failed to get location in tracking interval"
            );
          }
        } catch (error) {
          console.error("[LocationService] Error in tracking interval:", error);
          this.trackingErrorCount++;

          if (this.trackingErrorCount >= this.maxTrackingErrors) {
            console.error(
              "[LocationService] Too many tracking errors, stopping live tracking"
            );
            this.stopLiveTracking();
          }
        }
      }, updateInterval);

      console.log("[LocationService] ✅ Live tracking started successfully");
    } catch (error) {
      console.error(
        "[LocationService] ❌ Error starting live tracking:",
        error
      );
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
    // Clear movement history
    this.movementHistory = [];
    this.previousLocation = null;
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
        // const latestLocation = locationsToProcess[locationsToProcess.length - 1]; // Assigned but never used
        // Disabled backend API call to prevent 401 errors when not authenticated
        // await apiClient.put('/api/location/live', {
        //   latitude: locationsToProcess[locationsToProcess.length - 1].latitude,
        //   longitude: locationsToProcess[locationsToProcess.length - 1].longitude,
        //   timestamp: locationsToProcess[locationsToProcess.length - 1].timestamp,
        //   accuracy: 'high'
        // }, {
        //   Authorization: `Bearer ${token}`
        // });
      }
    } catch (error) {
      console.error("Failed to process location queue:", error);
      // Re-queue failed locations for retry (keep only latest)
      if (locationsToProcess.length > 0) {
        this.trackingQueue.unshift(
          locationsToProcess[locationsToProcess.length - 1]
        );
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
    this.trackingCallbacks.forEach((callback) => callback(location));
  }

  // Update live location on server
  private async updateDriverLocationInDatabase(
    location: LocationData
  ): Promise<void> {
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
      console.error("Failed to update live location:", error);
    }
  }

  /**
   * Broadcast location update to Supabase real-time channel
   */
  private async broadcastLocationToSupabase(
    location: LocationData
  ): Promise<void> {
    try {
      // Dynamically import to avoid potential circular dependencies or issues on non-web platforms
      const auth = await import("./authService");
      const user = await auth.authService.getStoredUser();
      if (!user?.id) {
        console.warn("User ID not found, cannot broadcast location.");
        return;
      }

      const supabaseModule = await import("../config/supabase");
      const { supabase } = supabaseModule;

      // Check if supabase client is available
      if (!supabase) {
        console.error("Supabase client not initialized.");
        return;
      }

      // Update driver location in database
      const { error } = await supabase.from("driver_locations").upsert(
        {
          driver_id: user.id,
          latitude: isFinite(location.latitude) ? location.latitude : 0,
          longitude: isFinite(location.longitude) ? location.longitude : 0,
          timestamp: new Date().toISOString(),
          accuracy: location.accuracy,
          heading: location.heading,
          speed: location.speed,
          is_moving: location.isMoving,
        },
        {
          onConflict: "driver_id",
        }
      );

      if (error) {
        // Handle Supabase API errors, specifically for 401 (Unauthorized)
        if (
          error.code === "401" ||
          error.message.includes("No API key found")
        ) {
          console.error(
            "Supabase broadcast failed: Authentication error (401). Check Supabase API key configuration."
          );
        } else {
          console.error("Supabase broadcast error:", error.message);
        }
        return; // Stop here if there was an error
      }

      console.log("📍 Driver location broadcasted to Supabase");
    } catch (error) {
      console.error("Error broadcasting location:", error);
    }
  }

  // Enhanced live location cache
  private liveLocationCache: Map<
    string,
    { location: LocationData; timestamp: number }
  > = new Map();
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
        return { success: false, error: "Authentication required" };
      }

      const response = await apiClient.get<LocationData>(
        `/api/location/live/${userId}`,
        {
          Authorization: `Bearer ${token}`,
        }
      );

      // Cache successful response
      if (response.success && response.data) {
        this.liveLocationCache.set(userId, {
          location: response.data,
          timestamp: Date.now(),
        });
      }

      return response;
    } catch (error) {
      console.error("Error getting live location:", error);

      // Return cached data if available during error
      const cached = this.liveLocationCache.get(userId);
      if (cached) {
        return {
          success: true,
          data: { ...cached.location, isStale: true },
        };
      }

      return { success: false, error: "Failed to get live location" };
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
    throw new Error(response.error || "Failed to get driver location");
  }

  // Optimize route for multiple delivery stops
  async optimizeRoute(
    stops: { latitude: number; longitude: number; priority?: number }[]
  ): Promise<{
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
  ): Promise<
    ApiResponse<(Merchant & { liveLocation?: LocationDataFormat })[]>
  > {
    try {
      const token = await authService.getToken();

      let endpoint = `/api/merchants/nearby/live?lat=${latitude}&lng=${longitude}&radius=${radius}`;

      return apiClient.get<
        (Merchant & { liveLocation?: LocationDataFormat })[]
      >(
        endpoint,
        token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : undefined
      );
    } catch (error) {
      console.error(
        "Error getting nearby merchants with live locations:",
        error
      );
      return { success: false, error: "Failed to get nearby merchants" };
    }
  }
}

export const locationService = new LocationService();
