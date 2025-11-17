
import { placesService, Place, PlaceCategory } from './placesService';

interface EnhancedPlace extends Place {
  prominence: number;
  relevanceScore: number;
  userRating?: number;
  priceLevel?: number;
  openNow?: boolean;
}

class EnhancedPlacesService {
  // Get places with enhanced filtering and scoring
  async getEnhancedNearbyPlaces(
    latitude: number,
    longitude: number,
    category: PlaceCategory = 'all',
    radius: number = 5000,
    filters?: {
      minRating?: number;
      openNow?: boolean;
      priceLevel?: number[];
    }
  ): Promise<EnhancedPlace[]> {
    const places = await placesService.getNearbyPlaces(latitude, longitude, category, radius);
    
    // Enhance places with additional data
    const enhancedPlaces = places.map(place => this.enhancePlace(place, latitude, longitude));
    
    // Apply filters
    let filteredPlaces = enhancedPlaces;
    
    if (filters?.minRating) {
      filteredPlaces = filteredPlaces.filter(p => (p.rating || 0) >= filters.minRating!);
    }
    
    if (filters?.openNow !== undefined) {
      filteredPlaces = filteredPlaces.filter(p => p.isOpen === filters.openNow);
    }
    
    if (filters?.priceLevel && filters.priceLevel.length > 0) {
      filteredPlaces = filteredPlaces.filter(p => 
        p.priceLevel !== undefined && filters.priceLevel!.includes(p.priceLevel)
      );
    }
    
    // Sort by relevance score
    return filteredPlaces.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private enhancePlace(place: Place, userLat: number, userLon: number): EnhancedPlace {
    const distance = place.distance || 0;
    const rating = place.rating || 0;
    
    // Calculate prominence based on distance, rating, and category
    const distanceScore = Math.max(0, 1 - (distance / 5)); // 0-1 score, higher is better
    const ratingScore = rating / 5; // 0-1 score
    
    // Category weights (some categories are more important)
    const categoryWeights: Record<string, number> = {
      hospital: 1.5,
      pharmacy: 1.3,
      gas_station: 1.2,
      restaurant: 1.0,
      atm: 1.1,
      bank: 1.1,
      supermarket: 1.0,
      hotel: 0.9,
      parking: 0.8,
      police: 1.4,
    };
    
    const categoryWeight = categoryWeights[place.category] || 1.0;
    
    // Calculate overall prominence and relevance
    const prominence = (distanceScore * 0.4 + ratingScore * 0.4) * categoryWeight;
    const relevanceScore = (distanceScore * 0.5 + ratingScore * 0.3 + (categoryWeight - 1) * 0.2);
    
    return {
      ...place,
      prominence: prominence,
      relevanceScore: relevanceScore,
      userRating: rating,
      priceLevel: this.estimatePriceLevel(place),
      openNow: place.isOpen,
    };
  }

  private estimatePriceLevel(place: Place): number {
    // Estimate price level based on category (1-4 scale)
    const priceLevels: Record<string, number> = {
      fast_food: 1,
      cafe: 2,
      restaurant: 3,
      hotel: 3,
      supermarket: 2,
      convenience: 1,
      bank: 2,
      atm: 1,
      gas_station: 2,
      hospital: 3,
      pharmacy: 2,
      parking: 1,
    };
    
    return priceLevels[place.category] || 2;
  }

  // Get popular places in a specific category
  async getPopularPlaces(
    latitude: number,
    longitude: number,
    category: PlaceCategory,
    limit: number = 10
  ): Promise<EnhancedPlace[]> {
    const places = await this.getEnhancedNearbyPlaces(latitude, longitude, category, 10000);
    
    return places
      .filter(p => (p.rating || 0) >= 3.5)
      .slice(0, limit);
  }

  // Get essential services (hospitals, pharmacies, gas stations, etc.)
  async getEssentialServices(
    latitude: number,
    longitude: number
  ): Promise<Record<string, EnhancedPlace[]>> {
    const essentialCategories: PlaceCategory[] = [
      'hospital',
      'pharmacy',
      'gas_station',
      'atm',
      'police',
    ];
    
    const results: Record<string, EnhancedPlace[]> = {};
    
    await Promise.all(
      essentialCategories.map(async (category) => {
        const places = await this.getEnhancedNearbyPlaces(
          latitude,
          longitude,
          category,
          5000
        );
        results[category] = places.slice(0, 5);
      })
    );
    
    return results;
  }
}

export const enhancedPlacesService = new EnhancedPlacesService();
export type { EnhancedPlace };
