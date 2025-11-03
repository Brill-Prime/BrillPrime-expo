import { cartService } from '../cartService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../../config/firebase';
import { supabaseService } from '../supabaseService';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../config/firebase');
jest.mock('../supabaseService');

const mockAsyncStorage = AsyncStorage
const mockAuth = auth
const mockSupabaseService = supabaseService

describe('CartService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset cart service state
    cartService['isOnline'] = true;
  });

  describe('getCartItems', () => {
    it('should return cart items from local storage when online', async () => {
      const mockCartItems = [
        {
          id: '1',
          commodityId: 'commodity-1',
          commodityName: 'Test Commodity',
          merchantId: 'merchant-1',
          merchantName: 'Test Merchant',
          price: 100,
          quantity: 2,
          unit: 'kg'
        }
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockCartItems));
      mockSupabaseService.client.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: [], error: null })
      });

      const result = await cartService.getCartItems();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCartItems);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('cartItems');
    });

    it('should handle errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const result = await cartService.getCartItems();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get cart items');
    });
  });

  describe('addToCart', () => {
    it('should add new item to cart', async () => {
      const newItem = {
        id: 'temp-123',
        commodityId: 'commodity-1',
        commodityName: 'Test Commodity',
        merchantId: 'merchant-1',
        merchantName: 'Test Merchant',
        price: 100,
        quantity: 1,
        unit: 'kg'
      };

      mockAsyncStorage.getItem.mockResolvedValue('[]');
      mockAsyncStorage.setItem.mockResolvedValue();
      mockSupabaseService.client.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: [{ id: 'user-1' }], error: null }),
        delete: jest.fn().mockResolvedValue({ error: null }),
        insert: jest.fn().mockResolvedValue({ error: null })
      });

      const result = await cartService.addToCart(newItem);

      expect(result.success).toBe(true);
      expect(result.data?.message).toBe('Item added to cart');
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should update quantity for existing item', async () => {
      const existingItem = {
        id: '1',
        commodityId: 'commodity-1',
        commodityName: 'Test Commodity',
        merchantId: 'merchant-1',
        merchantName: 'Test Merchant',
        price: 100,
        quantity: 1,
        unit: 'kg'
      };

      const newItem = { ...existingItem, quantity: 2 };

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([existingItem]));
      mockAsyncStorage.setItem.mockResolvedValue();

      const result = await cartService.addToCart(newItem);

      expect(result.success).toBe(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'cartItems',
        JSON.stringify([{ ...existingItem, quantity: 3 }])
      );
    });
  });

  describe('updateQuantity', () => {
    it('should update item quantity', async () => {
      const cartItems = [
        {
          id: '1',
          commodityId: 'commodity-1',
          commodityName: 'Test Commodity',
          merchantId: 'merchant-1',
          merchantName: 'Test Merchant',
          price: 100,
          quantity: 1,
          unit: 'kg'
        }
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(cartItems));
      mockAsyncStorage.setItem.mockResolvedValue();

      const result = await cartService.updateQuantity('1', 3);

      expect(result.success).toBe(true);
      expect(result.data?.message).toBe('Quantity updated');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'cartItems',
        JSON.stringify([{ ...cartItems[0], quantity: 3 }])
      );
    });
  });

  describe('removeFromCart', () => {
    it('should remove item from cart', async () => {
      const cartItems = [
        {
          id: '1',
          commodityId: 'commodity-1',
          commodityName: 'Test Commodity',
          merchantId: 'merchant-1',
          merchantName: 'Test Merchant',
          price: 100,
          quantity: 1,
          unit: 'kg'
        }
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(cartItems));
      mockAsyncStorage.setItem.mockResolvedValue();

      const result = await cartService.removeFromCart('1');

      expect(result.success).toBe(true);
      expect(result.data?.message).toBe('Item removed from cart');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('cartItems', '[]');
    });
  });

  describe('clearCart', () => {
    it('should clear all cart items', async () => {
      mockAsyncStorage.multiRemove.mockResolvedValue();

      const result = await cartService.clearCart();

      expect(result.success).toBe(true);
      expect(result.data?.message).toBe('Cart cleared');
      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
        'cartItems',
        'commoditiesCart',
        'checkoutItems'
      ]);
    });
  });

  describe('getCartTotal', () => {
    it('should calculate total cart value', async () => {
      const cartItems = [
        {
          id: '1',
          commodityId: 'commodity-1',
          commodityName: 'Test Commodity',
          merchantId: 'merchant-1',
          merchantName: 'Test Merchant',
          price: 100,
          quantity: 2,
          unit: 'kg'
        },
        {
          id: '2',
          commodityId: 'commodity-2',
          commodityName: 'Test Commodity 2',
          merchantId: 'merchant-2',
          merchantName: 'Test Merchant 2',
          price: 50,
          quantity: 1,
          unit: 'kg'
        }
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(cartItems));

      const total = await cartService.getCartTotal();

      expect(total).toBe(250); // (100 * 2) + (50 * 1)
    });
  });

  describe('getCartItemCount', () => {
    it('should return total quantity of all items', async () => {
      const cartItems = [
        {
          id: '1',
          commodityId: 'commodity-1',
          commodityName: 'Test Commodity',
          merchantId: 'merchant-1',
          merchantName: 'Test Merchant',
          price: 100,
          quantity: 2,
          unit: 'kg'
        },
        {
          id: '2',
          commodityId: 'commodity-2',
          commodityName: 'Test Commodity 2',
          merchantId: 'merchant-2',
          merchantName: 'Test Merchant 2',
          price: 50,
          quantity: 3,
          unit: 'kg'
        }
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(cartItems));

      const count = await cartService.getCartItemCount();

      expect(count).toBe(5); // 2 + 3
    });
  });

  describe('prepareCheckout', () => {
    it('should prepare cart for checkout', async () => {
      const cartItems = [
        {
          id: '1',
          commodityId: 'commodity-1',
          commodityName: 'Test Commodity',
          merchantId: 'merchant-1',
          merchantName: 'Test Merchant',
          price: 100,
          quantity: 1,
          unit: 'kg'
        }
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(cartItems));
      mockAsyncStorage.setItem.mockResolvedValue();

      const result = await cartService.prepareCheckout();

      expect(result.success).toBe(true);
      expect(result.data?.message).toBe('Checkout prepared');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'checkoutItems',
        JSON.stringify(cartItems)
      );
    });

    it('should fail if cart is empty', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('[]');

      const result = await cartService.prepareCheckout();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cart is empty');
    });
  });

  describe('Supabase Integration', () => {
    it('should sync cart to Supabase on add operation', async () => {
      const newItem = {
        id: 'temp-123',
        commodityId: 'commodity-1',
        commodityName: 'Test Commodity',
        merchantId: 'merchant-1',
        merchantName: 'Test Merchant',
        price: 100,
        quantity: 1,
        unit: 'kg'
      };

      // Mock Firebase auth
      mockAuth.currentUser = { uid: 'firebase-user-1' };

      // Mock Supabase responses
      const mockFrom = {
        select: jest.fn().mockResolvedValue({ data: [{ id: 'user-1' }], error: null }),
        delete: jest.fn().mockResolvedValue({ error: null }),
        insert: jest.fn().mockResolvedValue({ error: null })
      };

      mockSupabaseService.client.from.mockReturnValue(mockFrom);
      mockAsyncStorage.getItem.mockResolvedValue('[]');
      mockAsyncStorage.setItem.mockResolvedValue();

      await cartService.addToCart(newItem);

      expect(mockSupabaseService.client.from).toHaveBeenCalledWith('users');
      expect(mockFrom.select).toHaveBeenCalled();
      expect(mockFrom.delete).toHaveBeenCalled();
      expect(mockFrom.insert).toHaveBeenCalled();
    });

    it('should handle Supabase sync failures gracefully', async () => {
      const newItem = {
        id: 'temp-123',
        commodityId: 'commodity-1',
        commodityName: 'Test Commodity',
        merchantId: 'merchant-1',
        merchantName: 'Test Merchant',
        price: 100,
        quantity: 1,
        unit: 'kg'
      };

      mockAsyncStorage.getItem.mockResolvedValue('[]');
      mockAsyncStorage.setItem.mockResolvedValue();
      mockSupabaseService.client.from.mockImplementation(() => {
        throw new Error('Supabase error');
      });

      const result = await cartService.addToCart(newItem);

      // Should still succeed because local storage works
      expect(result.success).toBe(true);
      expect(result.data?.message).toBe('Item added to cart');
    });
  });

  describe('Offline Mode', () => {
    it('should work in offline mode', async () => {
      cartService['isOnline'] = false;

      const cartItems = [
        {
          id: '1',
          commodityId: 'commodity-1',
          commodityName: 'Test Commodity',
          merchantId: 'merchant-1',
          merchantName: 'Test Merchant',
          price: 100,
          quantity: 1,
          unit: 'kg'
        }
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(cartItems));

      const result = await cartService.getCartItems();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(cartItems);
      // Should not attempt Supabase sync when offline
      expect(mockSupabaseService.client.from).not.toHaveBeenCalled();
    });
  });
});
