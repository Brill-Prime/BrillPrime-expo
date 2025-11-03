import { supabase, setSupabaseAuthToken } from '../config/supabase';
import { getAuth } from '@firebase/auth';
import type { RealtimeChannel } from '@supabase/supabase-js';

const auth = getAuth();

interface OrderUpdate {
  orderId: string;
  status: string;
  driverId?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  estimatedArrival?: string;
}

interface DriverLocationUpdate {
  driverId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  timestamp: string;
}

interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

interface EscrowTransactionUpdate {
  id: string;
  orderId: string;
  status: 'held' | 'released' | 'disputed' | 'refunded';
  amount: number;
  updatedAt: string;
}

interface NotificationUpdate {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

interface ReviewUpdate {
  id: string;
  userId: string;
  merchantId: string;
  orderId?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

interface PaymentUpdate {
  id: string;
  userId: string;
  orderId?: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  updatedAt: string;
}

interface KYCUpdate {
  id: string;
  userId: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected';
  updatedAt: string;
}

interface TollPaymentUpdate {
  id: string;
  userId: string;
  tollGateId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  paidAt: string;
}

class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private isInitialized = false;

  constructor() {
    // Initialize auth token sync
    this.initializeAuth();
  }

  /**
   * Initialize Firebase auth token sync with Supabase
   */
  private async initializeAuth(): Promise<void> {
    if (!supabase) {
      console.warn('⚠️ Supabase not available, realtime features disabled');
      return;
    }

    // Listen to Firebase auth changes and sync token
    auth.onAuthStateChanged(async (user: import('@firebase/auth').User | null) => {
      if (user) {
        const token = await user.getIdToken();
        await setSupabaseAuthToken(token);
        this.isInitialized = true;
        console.log('✅ Realtime service authenticated with Firebase token');
      } else {
        await setSupabaseAuthToken(null);
        this.isInitialized = false;
        this.unsubscribeAll();
      }
    });
  }

  // Subscribe to order status updates
  subscribeToOrderUpdates(
    orderId: string,
    callback: (update: OrderUpdate) => void
  ): () => void {
    const channelName = `order:${orderId}`;

    if (this.channels.has(channelName)) {
      console.log('Already subscribed to order:', orderId);
      return () => this.unsubscribe(channelName);
    }

    const channel = supabase!
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          callback(payload.new as OrderUpdate);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => this.unsubscribe(channelName);
  }

  // Subscribe to driver location updates (for live tracking)
  subscribeToDriverLocation(
    driverId: string,
    callback: (location: DriverLocationUpdate) => void
  ): () => void {
    const channelName = `driver_location:${driverId}`;

    if (this.channels.has(channelName)) {
      return () => this.unsubscribe(channelName);
    }

    const channel = supabase!
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'driver_locations',
          filter: `driver_id=eq.${driverId}`,
        },
        (payload) => {
          callback(payload.new as DriverLocationUpdate);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => this.unsubscribe(channelName);
  }

  // Subscribe to chat messages
  subscribeToChatMessages(
    conversationId: string,
    callback: (message: ChatMessage) => void
  ): () => void {
    const channelName = `chat:${conversationId}`;

    if (this.channels.has(channelName)) {
      return () => this.unsubscribe(channelName);
    }

    const channel = supabase!
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          callback(payload.new as ChatMessage);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => this.unsubscribe(channelName);
  }

  // Subscribe to inventory updates (for merchants)
  subscribeToInventoryUpdates(
    merchantId: string,
    callback: (update: any) => void
  ): () => void {
    const channelName = `inventory:${merchantId}`;

    if (this.channels.has(channelName)) {
      return () => this.unsubscribe(channelName);
    }

    const channel = supabase!
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory',
          filter: `merchant_id=eq.${merchantId}`,
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => this.unsubscribe(channelName);
  }

