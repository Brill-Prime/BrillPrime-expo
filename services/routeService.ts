import { Platform } from 'react-native';

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface Route {
  points: RoutePoint[];
  distance: number;
  duration: number;
  instructions?: string[];
}

class RouteService {
  private cachedRoutes: Map<string, { route: Route; timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000;

  async getRoute(
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number },
    mode: 'driving' | 'walking' | 'bicycling' = 'driving'
  ): Promise<Route | null> {
    const cacheKey = `${from.latitude},${from.longitude}-${to.latitude},${to.longitude}-${mode}`;
    const cached = this.cachedRoutes.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.route;
    }

    try {
      const route = await this.getRouteFromOSRM(from, to, mode);
      
      if (route) {
        this.cachedRoutes.set(cacheKey, { route, timestamp: Date.now() });
      }
      
      return route;
    } catch (error) {
      console.error('Error fetching route:', error);
      return null;
    }
  }

  private async getRouteFromOSRM(
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number },
    mode: string
  ): Promise<Route | null> {
    try {
      const profile = mode === 'driving' ? 'car' : mode === 'bicycling' ? 'bike' : 'foot';
      
      const url = `https://router.project-osrm.org/route/v1/${profile}/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson&steps=true`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'BrillPrime/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`OSRM API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.routes || data.routes.length === 0) {
        return null;
      }

      const route = data.routes[0];
      const points: RoutePoint[] = route.geometry.coordinates.map((coord: number[]) => ({
        latitude: coord[1],
        longitude: coord[0],
      }));

      const instructions = route.legs?.[0]?.steps?.map((step: any) => 
        step.maneuver?.instruction || ''
      ).filter(Boolean);

      return {
        points,
        distance: route.distance,
        duration: route.duration,
        instructions,
      };
    } catch (error) {
      console.error('OSRM API error:', error);
      return null;
    }
  }

  decodePolyline(encoded: string): RoutePoint[] {
    const points: RoutePoint[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let shift = 0;
      let result = 0;
      let byte;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += deltaLat;

      shift = 0;
      result = 0;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += deltaLng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return points;
  }

  calculateRouteDistance(points: RoutePoint[]): number {
    let distance = 0;
    for (let i = 0; i < points.length - 1; i++) {
      distance += this.calculateDistance(
        points[i].latitude,
        points[i].longitude,
        points[i + 1].latitude,
        points[i + 1].longitude
      );
    }
    return distance;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);

    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  clearCache(): void {
    this.cachedRoutes.clear();
  }
}

export const routeService = new RouteService();
