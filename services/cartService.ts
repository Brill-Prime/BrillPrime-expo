import { apiClient, ApiResponse } from './api';
import { authService } from './authService';

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
  // Get cart items from backend
  async getCartItems(): Promise<ApiResponse<CartItem[]>> {
    const token = await authService.getToken();
    if (!token) return { success: false, error: 'Authentication required' };
    try {
      return await apiClient.get<CartItem[]>('/api/cart', { Authorization: `Bearer ${token}` });
    } catch (error) {
      console.error('Error getting cart items:', error);
      return { success: false, error: 'Failed to get cart items' };
    }
  }

  // Add item to cart (backend)
  async addToCart(item: CartItem): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) return { success: false, error: 'Authentication required' };
    try {
      return await apiClient.post<{ message: string }>('/api/cart', item, { Authorization: `Bearer ${token}` });
    } catch (error) {
      console.error('Error adding to cart:', error);
      return { success: false, error: 'Failed to add to cart' };
    }
  }

  // Update item quantity (backend)
  async updateQuantity(itemId: string, newQuantity: number): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) return { success: false, error: 'Authentication required' };
    try {
      return await apiClient.put<{ message: string }>(`/api/cart/${itemId}`, { quantity: newQuantity }, { Authorization: `Bearer ${token}` });
    } catch (error) {
      console.error('Error updating quantity:', error);
      return { success: false, error: 'Failed to update cart item' };
    }
  }

  // Remove item from cart (backend)
  async removeFromCart(itemId: string): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) return { success: false, error: 'Authentication required' };
    try {
      return await apiClient.delete<{ message: string }>(`/api/cart/${itemId}`, { Authorization: `Bearer ${token}` });
    } catch (error) {
      console.error('Error removing from cart:', error);
      return { success: false, error: 'Failed to remove from cart' };
    }
  }

  // Clear entire cart (backend)
  async clearCart(): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) return { success: false, error: 'Authentication required' };
    try {
      // Backend handles clearing the cart
      return await apiClient.delete<{ message: string }>('/api/cart', { Authorization: `Bearer ${token}` });
    } catch (error) {
      console.error('Error clearing cart:', error);
      return { success: false, error: 'Failed to clear cart' };
    }
  }

  // Get cart total (client-side calculation from backend data)
  async getCartTotal(): Promise<number> {
    const res = await this.getCartItems();
    if (!res.success || !res.data) return 0;
    return res.data.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  // Get cart item count (client-side calculation from backend data)
  async getCartItemCount(): Promise<number> {
    const res = await this.getCartItems();
    if (!res.success || !res.data) return 0;
    return res.data.reduce((count, item) => count + item.quantity, 0);
  }

  // Prepare cart for checkout (no-op, handled by backend)
  async prepareCheckout(): Promise<ApiResponse<{ message: string }>> {
    // Optionally, you could POST to /api/checkout to start checkout process
    return { success: true, data: { message: 'Checkout prepared (handled by backend)' } };
  }
}

export const cartService = new CartService();