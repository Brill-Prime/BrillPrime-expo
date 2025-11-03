
import { auth } from '../config/firebase';
import { supabaseService } from './supabaseService';
import { onAuthStateChanged } from 'firebase/auth';

/**
 * Firebase-Supabase Synchronization Service
 * Handles bi-directional sync between Firebase and Supabase
 */
class FirebaseSupabaseSync {
  private syncInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  /**
   * Initialize sync service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('Sync service already initialized');
      return;
    }

    // Listen to Firebase auth changes and sync user
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        await this.syncCurrentUser(user);
      }
    });

    this.isInitialized = true;
    console.log('✅ Firebase-Supabase sync service initialized');
  }

  /**
   * Sync current Firebase user to Supabase
   */
  private async syncCurrentUser(user: any): Promise<void> {
    try {
      const displayName = user.displayName || '';
      const [firstName, ...lastNameParts] = displayName.split(' ');
      const lastName = lastNameParts.join(' ');

      const result = await supabaseService.syncFirebaseUser({
        firebaseUid: user.uid,
        email: user.email,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phone: user.phoneNumber || undefined,
      });

      if (result.error) {
        console.error('Failed to sync user to Supabase:', result.error);
      } else {
        console.log('✅ User synced to Supabase');
      }
    } catch (error) {
      console.error('Error syncing user:', error);
    }
  }

  /**
   * Sync order to Supabase
   */
  async syncOrder(orderData: {
    id: string;
    userId: string;
    merchantId: string;
    items: any[];
    total: number;
    status: string;
    deliveryAddress?: any;
    createdAt: string;
  }): Promise<boolean> {
    try {
      const result = await supabaseService.syncOrder(orderData);
      
      if (result.error) {
        console.error('Failed to sync order to Supabase:', result.error);
        return false;
      }

      console.log('✅ Order synced to Supabase:', orderData.id);
      return true;
    } catch (error) {
      console.error('Error syncing order:', error);
      return false;
    }
  }

  /**
   * Sync product/commodity to Supabase
   */
  async syncProduct(productData: {
    id: string;
    merchantId: string;
    name: string;
    description?: string;
    price: number;
    category?: string;
    stock?: number;
    imageUrl?: string;
  }): Promise<boolean> {
    try {
      const result = await supabaseService.syncProduct(productData);
      
      if (result.error) {
        console.error('Failed to sync product to Supabase:', result.error);
        return false;
      }

      console.log('✅ Product synced to Supabase:', productData.id);
      return true;
    } catch (error) {
      console.error('Error syncing product:', error);
      return false;
    }
  }

  /**
   * Sync cart to Supabase
   */
  async syncCart(userId: string, cartItems: any[]): Promise<boolean> {
    try {
      const result = await supabaseService.syncCart(userId, cartItems);
      
      if (result.error) {
        console.error('Failed to sync cart to Supabase:', result.error);
        return false;
      }

      console.log('✅ Cart synced to Supabase');
      return true;
    } catch (error) {
      console.error('Error syncing cart:', error);
      return false;
    }
  }

  /**
   * Enable periodic sync (for offline changes, etc.)
   */
  enablePeriodicSync(intervalMs: number = 60000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      const user = auth.currentUser;
      if (user) {
        await this.syncCurrentUser(user);
      }
    }, intervalMs);

    console.log('✅ Periodic sync enabled');
  }

  /**
   * Disable periodic sync
   */
  disablePeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Periodic sync disabled');
    }
  }

  /**
   * Manual full sync
   */
  async performFullSync(data: {
    users?: any[];
    orders?: any[];
    products?: any[];
  }): Promise<{ success: boolean; errors: any[] }> {
    console.log('Starting full sync...');
    const result = await supabaseService.batchSync(data);
    
    if (result.success) {
      console.log('✅ Full sync completed successfully');
    } else {
      console.error('Full sync completed with errors:', result.errors);
    }

    return result;
  }
}

export const firebaseSupabaseSync = new FirebaseSupabaseSync();
