
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  private static readonly CART_KEY = 'cartItems';
  private static readonly COMMODITIES_CART_KEY = 'commoditiesCart';

  // Get cart items
  async getCartItems(): Promise<CartItem[]> {
    try {
      const cartData = await AsyncStorage.getItem(CartService.CART_KEY);
      return cartData ? JSON.parse(cartData) : [];
    } catch (error) {
      console.error('Error getting cart items:', error);
      return [];
    }
  }

  // Add item to cart
  async addToCart(item: CartItem): Promise<boolean> {
    try {
      const cartItems = await this.getCartItems();
      const existingItemIndex = cartItems.findIndex(
        cartItem => cartItem.commodityId === item.commodityId && cartItem.merchantId === item.merchantId
      );

      if (existingItemIndex !== -1) {
        // Update existing item quantity
        cartItems[existingItemIndex].quantity += item.quantity;
      } else {
        // Add new item
        cartItems.push(item);
      }

      await AsyncStorage.setItem(CartService.CART_KEY, JSON.stringify(cartItems));
      
      // Sync with commodities cart
      await this.syncCommoditiesCart(cartItems);
      
      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      return false;
    }
  }

  // Update item quantity
  async updateQuantity(itemId: string, newQuantity: number): Promise<boolean> {
    try {
      const cartItems = await this.getCartItems();
      
      if (newQuantity <= 0) {
        return this.removeFromCart(itemId);
      }

      const updatedItems = cartItems.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );

      await AsyncStorage.setItem(CartService.CART_KEY, JSON.stringify(updatedItems));
      await this.syncCommoditiesCart(updatedItems);
      
      return true;
    } catch (error) {
      console.error('Error updating quantity:', error);
      return false;
    }
  }

  // Remove item from cart
  async removeFromCart(itemId: string): Promise<boolean> {
    try {
      const cartItems = await this.getCartItems();
      const updatedItems = cartItems.filter(item => item.id !== itemId);
      
      await AsyncStorage.setItem(CartService.CART_KEY, JSON.stringify(updatedItems));
      await this.syncCommoditiesCart(updatedItems);
      
      return true;
    } catch (error) {
      console.error('Error removing from cart:', error);
      return false;
    }
  }

  // Clear entire cart
  async clearCart(): Promise<boolean> {
    try {
      await AsyncStorage.multiRemove([
        CartService.CART_KEY,
        CartService.COMMODITIES_CART_KEY,
        'checkoutItems'
      ]);
      return true;
    } catch (error) {
      console.error('Error clearing cart:', error);
      return false;
    }
  }

  // Get cart total
  async getCartTotal(): Promise<number> {
    try {
      const cartItems = await this.getCartItems();
      return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    } catch (error) {
      console.error('Error calculating cart total:', error);
      return 0;
    }
  }

  // Get cart item count
  async getCartItemCount(): Promise<number> {
    try {
      const cartItems = await this.getCartItems();
      return cartItems.reduce((count, item) => count + item.quantity, 0);
    } catch (error) {
      console.error('Error getting cart item count:', error);
      return 0;
    }
  }

  // Sync with commodities cart format
  private async syncCommoditiesCart(cartItems: CartItem[]): Promise<void> {
    try {
      const commoditiesCartItems: CommoditiesCartItem[] = cartItems.map(item => ({
        productId: item.commodityId,
        quantity: item.quantity,
        price: item.price,
        productName: item.commodityName,
        productUnit: item.unit,
        merchantId: item.merchantId,
        merchantName: item.merchantName,
      }));

      await AsyncStorage.setItem(CartService.COMMODITIES_CART_KEY, JSON.stringify(commoditiesCartItems));
    } catch (error) {
      console.error('Error syncing commodities cart:', error);
    }
  }

  // Prepare cart for checkout
  async prepareCheckout(): Promise<boolean> {
    try {
      const cartItems = await this.getCartItems();
      await AsyncStorage.setItem('checkoutItems', JSON.stringify(cartItems));
      return true;
    } catch (error) {
      console.error('Error preparing checkout:', error);
      return false;
    }
  }
}

export const cartService = new CartService();
