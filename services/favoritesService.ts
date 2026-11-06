
import { apiClient } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from './apiEndpoints';

interface FavoriteItem {
  id: string;
  userId: string;
  itemId: string;
  itemType: 'merchant' | 'commodity';
  createdAt: string;
  name: string;
  merchant: string;
  imageUrl?: string;
  image: { uri: string } | number;
  price: number;
  rating: number;
}

class FavoritesService {
  private FAVORITES_KEY = 'user_favorites';

  async getFavorites(): Promise<{ success: boolean; data?: FavoriteItem[]; error?: string }> {
    try {
      const response = await apiClient.get<FavoriteItem[]>(API_ENDPOINTS.FAVORITES.LIST);

      if (response.success && response.data) {
        const favorites = Array.isArray(response.data)
          ? response.data.map(item => ({
              ...item,
              name: item.name || 'Unavailable item',
              merchant: item.merchant || '',
              image: item.imageUrl
                ? { uri: item.imageUrl }
                : require('../assets/images/generated-icon.png'),
              price: Number(item.price) || 0,
              rating: Number(item.rating) || 0,
            }))
          : [];
        await AsyncStorage.setItem(this.FAVORITES_KEY, JSON.stringify(favorites));
        return { success: true, data: favorites };
      }

      return { success: false, error: 'Failed to load favorites' };
    } catch (error) {
      console.error('Error getting favorites:', error);
      // Try to load from cache
      const cached = await AsyncStorage.getItem(this.FAVORITES_KEY);
      if (cached) {
        return { success: true, data: JSON.parse(cached) };
      }
      return { success: false, error: 'Failed to load favorites' };
    }
  }

  async addFavorite(itemId: string, itemType: 'merchant' | 'commodity'): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.FAVORITES.CREATE, {
        itemId,
        itemType,
      });

      if (response.success) {
        // Update local cache
        await this.getFavorites();
        return { success: true };
      }

      return { success: false, error: 'Failed to add favorite' };
    } catch (error) {
      console.error('Error adding favorite:', error);
      return { success: false, error: 'Failed to add favorite' };
    }
  }

  async removeFavorite(itemId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.FAVORITES.REMOVE(itemId));

      if (response.success) {
        // Update local cache
        await this.getFavorites();
        return { success: true };
      }

      return { success: false, error: 'Failed to remove favorite' };
    } catch (error) {
      console.error('Error removing favorite:', error);
      return { success: false, error: 'Failed to remove favorite' };
    }
  }

  async isFavorite(itemId: string): Promise<boolean> {
    try {
      const result = await this.getFavorites();
      if (result.success && result.data) {
        return result.data.some(fav => fav.itemId === itemId);
      }
      return false;
    } catch (error) {
      console.error('Error checking favorite:', error);
      return false;
    }
  }
}

export const favoritesService = new FavoritesService();
