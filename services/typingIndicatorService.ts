
import { supabase } from '../config/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
  timestamp: string;
}

class TypingIndicatorService {
  private channel: RealtimeChannel | null = null;
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private readonly TYPING_TIMEOUT = 3000; // 3 seconds

  /**
   * Initialize typing indicator channel
   */
  async initialize(conversationId: string): Promise<void> {
    try {
      // Clean up existing channel
      if (this.channel) {
        await this.cleanup();
      }

      // Create new channel for this conversation
      this.channel = supabase.channel(`typing:${conversationId}`, {
        config: {
          broadcast: { self: true },
          presence: { key: conversationId },
        },
      });

      await this.channel.subscribe();
    } catch (error) {
      console.error('Error initializing typing indicator:', error);
      throw error;
    }
  }

  /**
   * Broadcast typing status
   */
  async sendTypingIndicator(
    conversationId: string,
    userId: string,
    userName: string,
    isTyping: boolean
  ): Promise<void> {
    try {
      if (!this.channel) {
        await this.initialize(conversationId);
      }

      const indicator: TypingIndicator = {
        conversationId,
        userId,
        userName,
        isTyping,
        timestamp: new Date().toISOString(),
      };

      await this.channel?.send({
        type: 'broadcast',
        event: 'typing',
        payload: indicator,
      });

      // Auto-stop typing after timeout
      if (isTyping) {
        this.resetTypingTimeout(conversationId, userId, userName);
      }
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  }

  /**
   * Listen for typing indicators
   */
  onTypingIndicator(
    callback: (indicator: TypingIndicator) => void
  ): () => void {
    if (!this.channel) {
      console.warn('Channel not initialized');
      return () => {};
    }

    const handler = this.channel.on(
      'broadcast',
      { event: 'typing' },
      ({ payload }) => {
        callback(payload as TypingIndicator);
      }
    );

    return () => {
      if (this.channel) {
        this.channel.off('broadcast', handler);
      }
    };
  }

  /**
   * Reset typing timeout for a user
   */
  private resetTypingTimeout(
    conversationId: string,
    userId: string,
    userName: string
  ): void {
    const key = `${conversationId}-${userId}`;
    
    // Clear existing timeout
    if (this.typingTimeouts.has(key)) {
      clearTimeout(this.typingTimeouts.get(key)!);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      this.sendTypingIndicator(conversationId, userId, userName, false);
      this.typingTimeouts.delete(key);
    }, this.TYPING_TIMEOUT);

    this.typingTimeouts.set(key, timeout);
  }

  /**
   * Cleanup channel and timeouts
   */
  async cleanup(): Promise<void> {
    // Clear all timeouts
    this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.typingTimeouts.clear();

    // Unsubscribe from channel
    if (this.channel) {
      await this.channel.unsubscribe();
      this.channel = null;
    }
  }
}

export const typingIndicatorService = new TypingIndicatorService();
