
import { supabase } from '../config/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

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

class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();

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

    const channel = supabase
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

    const channel = supabase
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

    const channel = supabase
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

    const channel = supabase
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

  // Broadcast driver location (for drivers to share their location)
  async broadcastDriverLocation(location: DriverLocationUpdate): Promise<void> {
    const channelName = `driver_location:${location.driverId}`;
    
    let channel = this.channels.get(channelName);
    
    if (!channel) {
      channel = supabase.channel(channelName).subscribe();
      this.channels.set(channelName, channel);
    }

    await channel.send({
      type: 'broadcast',
      event: 'location_update',
      payload: location,
    });
  }

  // Unsubscribe from a specific channel
  private unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  // Unsubscribe from all channels
  unsubscribeAll(): void {
    this.channels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
  }

  // Check connection status
  getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' {
    // Supabase channels don't expose status directly
    // Return 'connected' if we have active channels
    return this.channels.size > 0 ? 'connected' : 'disconnected';
  }
}

export const realtimeService = new RealtimeService();
