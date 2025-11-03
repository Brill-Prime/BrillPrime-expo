import { authService } from './authService';
import { supabaseService } from './supabaseService';
import { auth } from '../config/firebase';

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
      const user = await authService.getCurrentUser();
      if (!user) {
        return { success: false, error: 'Authentication required' };
      }

      const { data, error } = await supabaseService.from('favorites').select('*').eq('userId', user.id);

      if (error) {
        console.error('Supabase error getting favorites:', error.message);
        return { success: false, error: 'Failed to load favorites' };
      }

      // Ensure data is not null and is an array, otherwise return empty array
      const favoritesData = data || [];

      // Convert to the expected FavoriteItem format if necessary (e.g., if Supabase returns different types)
      const formattedFavorites = favoritesData.map(fav => ({
        id: fav.id,
        userId: fav.userId,
        itemId: fav.itemId,
        itemType: fav.itemType,
        createdAt: fav.createdAt,
      }));


      return { success: true, data: formattedFavorites };
    } catch (error) {
      console.error('Error getting favorites:', error);
      return { success: false, error: 'Failed to load favorites' };
    }
  }

  async addFavorite(itemId: string, itemType: 'merchant' | 'commodity'): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        return { success: false, error: 'Authentication required' };
      }

      const { error } = await supabaseService.from('favorites').insert([
        { userId: user.id, itemId, itemType, createdAt: new Date().toISOString() },
      ]);

      if (error) {
        console.error('Supabase error adding favorite:', error.message);
        return { success: false, error: 'Failed to add favorite' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error adding favorite:', error);
      return { success: false, error: 'Failed to add favorite' };
    }
  }

  async removeFavorite(itemId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        return { success: false, error: 'Authentication required' };
      }

      const { error } = await supabaseService.from('favorites').delete().eq('itemId', itemId).eq('userId', user.id);

      if (error) {
        console.error('Supabase error removing favorite:', error.message);
        return { success: false, error: 'Failed to remove favorite' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error removing favorite:', error);
      return { success: false, error: 'Failed to remove favorite' };
    }
  }

  async isFavorite(itemId: string): Promise<boolean> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        return false;
      }

      const { count, error } = await supabaseService
        .from('favorites')
        .select('count', { count: 'exact' })
        .eq('itemId', itemId)
        .eq('userId', user.id)
        .single();

      if (error) {
        console.error('Supabase error checking favorite:', error.message);
        return false;
      }

      return count !== null && count > 0;
    } catch (error) {
      console.error('Error checking favorite:', error);
      return false;
    }
  }
}

export const favoritesService = new FavoritesService();