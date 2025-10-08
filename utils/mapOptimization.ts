
// Map Performance Optimization Utilities

interface LocationPoint {
  latitude: number;
  longitude: number;
  [key: string]: any;
}

export class MapOptimizer {
  // Debounce map region changes to reduce API calls
  static debounceRegionChange(callback: Function, delay: number = 300) {
    let timeoutId: NodeJS.Timeout;
    
    return function(this: any, ...args: any[]) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => callback.apply(this, args), delay);
    };
  }

  // Throttle location updates for better performance
  static throttleLocationUpdates(callback: Function, limit: number = 1000) {
    let inThrottle: boolean;
    
    return function(this: any, ...args: any[]) {
      if (!inThrottle) {
        callback.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Cluster markers for large datasets
  static clusterMarkers(markers: LocationPoint[], gridSize: number = 0.01): any[] {
    const clusters: { [key: string]: LocationPoint[] } = {};
    
    markers.forEach(marker => {
      const gridX = Math.floor(marker.latitude / gridSize);
      const gridY = Math.floor(marker.longitude / gridSize);
      const key = `${gridX},${gridY}`;
      
      if (!clusters[key]) {
        clusters[key] = [];
      }
      clusters[key].push(marker);
    });

    return Object.values(clusters).map(clusterMarkers => {
      if (clusterMarkers.length === 1) {
        return { ...clusterMarkers[0], isCluster: false };
      }
      
      const avgLat = clusterMarkers.reduce((sum, m) => sum + m.latitude, 0) / clusterMarkers.length;
      const avgLng = clusterMarkers.reduce((sum, m) => sum + m.longitude, 0) / clusterMarkers.length;
      
      return {
        latitude: avgLat,
        longitude: avgLng,
        isCluster: true,
        clusterSize: clusterMarkers.length,
        clusterItems: clusterMarkers,
        title: `${clusterMarkers.length} items`,
      };
    });
  }

  // Calculate viewport bounds for efficient data loading
  static getViewportBounds(region: any, padding: number = 0.1) {
    const latPadding = region.latitudeDelta * padding;
    const lngPadding = region.longitudeDelta * padding;
    
    return {
      northEast: {
        latitude: region.latitude + region.latitudeDelta / 2 + latPadding,
        longitude: region.longitude + region.longitudeDelta / 2 + lngPadding,
      },
      southWest: {
        latitude: region.latitude - region.latitudeDelta / 2 - latPadding,
        longitude: region.longitude - region.longitudeDelta / 2 - lngPadding,
      },
    };
  }

  // Filter markers within viewport for performance
  static filterMarkersInViewport(markers: LocationPoint[], bounds: any): LocationPoint[] {
    return markers.filter(marker => 
      marker.latitude >= bounds.southWest.latitude &&
      marker.latitude <= bounds.northEast.latitude &&
      marker.longitude >= bounds.southWest.longitude &&
      marker.longitude <= bounds.northEast.longitude
    );
  }

  // Batch process location updates
  static batchProcessor<T>(
    items: T[], 
    processor: (batch: T[]) => Promise<void>, 
    batchSize: number = 10,
    delay: number = 100
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let index = 0;
      
      const processBatch = async () => {
        try {
          const batch = items.slice(index, index + batchSize);
          if (batch.length === 0) {
            resolve();
            return;
          }
          
          await processor(batch);
          index += batchSize;
          
          setTimeout(processBatch, delay);
        } catch (error) {
          reject(error);
        }
      };
      
      processBatch();
    });
  }

  // Memory management for marker arrays
  static optimizeMarkerArray(markers: any[], maxMarkers: number = 100): any[] {
    if (markers.length <= maxMarkers) {
      return markers;
    }
    
    // Keep most recent markers or highest priority ones
    return markers
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, maxMarkers);
  }

  // Distance-based marker filtering
  static filterByDistance(
    centerPoint: LocationPoint, 
    markers: LocationPoint[], 
    maxDistance: number
  ): LocationPoint[] {
    return markers.filter(marker => {
      const distance = this.calculateDistance(
        centerPoint.latitude,
        centerPoint.longitude,
        marker.latitude,
        marker.longitude
      );
      return distance <= maxDistance;
    });
  }

  // Calculate distance between two points (Haversine formula)
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
}

// Hook for optimized map usage
export const useMapOptimization = () => {
  const debouncedRegionChange = React.useCallback(
    MapOptimizer.debounceRegionChange((region: any, callback: Function) => {
      callback(region);
    }, 300),
    []
  );

  const throttledLocationUpdate = React.useCallback(
    MapOptimizer.throttleLocationUpdates((location: any, callback: Function) => {
      callback(location);
    }, 1000),
    []
  );

  return {
    debouncedRegionChange,
    throttledLocationUpdate,
    clusterMarkers: MapOptimizer.clusterMarkers,
    filterByDistance: MapOptimizer.filterByDistance,
    optimizeMarkerArray: MapOptimizer.optimizeMarkerArray,
  };
};
