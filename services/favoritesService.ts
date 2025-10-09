
import { apiClient } from './api';
import { authService } from './authService';

interface Favorite {
  id: string;
  userId: string;
  merchantId: string;
  merchantName: string;
  merchantAddress: string;
  createdAt: string;
}

class FavoritesService {
  async getFavorites(): Promise<Favorite[]> {
    try {
      const token = await authService.getToken();
      const response = await apiClient.get('/api/favorites', {
        Authorization: `Bearer ${token}`,
      });

      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching favorites:', error);
      throw error;
    }
  }

  async addFavorite(merchantId: string): Promise<boolean> {
    try {
      const token = await authService.getToken();
      const response = await apiClient.post(
        '/api/favorites',
        { merchantId },
        {
          Authorization: `Bearer ${token}`,
        }
      );

      return response.success;
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw error;
    }
  }

  async removeFavorite(favoriteId: string): Promise<boolean> {
    try {
      const token = await authService.getToken();
      const response = await apiClient.delete(`/api/favorites/${favoriteId}`, {
        Authorization: `Bearer ${token}`,
      });

      return response.success;
    } catch (error) {
      console.error('Error removing favorite:', error);
      throw error;
    }
  }
}

export const favoritesService = new FavoritesService();
