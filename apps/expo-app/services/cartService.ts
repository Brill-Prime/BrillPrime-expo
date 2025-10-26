import { apiClient, ApiResponse } from './api';
import { authService } from './authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';

export interface CartItem {
  id: string;
  commodityId: string;
  commodityName: string;
  merchantId: string;
  merchantName: string;
  price: number;
  quantity: number;
  unit: string;
  category?: string;
  image?: any;
}

export interface CommoditiesCartItem {
  productId: string;
  quantity: number;
  price: number;
  productName: string;
  productUnit: string;
  merchantId: string;
  merchantName: string;
}


class CartService {
  private readonly CART_STORAGE_KEY = 'cartItems';
  private readonly COMMODITIES_CART_KEY = 'commoditiesCart';

  // Get a fresh Firebase token with automatic refresh
  private async getFreshToken(): Promise<string | null> {
    try {
      // Get current Firebase user
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('No Firebase user found');
        return null;
      }

      // Force token refresh to get a fresh token
      const freshToken = await currentUser.getIdToken(true);
      console.log('Fresh token obtained from Firebase');
      
      // Store the fresh token
      await AsyncStorage.setItem('userToken', freshToken);
      const tokenExpiry = Date.now() + (55 * 60 * 1000); // 55 minutes (5 min buffer)
      await AsyncStorage.setItem('tokenExpiry', tokenExpiry.toString());
      
      return freshToken;
    } catch (error) {
      console.error('Error getting fresh token:', error);
      // Fallback to stored token
      return await authService.getToken();
    }
  }

  // Sync local cart to backend when possible
  private async syncCartToBackend(token: string): Promise<void> {
    try {
      const localCart = await AsyncStorage.getItem(this.CART_STORAGE_KEY);
      if (!localCart) return;

      const items: CartItem[] = JSON.parse(localCart);
      if (items.length === 0) return;

      // Try to sync with backend
      for (const item of items) {
        await apiClient.post('/api/cart', item, { 
          Authorization: `Bearer ${token}` 
        }).catch(err => {
          console.log('Backend sync failed (non-critical):', err);
        });
      }
    } catch (error) {
      console.log('Cart sync error (non-critical):', error);
    }
  }

  // Get cart items - use local storage with optional backend sync
  async getCartItems(): Promise<ApiResponse<CartItem[]>> {
    try {
      // Always read from local storage first for immediate response
      const localCart = await AsyncStorage.getItem(this.CART_STORAGE_KEY);
      const localItems: CartItem[] = localCart ? JSON.parse(localCart) : [];

      // Try to get fresh token and sync with backend in background
      const token = await this.getFreshToken();
      if (token) {
        // Non-blocking backend sync
        apiClient.get<CartItem[]>('/api/cart', { 
          Authorization: `Bearer ${token}` 
        }).then(async (response) => {
          if (response.success && response.data) {
            // Merge backend items with local items (backend takes priority)
            await AsyncStorage.setItem(this.CART_STORAGE_KEY, JSON.stringify(response.data));
          }
        }).catch(err => {
          console.log('Backend cart fetch failed, using local cart:', err);
        });
      }

      return { success: true, data: localItems };
    } catch (error) {
      console.error('Error getting cart items:', error);
      return { success: false, error: 'Failed to get cart items' };
    }
  }

  // Add item to cart - local storage with backend sync
  async addToCart(item: CartItem): Promise<ApiResponse<{ message: string }>> {
    try {
      // Update local storage immediately
      const localCart = await AsyncStorage.getItem(this.CART_STORAGE_KEY);
      const items: CartItem[] = localCart ? JSON.parse(localCart) : [];
      
      // Check if item already exists
      const existingIndex = items.findIndex(i => i.commodityId === item.commodityId);
      if (existingIndex >= 0) {
        items[existingIndex].quantity += item.quantity;
      } else {
        items.push(item);
      }
      
      await AsyncStorage.setItem(this.CART_STORAGE_KEY, JSON.stringify(items));

      // Try to sync with backend using fresh token
      const token = await this.getFreshToken();
      if (token) {
        apiClient.post('/api/cart', item, { 
          Authorization: `Bearer ${token}` 
        }).catch(err => {
          console.log('Backend sync failed (item saved locally):', err);
        });
      }

      return { success: true, data: { message: 'Item added to cart' } };
    } catch (error) {
      console.error('Error adding to cart:', error);
      return { success: false, error: 'Failed to add to cart' };
    }
  }

  // Update item quantity - local storage with backend sync
  async updateQuantity(itemId: string, newQuantity: number): Promise<ApiResponse<{ message: string }>> {
    try {
      // Update local storage immediately
      const localCart = await AsyncStorage.getItem(this.CART_STORAGE_KEY);
      const items: CartItem[] = localCart ? JSON.parse(localCart) : [];
      
      const updatedItems = items.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
      
      await AsyncStorage.setItem(this.CART_STORAGE_KEY, JSON.stringify(updatedItems));

      // Try to sync with backend using fresh token
      const token = await this.getFreshToken();
      if (token) {
        apiClient.put(`/api/cart/${itemId}`, { quantity: newQuantity }, { 
          Authorization: `Bearer ${token}` 
        }).catch(err => {
          console.log('Backend sync failed (updated locally):', err);
        });
      }

      return { success: true, data: { message: 'Quantity updated' } };
    } catch (error) {
      console.error('Error updating quantity:', error);
      return { success: false, error: 'Failed to update cart item' };
    }
  }

  // Remove item from cart - local storage with backend sync
  async removeFromCart(itemId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      // Update local storage immediately
      const localCart = await AsyncStorage.getItem(this.CART_STORAGE_KEY);
      const items: CartItem[] = localCart ? JSON.parse(localCart) : [];
      
      const filteredItems = items.filter(item => item.id !== itemId);
      await AsyncStorage.setItem(this.CART_STORAGE_KEY, JSON.stringify(filteredItems));

      // Try to sync with backend using fresh token
      const token = await this.getFreshToken();
      if (token) {
        apiClient.delete(`/api/cart/${itemId}`, { 
          Authorization: `Bearer ${token}` 
        }).catch(err => {
          console.log('Backend sync failed (removed locally):', err);
        });
      }

      return { success: true, data: { message: 'Item removed from cart' } };
    } catch (error) {
      console.error('Error removing from cart:', error);
      return { success: false, error: 'Failed to remove from cart' };
    }
  }

  // Clear entire cart - local storage with backend sync
  async clearCart(): Promise<ApiResponse<{ message: string }>> {
    try {
      // Clear local storage immediately
      await AsyncStorage.multiRemove([
        this.CART_STORAGE_KEY, 
        this.COMMODITIES_CART_KEY,
        'checkoutItems'
      ]);

      // Try to sync with backend using fresh token
      const token = await this.getFreshToken();
      if (token) {
        apiClient.delete('/api/cart', { 
          Authorization: `Bearer ${token}` 
        }).catch(err => {
          console.log('Backend sync failed (cleared locally):', err);
        });
      }

      return { success: true, data: { message: 'Cart cleared' } };
    } catch (error) {
      console.error('Error clearing cart:', error);
      return { success: false, error: 'Failed to clear cart' };
    }
  }

  // Get cart total (from local storage)
  async getCartTotal(): Promise<number> {
    const res = await this.getCartItems();
    if (!res.success || !res.data) return 0;
    return res.data.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  // Get cart item count (from local storage)
  async getCartItemCount(): Promise<number> {
    const res = await this.getCartItems();
    if (!res.success || !res.data) return 0;
    return res.data.reduce((count, item) => count + item.quantity, 0);
  }

  // Prepare cart for checkout
  async prepareCheckout(): Promise<ApiResponse<{ message: string }>> {
    try {
      const cartItems = await this.getCartItems();
      if (!cartItems.success || !cartItems.data || cartItems.data.length === 0) {
        return { success: false, error: 'Cart is empty' };
      }

      await AsyncStorage.setItem('checkoutItems', JSON.stringify(cartItems.data));
      return { success: true, data: { message: 'Checkout prepared' } };
    } catch (error) {
      console.error('Error preparing checkout:', error);
      return { success: false, error: 'Failed to prepare checkout' };
    }
  }
}

export const cartService = new CartService();