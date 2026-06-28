
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './api';

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
      // Send events to backend
      await apiClient.post('/api/analytics/events', {
        events: this.eventQueue,
      });

      // Clear queue on success
      this.eventQueue = [];
      await AsyncStorage.removeItem(this.QUEUE_KEY);
    } catch (error) {
      console.error('Error flushing analytics:', error);
      // Keep events in queue for retry
    }
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
