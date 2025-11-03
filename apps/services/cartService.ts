import { ApiResponse } from './api';
import { authService } from './authService';
import { supabaseService } from './supabaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import { RealtimeChannel } from '@supabase/supabase-js';

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
  private realtimeChannel: RealtimeChannel | null = null;
  private isOnline: boolean = true;

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



  // Initialize realtime cart sync
  private async initializeRealtimeSync(): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Clean up existing channel
      if (this.realtimeChannel) {
        this.realtimeChannel.unsubscribe();
      }

      // Create new realtime channel for cart updates
      this.realtimeChannel = supabaseService.client
        .channel(`cart-${currentUser.uid}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'cart_items',
            filter: `user_id=eq.${currentUser.uid}`,
          },
          (payload: any) => {
            console.log('Realtime cart update:', payload);
            // Trigger local cart refresh
            this.syncCartFromSupabase();
          }
        )
        .subscribe((status: string) => {
          console.log('Realtime cart subscription status:', status);
        });
    } catch (error) {
      console.error('Error initializing realtime sync:', error);
    }
  }

  // Sync cart from Supabase to local storage
  private async syncCartFromSupabase(): Promise<void> {
    try {
      const { data: cartItems, error } = await supabaseService.client
        .from('cart_items')
        .select(`
          id,
          quantity,
          unit_price,
          merchant_id,
          commodity_id,
          merchants (
            id,
            name
          ),
          commodities (
            id,
            name,
            unit
          )
        `);

      if (error) throw error;

      // Transform Supabase data to CartItem format
      const transformedItems: CartItem[] = cartItems?.map(item => ({
        id: item.id,
        commodityId: item.commodity_id,
        commodityName: item.commodities?.name || '',
        merchantId: item.merchant_id,
        merchantName: item.merchants?.name || '',
        price: parseFloat(item.unit_price),
        quantity: item.quantity,
        unit: item.commodities?.unit || '',
      })) || [];

      // Update local storage
      await AsyncStorage.setItem(this.CART_STORAGE_KEY, JSON.stringify(transformedItems));
    } catch (error) {
      console.error('Error syncing cart from Supabase:', error);
    }
  }

  // Sync local cart to Supabase
  private async syncCartToSupabase(): Promise<void> {
    try {
      const localCart = await AsyncStorage.getItem(this.CART_STORAGE_KEY);
      if (!localCart) return;

      const items: CartItem[] = JSON.parse(localCart);
      if (items.length === 0) return;

      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Get user ID from Supabase
      const { data: userData } = await supabaseService.client
        .from('users')
        .select('id')
        .eq('firebase_uid', currentUser.uid)
        .single();

      if (!userData) return;

      // Clear existing cart items and insert new ones
      await supabaseService.client
        .from('cart_items')
        .delete()
        .eq('user_id', userData.id);

      // Insert new cart items
      const cartInserts = items.map(item => ({
        user_id: userData.id,
        merchant_id: item.merchantId,
        commodity_id: item.commodityId,
        quantity: item.quantity,
        unit_price: item.price.toString(),
      }));

      const { error } = await supabaseService.client
        .from('cart_items')
        .insert(cartInserts);

      if (error) throw error;
    } catch (error) {
      console.error('Error syncing cart to Supabase:', error);
    }
  }

  // Get cart items - prioritize Supabase, fallback to local storage
  async getCartItems(): Promise<ApiResponse<CartItem[]>> {
    try {
      // Try to get from Supabase first
      if (this.isOnline) {
        try {
          await this.syncCartFromSupabase();
        } catch (error) {
          console.log('Supabase sync failed, using local storage:', error);
        }
      }

      // Always read from local storage for immediate response
      const localCart = await AsyncStorage.getItem(this.CART_STORAGE_KEY);
      const localItems: CartItem[] = localCart ? JSON.parse(localCart) : [];

      // Initialize realtime sync if not already done
      if (!this.realtimeChannel) {
        this.initializeRealtimeSync();
      }

      return { success: true, data: localItems };
    } catch (error) {
      console.error('Error getting cart items:', error);
      return { success: false, error: 'Failed to get cart items' };
    }
  }

  // Add item to cart - local storage with Supabase sync
  async addToCart(item: CartItem): Promise<ApiResponse<{ message: string }>> {
    try {
      // Update local storage immediately
      const localCart = await AsyncStorage.getItem(this.CART_STORAGE_KEY);
      const items: CartItem[] = localCart ? JSON.parse(localCart) : [];

      // Check if item already exists
      const existingIndex = items.findIndex(i => i.commodityId === item.commodityId && i.merchantId === item.merchantId);
      if (existingIndex >= 0) {
        items[existingIndex].quantity += item.quantity;
      } else {
        // Generate a temporary ID for new items
        const newItem = { ...item, id: `temp-${Date.now()}-${Math.random()}` };
        items.push(newItem);
      }

      await AsyncStorage.setItem(this.CART_STORAGE_KEY, JSON.stringify(items));

      // Try to sync with Supabase
      if (this.isOnline) {
        try {
          await this.syncCartToSupabase();
        } catch (error) {
          console.log('Supabase sync failed (item saved locally):', error);
        }
      }

      return { success: true, data: { message: 'Item added to cart' } };
    } catch (error) {
      console.error('Error adding to cart:', error);
      return { success: false, error: 'Failed to add to cart' };
    }
  }

  // Update item quantity - local storage with Supabase sync
  async updateQuantity(itemId: string, newQuantity: number): Promise<ApiResponse<{ message: string }>> {
    try {
      // Update local storage immediately
      const localCart = await AsyncStorage.getItem(this.CART_STORAGE_KEY);
      const items: CartItem[] = localCart ? JSON.parse(localCart) : [];

      const updatedItems = items.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );

      await AsyncStorage.setItem(this.CART_STORAGE_KEY, JSON.stringify(updatedItems));

      // Try to sync with Supabase
      if (this.isOnline) {
        try {
          await this.syncCartToSupabase();
        } catch (error) {
          console.log('Supabase sync failed (updated locally):', error);
        }
      }

      return { success: true, data: { message: 'Quantity updated' } };
    } catch (error) {
      console.error('Error updating quantity:', error);
      return { success: false, error: 'Failed to update cart item' };
    }
  }

  // Remove item from cart - local storage with Supabase sync
  async removeFromCart(itemId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      // Update local storage immediately
      const localCart = await AsyncStorage.getItem(this.CART_STORAGE_KEY);
      const items: CartItem[] = localCart ? JSON.parse(localCart) : [];

      const filteredItems = items.filter(item => item.id !== itemId);
      await AsyncStorage.setItem(this.CART_STORAGE_KEY, JSON.stringify(filteredItems));

      // Try to sync with Supabase
      if (this.isOnline) {
        try {
          await this.syncCartToSupabase();
        } catch (error) {
          console.log('Supabase sync failed (removed locally):', error);
        }
      }

      return { success: true, data: { message: 'Item removed from cart' } };
    } catch (error) {
      console.error('Error removing from cart:', error);
      return { success: false, error: 'Failed to remove from cart' };
    }
  }

  // Clear entire cart - local storage with Supabase sync
  async clearCart(): Promise<ApiResponse<{ message: string }>> {
    try {
      // Clear local storage immediately
      await AsyncStorage.multiRemove([
        this.CART_STORAGE_KEY,
        this.COMMODITIES_CART_KEY,
        'checkoutItems'
      ]);

      // Try to sync with Supabase
      if (this.isOnline) {
        try {
          await this.syncCartToSupabase();
        } catch (error) {
          console.log('Supabase sync failed (cleared locally):', error);
        }
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