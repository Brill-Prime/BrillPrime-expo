// Google Maps Utility Functions
// Provides helper functions for Google Maps API interactions

import { Platform } from "react-native";

// Ensure Google Maps is loaded (only for web)
export const ensureGoogleMapsLoaded = (): Promise<void> => {
  // Return resolved promise for native platforms
  if (Platform.OS !== "web") {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.google?.maps) {
      resolve();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector(
      `script[src*="maps.googleapis.com"]`
    );
    if (existingScript) {
      // Wait for existing script to load
      const loadHandler = () => {
        resolve();
      };

      const errorHandler = () => {
        reject(new Error("Google Maps script failed to load"));
      };

      existingScript.addEventListener("load", loadHandler);
      existingScript.addEventListener("error", errorHandler);

      // Cleanup
      setTimeout(() => {
        existingScript.removeEventListener("load", loadHandler);
        existingScript.removeEventListener("error", errorHandler);
      }, 10000);
      return;
    }

    reject(new Error("Google Maps script not found"));
  });
};

// Calculate distance between two points using Google Maps Geometry library
export const calculateDistance = (
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number }
): Promise<number> => {
  // Validate coordinates
  if (!isFinite(origin.latitude) || !isFinite(origin.longitude) || 
      !isFinite(destination.latitude) || !isFinite(destination.longitude)) {
    console.error('Invalid coordinates for distance calculation:', { origin, destination });
    return Promise.resolve(0);
  }

  // Return a default value for native platforms
  if (Platform.OS !== "web") {
    // Calculate distance using haversine formula for native platforms
    const R = 6371; // Radius of the Earth in km
    const dLat = deg2rad(destination.latitude - origin.latitude);
    const dLon = deg2rad(destination.longitude - origin.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(origin.latitude)) *
        Math.cos(deg2rad(destination.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return Promise.resolve(distance * 1000); // Convert to meters
  }

  return new Promise((resolve, reject) => {
    ensureGoogleMapsLoaded()
      .then(() => {
        if (!window.google?.maps?.geometry?.spherical) {
          reject(new Error("Google Maps Geometry library not available"));
          return;
        }

        // Validate coordinates before creating LatLng objects
        const originLat = isFinite(origin.latitude) ? origin.latitude : 0;
        const originLng = isFinite(origin.longitude) ? origin.longitude : 0;
        const destLat = isFinite(destination.latitude) ? destination.latitude : 0;
        const destLng = isFinite(destination.longitude) ? destination.longitude : 0;
        
        const originLatLng = new window.google.maps.LatLng(originLat, originLng);
        const destLatLng = new window.google.maps.LatLng(destLat, destLng);

        const distance =
          window.google.maps.geometry.spherical.computeDistanceBetween(
            originLatLng,
            destLatLng
          );

        resolve(distance); // Distance in meters
      })
      .catch(reject);
  });
};

// Helper function for deg2rad
const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

// Calculate ETA using Google Maps Distance Matrix API
export const calculateETA = (
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number }
): Promise<{ duration: string; distance: string }> => {
  // Validate coordinates
  if (!isFinite(origin.latitude) || !isFinite(origin.longitude) || 
      !isFinite(destination.latitude) || !isFinite(destination.longitude)) {
    console.error('Invalid coordinates for ETA calculation:', { origin, destination });
    return Promise.reject(new Error("Invalid coordinates for ETA calculation"));
  }

  // Return a default value for native platforms
  if (Platform.OS !== "web") {
    return Promise.reject(
      new Error("ETA calculation not available on native platforms")
    );
  }

  return new Promise((resolve, reject) => {
    ensureGoogleMapsLoaded()
      .then(() => {
        if (!window.google?.maps?.DistanceMatrixService) {
          reject(
            new Error("Google Maps Distance Matrix Service not available")
          );
          return;
        }

        const distanceMatrixService =
          new window.google.maps.DistanceMatrixService();

        distanceMatrixService.getDistanceMatrix(
          {
            origins: [
              new window.google.maps.LatLng(
                isFinite(origin.latitude) ? origin.latitude : 0, 
                isFinite(origin.longitude) ? origin.longitude : 0
              ),
            ],
            destinations: [
              new window.google.maps.LatLng(
                isFinite(destination.latitude) ? destination.latitude : 0,
                isFinite(destination.longitude) ? destination.longitude : 0
              ),
            ],
            travelMode: window.google.maps.TravelMode.DRIVING,
            unitSystem: window.google.maps.UnitSystem.METRIC,
            avoidHighways: false,
            avoidTolls: false,
          },
          (response, status) => {
            if (status === "OK" && response?.rows[0]?.elements[0]) {
              const element = response.rows[0].elements[0];
              resolve({
                duration: element.duration?.text || "Unavailable",
                distance: element.distance?.text || "Unavailable",
              });
            } else {
              reject(new Error(`Distance Matrix request failed: ${status}`));
            }
          }
        );
      })
      .catch(reject);
  });
};

// Get route directions using Google Maps Directions API
export const getDirections = (
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  waypoints: { latitude: number; longitude: number }[] = []
): Promise<any> => {
  // Validate coordinates
  if (!isFinite(origin.latitude) || !isFinite(origin.longitude) || 
      !isFinite(destination.latitude) || !isFinite(destination.longitude)) {
    console.error('Invalid coordinates for directions:', { origin, destination });
    return Promise.reject(new Error("Invalid coordinates for directions"));
  }

  // Validate waypoints
  for (const point of waypoints) {
    if (!isFinite(point.latitude) || !isFinite(point.longitude)) {
      console.error('Invalid waypoint coordinates:', point);
      return Promise.reject(new Error("Invalid waypoint coordinates"));
    }
  }

  // Return a default value for native platforms
  if (Platform.OS !== "web") {
    return Promise.reject(
      new Error("Directions not available on native platforms")
    );
  }

  return new Promise((resolve, reject) => {
    ensureGoogleMapsLoaded()
      .then(() => {
        if (!window.google?.maps?.DirectionsService) {
          reject(new Error("Google Maps Directions Service not available"));
          return;
        }

        const directionsService = new window.google.maps.DirectionsService();

        const waypointsFormatted = waypoints.map((point) => ({
          location: new window.google.maps.LatLng(
            isFinite(point.latitude) ? point.latitude : 0,
            isFinite(point.longitude) ? point.longitude : 0
          ),
          stopover: true,
        }));

        directionsService.route(
          {
            origin: new window.google.maps.LatLng(
              isFinite(origin.latitude) ? origin.latitude : 0,
              isFinite(origin.longitude) ? origin.longitude : 0
            ),
            destination: new window.google.maps.LatLng(
              isFinite(destination.latitude) ? destination.latitude : 0,
              isFinite(destination.longitude) ? destination.longitude : 0
            ),
            waypoints: waypointsFormatted,
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === "OK" && result) {
              resolve(result);
            } else {
              reject(new Error(`Directions request failed: ${status}`));
            }
          }
        );
      })
      .catch(reject);
  });
};

// Helper function to validate coordinates
function isValidCoordinate(value: any): boolean {
  return typeof value === 'number' && isFinite(value);
}

export default {
  ensureGoogleMapsLoaded,
  calculateDistance,
  calculateETA,
  getDirections,
  isValidCoordinate,
};
