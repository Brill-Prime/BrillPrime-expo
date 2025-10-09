
import apiClient from './api';
import { authService } from './authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FavoriteItem {
  id: string;
  userId: string;
  itemId: string;
  itemType: 'merchant' | 'commodity';
  createdAt: string;
}

class FavoritesService {
  private FAVORITES_KEY = 'user_favorites';

  async getFavorites(): Promise<{ success: boolean; data?: FavoriteItem[]; error?: string }> {
    try {
      const token = await authService.getToken();
      if (!token) {
        return { success: false, error: 'Authentication required' };
      }

      const response = await apiClient.get('/api/favorites', {
        Authorization: `Bearer ${token}`,
      });

      if (response.success && response.data) {
        await AsyncStorage.setItem(this.FAVORITES_KEY, JSON.stringify(response.data));
        return { success: true, data: response.data };
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
      const token = await authService.getToken();
      if (!token) {
        return { success: false, error: 'Authentication required' };
      }

      const response = await apiClient.post('/api/favorites', {
        itemId,
        itemType,
      }, {
        Authorization: `Bearer ${token}`,
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
      const token = await authService.getToken();
      if (!token) {
        return { success: false, error: 'Authentication required' };
      }

      const response = await apiClient.delete(`/api/favorites/${itemId}`, {
        Authorization: `Bearer ${token}`,
      });

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
