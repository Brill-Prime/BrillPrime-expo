
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
}

class AnalyticsService {
  private eventQueue: AnalyticsEvent[] = [];
  private readonly QUEUE_KEY = 'analytics_queue';
  private readonly MAX_QUEUE_SIZE = 50;

  async trackEvent(eventName: string, properties?: Record<string, any>) {
    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        platform: this.getPlatform(),
        appVersion: '1.0.0',
      },
      timestamp: Date.now(),
    };

    this.eventQueue.push(event);

    // Save to storage
    await this.saveQueue();

    // Send if queue is full
    if (this.eventQueue.length >= this.MAX_QUEUE_SIZE) {
      await this.flush();
    }
  }

  async trackUserAction(action: string, details?: Record<string, any>) {
    await this.trackEvent('user_action', { action, ...details });
  }

  async trackButtonClick(buttonName: string, screenName: string) {
    await this.trackEvent('button_click', { buttonName, screenName });
  }

  async trackFormSubmit(formName: string, success: boolean, errorMessage?: string) {
    await this.trackEvent('form_submit', { formName, success, errorMessage });
  }

  async trackAPICall(endpoint: string, method: string, statusCode: number, duration: number) {
    await this.trackEvent('api_call', { endpoint, method, statusCode, duration });
  }

  async trackNavigation(fromScreen: string, toScreen: string) {
    await this.trackEvent('navigation', { from: fromScreen, to: toScreen });
  }

  private getPlatform(): string {
    if (typeof window !== 'undefined') {
      return 'web';
    }
    return 'mobile';
  }

  async trackScreen(screenName: string) {
    await this.trackEvent('screen_view', { screen_name: screenName });
  }

  async trackError(error: Error, context?: string) {
    await this.trackEvent('error', {
      message: error.message,
      stack: error.stack,
      context,
    });
  }

  async trackPurchase(amount: number, itemCount: number) {
    await this.trackEvent('purchase', { amount, item_count: itemCount });
  }

  private async saveQueue() {
    try {
      await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(this.eventQueue));
    } catch (error) {
      console.error('Error saving analytics queue:', error);
    }
  }

  private async loadQueue() {
    try {
      const queue = await AsyncStorage.getItem(this.QUEUE_KEY);
      if (queue) {
        this.eventQueue = JSON.parse(queue);
      }
    } catch (error) {
      console.error('Error loading analytics queue:', error);
    }
  }

  async flush() {
    if (this.eventQueue.length === 0) return;

    try {
      if (!supabase) {
        console.warn('Supabase not available for analytics');
        return;
      }

      // Prepare events for Supabase insertion
      const supabaseEvents = this.eventQueue.map(event => ({
        event_name: event.name,
        event_properties: event.properties || {},
        timestamp: new Date(event.timestamp).toISOString(),
        platform: event.properties?.platform || this.getPlatform(),
        app_version: event.properties?.appVersion || '1.0.0',
        device_info: this.getDeviceInfo(),
        session_id: this.getSessionId(),
      }));

      const { error } = await supabase
        .from('analytics_events')
        .insert(supabaseEvents);

      if (error) {
        console.error('Failed to insert analytics events:', error);
        return;
      }

      // Clear queue on success
      this.eventQueue = [];
      await AsyncStorage.removeItem(this.QUEUE_KEY);
      console.log(`✅ Flushed ${supabaseEvents.length} analytics events to Supabase`);
    } catch (error) {
      console.error('Error flushing analytics:', error);
      // Keep events in queue for retry
    }
  }

  // Get device info
  private getDeviceInfo(): Record<string, any> {
    if (typeof window !== 'undefined') {
      return {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    }
    return {
      platform: 'mobile',
      deviceType: 'unknown',
    };
  }

  // Get or create session ID
  private getSessionId(): string {
    // For React Native, we'd use AsyncStorage, but for simplicity, generate a new one each time
    // In a real implementation, you'd store this persistently
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async initialize() {
    await this.loadQueue();

    // Flush queue periodically (every 5 minutes)
    setInterval(() => {
      this.flush();
    }, 5 * 60 * 1000);
  }
}

export const analyticsService = new AnalyticsService();
