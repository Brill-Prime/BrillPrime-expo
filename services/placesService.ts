import { Platform } from 'react-native';

export interface Place {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  address?: string;
  rating?: number;
  distance?: number;
  icon?: string;
  isOpen?: boolean;
}

export type PlaceCategory = 
  | 'restaurant'
  | 'gas_station'
  | 'hospital'
  | 'pharmacy'
  | 'atm'
  | 'bank'
  | 'supermarket'
  | 'hotel'
  | 'parking'
  | 'police'
  | 'all';

class PlacesService {
  private cachedPlaces: Map<string, { places: Place[]; timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000;

  async getNearbyPlaces(
    latitude: number,
    longitude: number,
    category: PlaceCategory = 'all',
    radius: number = 5000
  ): Promise<Place[]> {
    const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}-${category}-${radius}`;
    const cached = this.cachedPlaces.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.places;
    }

    try {
      if (Platform.OS === 'web' || typeof window !== 'undefined') {
        return await this.getPlacesFromOverpass(latitude, longitude, category, radius);
      }
      
      return await this.getPlacesFromOverpass(latitude, longitude, category, radius);
    } catch (error) {
      console.error('Error fetching nearby places:', error);
      return [];
    }
  }

  private async getPlacesFromOverpass(
    latitude: number,
    longitude: number,
    category: PlaceCategory,
    radius: number
  ): Promise<Place[]> {
    try {
      const overpassQuery = this.buildOverpassQuery(latitude, longitude, category, radius);
      
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(overpassQuery)}`,
      });

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status}`);
      }

      const data = await response.json();
      const places = this.parseOverpassResponse(data, latitude, longitude);
      
      const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}-${category}-${radius}`;
      this.cachedPlaces.set(cacheKey, { places, timestamp: Date.now() });
      
      return places;
    } catch (error) {
      console.error('Overpass API error:', error);
      return [];
    }
  }

  private buildOverpassQuery(
    latitude: number,
    longitude: number,
    category: PlaceCategory,
    radius: number
  ): string {
    const amenityMap: Record<string, string[]> = {
      restaurant: ['restaurant', 'cafe', 'fast_food'],
      gas_station: ['fuel'],
      hospital: ['hospital', 'clinic'],
      pharmacy: ['pharmacy'],
      atm: ['atm'],
      bank: ['bank'],
      supermarket: ['supermarket', 'convenience'],
      hotel: ['hotel'],
      parking: ['parking'],
      police: ['police'],
      all: ['restaurant', 'fuel', 'hospital', 'pharmacy', 'atm', 'bank', 'supermarket', 'hotel', 'parking'],
    };

    const amenities = amenityMap[category] || amenityMap.all;
    const amenityFilter = amenities.map(a => `["amenity"="${a}"]`).join('');
    
    return `
      [out:json][timeout:25];
      (
        node${amenityFilter}(around:${radius},${latitude},${longitude});
        way${amenityFilter}(around:${radius},${latitude},${longitude});
      );
      out body;
      >;
      out skel qt;
    `;
  }

  private parseOverpassResponse(data: any, userLat: number, userLon: number): Place[] {
    if (!data.elements) return [];

    const places: Place[] = [];
    const seenIds = new Set<string>();

    for (const element of data.elements) {
      if (!element.tags || !element.tags.name) continue;
      if (seenIds.has(element.id.toString())) continue;

      seenIds.add(element.id.toString());

      const lat = element.lat || (element.center && element.center.lat);
      const lon = element.lon || (element.center && element.center.lon);

      if (!lat || !lon) continue;

      const distance = this.calculateDistance(userLat, userLon, lat, lon);

      places.push({
        id: element.id.toString(),
        name: element.tags.name,
        category: element.tags.amenity || 'unknown',
        latitude: lat,
        longitude: lon,
        address: this.buildAddress(element.tags),
        distance,
        icon: this.getCategoryIcon(element.tags.amenity),
        isOpen: this.parseOpeningHours(element.tags.opening_hours),
      });
    }

    return places.sort((a, b) => (a.distance || 0) - (b.distance || 0)).slice(0, 50);
  }

  private buildAddress(tags: any): string {
    const parts = [
      tags['addr:street'],
      tags['addr:housenumber'],
      tags['addr:city'],
    ].filter(Boolean);
    return parts.join(', ') || undefined;
  }

  private getCategoryIcon(amenity: string): string {
    const iconMap: Record<string, string> = {
      restaurant: 'restaurant',
      cafe: 'cafe',
      fast_food: 'fast-food',
      fuel: 'gas-station',
      hospital: 'medical',
      clinic: 'medical',
      pharmacy: 'medkit',
      atm: 'cash',
      bank: 'business',
      supermarket: 'cart',
      convenience: 'storefront',
      hotel: 'bed',
      parking: 'car',
      police: 'shield',
    };
    return iconMap[amenity] || 'location';
  }

  private parseOpeningHours(openingHours?: string): boolean | undefined {
    if (!openingHours) return undefined;
    if (openingHours === '24/7') return true;
    return undefined;
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
    this.cachedPlaces.clear();
  }
}

export const placesService = new PlacesService();
