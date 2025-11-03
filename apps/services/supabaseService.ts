import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { authService } from './authService';

// Get Supabase configuration from environment variables
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validate that we have the required config
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required Supabase configuration');
  console.error('Supabase config:', { hasUrl: !!supabaseUrl, hasAnonKey: !!supabaseAnonKey });
  console.warn('⚠️ Supabase will not be available. Using Firebase-only mode.');
}

// Create Supabase client with auth integration
export const supabase: SupabaseClient | null = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
}) : null;

// Sync Firebase auth with Supabase
export const syncFirebaseWithSupabase = async (firebaseToken: string | null) => {
  if (!supabase || !firebaseToken) return;

  try {
    // Set the Firebase JWT as a custom header for Supabase RLS
    supabase.realtime.setAuth(firebaseToken);
    console.log('✅ Firebase token synced with Supabase');
  } catch (error) {
    console.error('❌ Failed to sync Firebase token with Supabase:', error);
  }
};

// Initialize auth sync when Firebase user changes
if (supabase) {
  // Listen to Firebase auth changes and sync with Supabase
  const { getAuth } = require('@firebase/auth');
  const auth = getAuth();

  auth.onAuthStateChanged(async (user: any) => {
    if (user) {
      try {
        const token = await user.getIdToken();
        await syncFirebaseWithSupabase(token);
      } catch (error) {
        console.error('Failed to sync user token:', error);
      }
    } else {
      await syncFirebaseWithSupabase(null);
    }
  });
}

