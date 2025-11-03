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

    return { data, error };
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