  // Subscribe to escrow transaction updates
  subscribeToEscrowUpdates(
    userId: string | undefined,
    callback: (update: EscrowTransactionUpdate) => void
  ): () => void {
    const channelName = userId ? `escrow_user:${userId}` : 'escrow_all';

    if (this.channels.has(channelName)) {
      return () => this.unsubscribe(channelName);
    }

    const filter = userId ? `buyer_id=eq.${userId},seller_id=eq.${userId}` : undefined;

    const channel = supabase!
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'escrow_transactions',
          filter,
        },
        (payload) => {
          callback(payload.new as EscrowTransactionUpdate);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => this.unsubscribe(channelName);
  }

  // Subscribe to user notifications
  subscribeToNotifications(
    userId: string,
    callback: (notification: NotificationUpdate) => void
  ): () => void {
    const channelName = `notifications:${userId}`;

    if (this.channels.has(channelName)) {
      return () => this.unsubscribe(channelName);
    }

    const channel = supabase!
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as NotificationUpdate);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => this.unsubscribe(channelName);
  }

  // Subscribe to reviews for a merchant
  subscribeToReviews(
    merchantId: string,
    callback: (review: ReviewUpdate) => void
  ): () => void {
    const channelName = `reviews:${merchantId}`;

    if (this.channels.has(channelName)) {
      return () => this.unsubscribe(channelName);
    }

    const channel = supabase!
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reviews',
          filter: `merchant_id=eq.${merchantId}`,
        },
        (payload) => {
          callback(payload.new as ReviewUpdate);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => this.unsubscribe(channelName);
  }

  // Subscribe to payment status updates
  subscribeToPaymentUpdates(
    userId: string,
    callback: (payment: PaymentUpdate) => void
  ): () => void {
    const channelName = `payments:${userId}`;

    if (this.channels.has(channelName)) {
      return () => this.unsubscribe(channelName);
    }

    const channel = supabase!
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as PaymentUpdate);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => this.unsubscribe(channelName);
  }

  // Subscribe to KYC status updates
  subscribeToKYCUpdates(
    userId: string,
    callback: (kyc: KYCUpdate) => void
  ): () => void {
    const channelName = `kyc:${userId}`;

    if (this.channels.has(channelName)) {
      return () => this.unsubscribe(channelName);
    }

    const channel = supabase!
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kyc_documents',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as KYCUpdate);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => this.unsubscribe(channelName);
  }

  // Subscribe to toll payment updates
  subscribeToTollPayments(
    userId: string,
    callback: (payment: TollPaymentUpdate) => void
  ): () => void {
    const channelName = `toll_payments:${userId}`;

    if (this.channels.has(channelName)) {
      return () => this.unsubscribe(channelName);
    }

    const channel = supabase!
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'toll_payments',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as TollPaymentUpdate);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);

    return () => this.unsubscribe(channelName);
  }

  // Broadcast driver location (for drivers to share their location)
  async broadcastDriverLocation(location: DriverLocationUpdate): Promise<void> {
    const channelName = `driver_location:${location.driverId}`;

    let channel = this.channels.get(channelName);

    if (!channel) {
      channel = supabase!.channel(channelName).subscribe();
      this.channels.set(channelName, channel);
    }

    await channel.send({
      type: 'broadcast',
      event: 'location_update',
      payload: location,
    });
  }

  /**
   * Subscribe to a channel (with auth check)
   */
  private async subscribeToChannel(channelName: string): Promise<RealtimeChannel | null> {
    if (!supabase) {
      console.warn('Supabase not available');
      return null;
    }

    if (!this.isInitialized) {
      console.warn('Realtime service not authenticated, waiting for Firebase auth...');
      // Wait for auth to initialize
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (!this.isInitialized) {
        console.error('Failed to authenticate realtime service');
        return null;
      }
    }

    // Create and return channel
    const channel = supabase.channel(channelName);
    this.channels.set(channelName, channel);
    return channel;
  }

  // Unsubscribe from a specific channel
  private unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel && supabase) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  // Unsubscribe from all channels
  unsubscribeAll(): void {
    if (supabase) {
      this.channels.forEach((channel) => {
        supabase!.removeChannel(channel);
      });
    }
    this.channels.clear();
  }

  // Check connection status
  getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' {
    if (!this.isInitialized) return 'disconnected';
    // Return 'connected' if we have active channels
    return this.channels.size > 0 ? 'connected' : 'disconnected';
  }
}

export const realtimeService = new RealtimeService();