// Database service class for CRUD operations
export class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    this.client = supabase;
  }

  // Generic CRUD operations
  async create<T = any>(table: string, data: Partial<T>): Promise<{ data: T | null; error: any }> {
    const { data: result, error } = await this.client
      .from(table)
      .insert(data)
      .select()
      .single();

    return { data: result, error };
  }

  async find<T = any>(table: string, filters?: Record<string, any>): Promise<{ data: T[] | null; error: any }> {
    let query = this.client.from(table).select('*');

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }

    const { data, error } = await query;
    return { data, error };
  }

  async findOne<T = any>(table: string, filters: Record<string, any>): Promise<{ data: T | null; error: any }> {
    let query = this.client.from(table).select('*');

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    const { data, error } = await query.single();
    return { data, error };
  }

  async update<T = any>(table: string, filters: Record<string, any>, updates: Partial<T>): Promise<{ data: T | null; error: any }> {
    let query = this.client.from(table).update(updates);

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    const { data, error } = await query.select().single();
    return { data, error };
  }

  async delete(table: string, filters: Record<string, any>): Promise<{ error: any }> {
    let query = this.client.from(table).delete();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    const { error } = await query;
    return { error };
  }

  // User-specific operations
  async getCurrentUserId(): Promise<string | null> {
    const token = await authService.getToken();
    if (!token) return null;

    // Decode JWT to get user ID (simplified - in production use a proper JWT library)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload.user_id || null;
    } catch {
      return null;
    }
  }

  // Sync Firebase user to Supabase users table
  async syncFirebaseUser(userData: {
    firebaseUid: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: 'consumer' | 'merchant' | 'driver';
  }): Promise<{ data: any | null; error: any }> {
    const { data, error } = await this.client.rpc('sync_firebase_user', {
      p_firebase_uid: userData.firebaseUid,
      p_email: userData.email,
      p_first_name: userData.firstName,
      p_last_name: userData.lastName,
      p_phone: userData.phone
    });

    if (!error && userData.role) {
      // Sync role-specific profile
      await this.syncUserRole(userData.firebaseUid, userData.role);
    }

    return { data, error };
  }

  // Sync user role to Supabase
  async syncUserRole(firebaseUid: string, role: 'consumer' | 'merchant' | 'driver'): Promise<void> {
    try {
      const { data: user } = await this.client
        .from('users')
        .select('id')
        .eq('firebase_uid', firebaseUid)
        .single();

      if (!user) return;

      // Update or create role-specific profile
      if (role === 'merchant') {
        await this.client
          .from('merchants')
          .upsert({
            user_id: user.id,
            firebase_uid: firebaseUid,
            updated_at: new Date().toISOString()
          });
      } else if (role === 'driver') {
        await this.client
          .from('drivers')
          .upsert({
            user_id: user.id,
            firebase_uid: firebaseUid,
            updated_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error syncing user role:', error);
    }
  }

  // Sync order from Firebase to Supabase
  async syncOrder(orderData: {
    id: string;
    userId: string;
    merchantId: string;
    items: any[];
    total: number;
    status: string;
    deliveryAddress?: any;
    createdAt: string;
  }): Promise<{ data: any | null; error: any }> {
    try {
      // Get Supabase user IDs
      const { data: user } = await this.client
        .from('users')
        .select('id')
        .eq('firebase_uid', orderData.userId)
        .single();

      const { data: merchant } = await this.client
        .from('merchants')
        .select('id')
        .eq('firebase_uid', orderData.merchantId)
        .single();

      if (!user || !merchant) {
        return { data: null, error: 'User or merchant not found in Supabase' };
      }

      // Sync order
      const { data, error } = await this.client
        .from('orders')
        .upsert({
          firebase_order_id: orderData.id,
          user_id: user.id,
          merchant_id: merchant.id,
          total: orderData.total,
          status: orderData.status,
          delivery_address: orderData.deliveryAddress,
          created_at: orderData.createdAt,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      // Sync order items
      if (data && orderData.items?.length > 0) {
        await this.syncOrderItems(data.id, orderData.items);
      }

      return { data, error };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  // Sync order items
  private async syncOrderItems(orderId: string, items: any[]): Promise<void> {
    try {
      const orderItems = items.map(item => ({
        order_id: orderId,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.quantity * item.price
      }));

      await this.client
        .from('order_items')
        .upsert(orderItems);
    } catch (error) {
      console.error('Error syncing order items:', error);
    }
  }

  // Sync product/commodity
  async syncProduct(productData: {
    id: string;
    merchantId: string;
    name: string;
    description?: string;
    price: number;
    category?: string;
    stock?: number;
    imageUrl?: string;
  }): Promise<{ data: any | null; error: any }> {
    try {
      const { data: merchant } = await this.client
        .from('merchants')
        .select('id')
        .eq('firebase_uid', productData.merchantId)
        .single();

      if (!merchant) {
        return { data: null, error: 'Merchant not found in Supabase' };
      }

      const { data, error } = await this.client
        .from('commodities')
        .upsert({
          firebase_product_id: productData.id,
          merchant_id: merchant.id,
          name: productData.name,
          description: productData.description,
          price: productData.price,
          category: productData.category,
          stock: productData.stock,
          image_url: productData.imageUrl,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      return { data, error };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  // Sync cart to Supabase
  async syncCart(userId: string, cartItems: any[]): Promise<{ data: any | null; error: any }> {
    try {
      const { data: user } = await this.client
        .from('users')
        .select('id')
        .eq('firebase_uid', userId)
        .single();

      if (!user) {
        return { data: null, error: 'User not found in Supabase' };
      }

      // Clear existing cart items
      await this.client
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      // Insert new cart items
      if (cartItems.length > 0) {
        const supabaseCartItems = cartItems.map(item => ({
          user_id: user.id,
          commodity_id: item.productId,
          merchant_id: item.merchantId,
          quantity: item.quantity,
          unit_price: item.price
        }));

        const { data, error } = await this.client
          .from('cart_items')
          .insert(supabaseCartItems)
          .select();

        return { data, error };
      }

      return { data: [], error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  // Batch sync - sync multiple entities at once
  async batchSync(syncData: {
    users?: any[];
    orders?: any[];
    products?: any[];
  }): Promise<{ success: boolean; errors: any[] }> {
    const errors: any[] = [];

    try {
      // Sync users
      if (syncData.users && syncData.users.length > 0) {
        for (const user of syncData.users) {
          const result = await this.syncFirebaseUser(user);
          if (result.error) {
            errors.push({ type: 'user', id: user.firebaseUid, error: result.error });
          }
        }
      }

      // Sync products
      if (syncData.products && syncData.products.length > 0) {
        for (const product of syncData.products) {
          const result = await this.syncProduct(product);
          if (result.error) {
            errors.push({ type: 'product', id: product.id, error: result.error });
          }
        }
      }

      // Sync orders
      if (syncData.orders && syncData.orders.length > 0) {
        for (const order of syncData.orders) {
          const result = await this.syncOrder(order);
          if (result.error) {
            errors.push({ type: 'order', id: order.id, error: result.error });
          }
        }
      }

      return { success: errors.length === 0, errors };
    } catch (error: any) {
      return { success: false, errors: [{ type: 'batch', error }] };
    }
  }

  // Realtime subscriptions
  subscribeToTable(
    table: string,
    filters: Record<string, any>,
    callback: (payload: any) => void,
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*'
  ) {
    let filterString = '';
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        filterString += `${key}=eq.${value},`;
      }
    });
    filterString = filterString.slice(0, -1); // Remove trailing comma

    return this.client
      .channel(`${table}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table,
          filter: filterString || undefined
        },
        callback
      )
      .subscribe();
  }

  // Storage operations
  async uploadFile(bucket: string, path: string, file: File | Blob): Promise<{ data: any | null; error: any }> {
    const { data, error } = await this.client.storage
      .from(bucket)
      .upload(path, file);

    return { data, error };
  }

  async getPublicUrl(bucket: string, path: string): Promise<string> {
    const { data } = this.client.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  async deleteFile(bucket: string, paths: string[]): Promise<{ error: any }> {
    const { error } = await this.client.storage
      .from(bucket)
      .remove(paths);

    return { error };
  }
}

// Export singleton instance
export const supabaseService = supabase ? new SupabaseService() : null;
