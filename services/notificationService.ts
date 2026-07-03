// Notification Service
// Handles all notification-related functionality including push notifications, in-app alerts, and real-time updates

import { Platform } from "react-native"; // Added missing Platform import
// Removed unused import
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService } from "./authService";
import { apiClient, ApiResponse } from "./api";
import { supabase } from "../config/supabase";

// Define types for better type safety
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  timestamp?: string;
  data?: Record<string, any>;
  role?: string;
  type?: 'order' | 'payment' | 'promotion' | 'system';
}

export interface NotificationSettings {
  email_notifications?: boolean;
  push_notifications?: boolean;
  pushNotifications?: boolean;
  emailNotifications?: boolean;
  sms_notifications?: boolean;
  smsNotifications?: boolean;
  in_app_alerts?: boolean;
  inAppAlerts?: boolean;
  sound_enabled?: boolean;
  soundEnabled?: boolean;
  vibration_enabled?: boolean;
  vibrationEnabled?: boolean;
  categories?: {
    orders: boolean;
    promotions: boolean;
    messages: boolean;
    updates: boolean;
  };
  quietHours?: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

interface NotificationHistoryFilters {
  fromDate?: string;
  toDate?: string;
  startDate?: string;
  endDate?: string;
  type?: string;
  read?: boolean;
  limit?: number;
  offset?: number;
}

export interface ScheduledNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  scheduled_at: string;
  status: 'pending' | 'sent' | 'cancelled';
  type?: string;
  data?: Record<string, any>;
}

class NotificationService {
  private notificationListener: any = null;
  private subscription: any = null;
  private appStateListener: any = null;
  private unreadCount: number = 0;
  private onUnreadCountChangeCallbacks: ((count: number) => void)[] = [];

  // Subscribe to real-time notifications
  subscribeToNotifications(
    userId: string,
    callback: (notification: Notification) => void
  ) {
    try {
      // Create a channel for real-time notifications
      const channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log("🔔 Real-time notification received:", payload);
            const notification = payload.new as Notification;
            callback(notification);
          }
        )
        .subscribe();

      return {
        unsubscribe: () => {
          try {
            supabase.removeChannel(channel);
          } catch (error) {
            console.error("Error unsubscribing from notifications:", error);
          }
        },
      };
    } catch (error) {
      console.error("Error subscribing to notifications:", error);
      return {
        unsubscribe: () => {},
      };
    }
  }

  // Get unread notification count
  async getUnreadCount(role?: string): Promise<ApiResponse<{ count: number }>> {
    try {
      const token = await authService.getToken();
      if (!token) {
        // Return 0 count when not authenticated, this is normal during app startup
        return { success: true, data: { count: 0 } };
      }

      // Get user data
      const userData = await authService.getStoredUser();
      if (!userData?.id) {
        return { success: true, data: { count: 0 } };
      }

      // Get user role if not provided
      let userRole = role;
      if (!userRole) {
        userRole = (await AsyncStorage.getItem("userRole")) || "consumer";
      }

      // Get user ID from Supabase
      const { data: users, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("firebase_uid", userData.id)
        .single();

      if (userError || !users) {
        return { success: true, data: { count: 0 } };
      }

      // Count unread notifications
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", users.id)
        .eq("read", false)
        .eq("role", userRole);

      if (error) {
        return { success: true, data: { count: 0 } };
      }

      return { success: true, data: { count: count || 0 } };
    } catch (error) {
      console.error("Error getting unread count:", error);
      return { success: true, data: { count: 0 } };
    }
  }

  // Mark a notification as read
  async markAsRead(
    notificationId: string
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      const token = await authService.getToken();
      if (!token) {
        return { success: false, error: "Authentication required" };
      }

      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: { message: "Notification marked as read" },
      };
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return { success: false, error: "Failed to mark notification as read" };
    }
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<ApiResponse<{ message: string }>> {
    try {
      const token = await authService.getToken();
      if (!token) {
        return { success: false, error: "Authentication required" };
      }

      // Get user data
      const userData = await authService.getStoredUser();
      if (!userData?.id) {
        return { success: false, error: "User not found" };
      }

      // Get user role
      const userRole = (await AsyncStorage.getItem("userRole")) || "consumer";

      // Get user ID from Supabase
      const { data: users, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("firebase_uid", userData.id)
        .single();

      if (userError || !users) {
        return { success: false, error: "User not found in database" };
      }

      // Mark all notifications as read
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", users.id)
        .eq("role", userRole)
        .eq("read", false);

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: { message: "All notifications marked as read" },
      };
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return {
        success: false,
        error: "Failed to mark all notifications as read",
      };
    }
  }

  // Get notifications with pagination
  async getNotifications(
    page: number = 1,
    limit: number = 20,
    role?: string
  ): Promise<ApiResponse<Notification[]>> {
    try {
      const token = await authService.getToken();
      if (!token) {
        return { success: false, error: "Authentication required" };
      }

      // Get user data
      const userData = await authService.getStoredUser();
      if (!userData?.id) {
        return { success: false, error: "User not found" };
      }

      // Get user role if not provided
      let userRole = role;
      if (!userRole) {
        userRole = (await AsyncStorage.getItem("userRole")) || "consumer";
      }

      // Get user ID from Supabase
      const { data: users, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("firebase_uid", userData.id)
        .single();

      if (userError || !users) {
        return { success: false, error: "User not found in database" };
      }

      // Get notifications
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", users.id)
        .eq("role", userRole)
        .order("created_at", { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error("Error getting notifications:", error);
      return { success: false, error: "Failed to get notifications" };
    }
  }

  // Send local notification (for foreground notifications)
  async sendLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      // For mobile platforms, we might want to use a notification library
      if (Platform.OS !== "web") {
        // In a real implementation, we would use something like expo-notifications
        console.log("📱 Local notification (mobile):", title, body, data);
        return;
      }

      // For web, show a browser notification if permissions are granted
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification(title, {
            body,
            data,
          });
        } else if (Notification.permission !== "denied") {
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            new Notification(title, {
              body,
              data,
            });
          }
        }
      }
    } catch (error) {
      console.error("Error sending local notification:", error);
    }
  }

  // Register device for push notifications
  async registerDevice(): Promise<string | null> {
    try {
      let deviceId = await AsyncStorage.getItem("device_id");

      if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        await AsyncStorage.setItem("device_id", deviceId);
      }

      return deviceId;
    } catch (error) {
      console.error("Error registering device:", error);
      return null;
    }
  }

  // Initialize push notifications
  async initializePushNotifications(): Promise<boolean> {
    try {
      // Check if notifications are supported (skip on server-side environments)
      if (Platform.OS === "web" && typeof window === "undefined") {
        console.log("Push notifications not supported in this environment");
        return false;
      }

      const isRegistered = await AsyncStorage.getItem("fcm_registered");

      if (isRegistered === "true") {
        return true;
      }

      // Platform-specific initialization would go here
      console.log("Push notifications initialized");
      return true;
    } catch (error) {
      console.error("Error initializing push notifications:", error);
      return false;
    }
  }

  // Update notification preferences
  async updateSettings(
    preferences: NotificationSettings
  ): Promise<ApiResponse<NotificationSettings>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: "Authentication required" };
    }

    return apiClient.put("/api/notifications/preferences", preferences, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Get notification preferences
  async getSettings(): Promise<ApiResponse<NotificationSettings>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: "Authentication required" };
    }

    return apiClient.get("/api/notifications/preferences", {
      Authorization: `Bearer ${token}`,
    });
  }

  // Get notification history
  async getHistory(filters?: NotificationHistoryFilters): Promise<ApiResponse<Notification[]>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: "Authentication required" };
    }

    let endpoint = "/api/notifications/history";
    const queryParams = new URLSearchParams();

    if (filters) {
      if (filters.fromDate) queryParams.append("fromDate", filters.fromDate);
      if (filters.toDate) queryParams.append("toDate", filters.toDate);
      if (filters.startDate) queryParams.append("fromDate", filters.startDate);
      if (filters.endDate) queryParams.append("toDate", filters.endDate);
      if (filters.limit) queryParams.append("limit", filters.limit.toString());
      if (filters.offset)
        queryParams.append("offset", filters.offset.toString());
    }

    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`;
    }

    return apiClient.get<Notification[]>(endpoint, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Helper function for retry logic
  private async withRetry<T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 1000
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries === 0) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.withRetry(fn, retries - 1, delay * 2);
    }
  }

  // Check network connectivity with fallback to fetch
  private async checkNetworkConnectivity(): Promise<boolean> {
    try {
      // First try using NetInfo if available
      try {
        // Safely import NetInfo to avoid crashes if not available
        const netInfoModule = await import("@react-native-community/netinfo");
        if (netInfoModule && netInfoModule.default) {
          const state = await netInfoModule.default.fetch();
          if (state.isConnected !== null) {
            return state.isConnected;
          }
        }
      } catch (netInfoError) {
        console.warn(
          "NetInfo check failed, falling back to fetch:",
          netInfoError
        );
      }

      // Fallback to fetch if NetInfo is not available or fails
      if (typeof fetch !== "undefined") {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        try {
          await fetch("https://www.google.com", {
            method: "HEAD",
            cache: "no-store",
            mode: "no-cors",
            signal: controller.signal,
          });
          clearTimeout(timeout);
          return true;
        } catch (fetchError) {
          clearTimeout(timeout);
          console.warn("Fetch-based network check failed:", fetchError);
          return false;
        }
      }

      // If we can't check connectivity, assume we're online
      return true;
    } catch (error) {
      console.warn("Network check failed:", error);
      return true; // Assume online if check fails
    }
  }

  // Get unread count with enhanced error handling and retry logic
  async getUnreadCountWithRetry(
    role?: string
  ): Promise<ApiResponse<{ count: number }>> {
    try {
      // Check network connectivity first
      const isConnected = await this.checkNetworkConnectivity();
      if (!isConnected) {
        console.log("No network connection, using cached notification count");
        return { success: true, data: { count: this.unreadCount } };
      }

      // Use retry logic for the main operation
      return await this.withRetry(async () => {
        const token = await authService.getToken();
        if (!token) {
          // This is normal during app startup, return cached count
          console.log(
            "No auth token available, using cached notification count"
          );
          return { success: true, data: { count: this.unreadCount } };
        }

        // Get user data
        const userData = await authService.getStoredUser();
        if (!userData?.id) {
          console.log(
            "No user data available, using cached notification count"
          );
          return { success: true, data: { count: this.unreadCount } };
        }

        // Get user role if not provided
        let userRole = role;
        if (!userRole) {
          userRole = (await AsyncStorage.getItem("userRole")) || "consumer";
        }

        // Use Supabase client directly
        const { supabase } = await import("../config/supabase");

        // Get user ID from Supabase with error handling
        const { data: users, error: userError } = await supabase
          .from("users")
          .select("id")
          .eq("firebase_uid", userData.id)
          .single();

        if (userError || !users) {
          console.log(
            "User not found in database, using cached notification count"
          );
          return { success: true, data: { count: this.unreadCount } };
        }

        // Count unread notifications with timeout
        const countPromise = supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", users.id)
          .eq("read", false)
          .eq("role", userRole);

        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 10000)
        );

        const { count, error } = (await Promise.race([
          countPromise,
          timeoutPromise,
        ])) as any;

        if (error) {
          console.log("Error counting notifications, using cached count");
          return { success: true, data: { count: this.unreadCount } };
        }

        const finalCount = count || 0;
        console.log(`🔔 Unread notifications: ${finalCount}`);

        // Update internal count and notify listeners
        this.unreadCount = finalCount;
        this.notifyUnreadCountChange(finalCount);

        return { success: true, data: { count: finalCount } };
      });
    } catch (error: any) {
      console.error("Error getting unread count:", error);

      // Return cached count during error
      return {
        success: true,
        data: { count: this.unreadCount },
      };
    }
  }

  // Subscribe to unread count changes
  onUnreadCountChange(callback: (count: number) => void): () => void {
    this.onUnreadCountChangeCallbacks.push(callback);
    // Immediately call with current count
    callback(this.unreadCount);
    return () => {
      const index = this.onUnreadCountChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.onUnreadCountChangeCallbacks.splice(index, 1);
      }
    };
  }

  // Notify all subscribers about unread count change
  private notifyUnreadCountChange(count: number): void {
    this.onUnreadCountChangeCallbacks.forEach((callback) => callback(count));
  }

  // Delete a notification
  async deleteNotification(notificationId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const user = await authService.getCurrentUser();
      if (!user.success || !user.data) {
        return { success: false, error: 'User not authenticated' };
      }

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.data.id);

      if (error) {
        console.error('Error deleting notification:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: { message: 'Notification deleted' } };
    } catch (error) {
      console.error('Error deleting notification:', error);
      return { success: false, error: 'Failed to delete notification' };
    }
  }

  // Update category preferences
  async updateCategoryPreferences(categories: Record<string, boolean>): Promise<ApiResponse<NotificationSettings>> {
    try {
      const user = await authService.getCurrentUser();
      if (!user.success || !user.data) {
        return { success: false, error: 'User not authenticated' };
      }

      const currentSettings = await this.getSettings();
      if (!currentSettings.success || !currentSettings.data) {
        return { success: false, error: 'Failed to get current settings' };
      }

      const updatedSettings = {
        ...currentSettings.data,
        categories: {
          ...currentSettings.data.categories,
          ...categories
        }
      };

      return await this.updateSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating category preferences:', error);
      return { success: false, error: 'Failed to update category preferences' };
    }
  }

  // Set quiet hours
  async setQuietHours(quietHours: { enabled: boolean; start: string; end: string }): Promise<ApiResponse<NotificationSettings>> {
    try {
      const user = await authService.getCurrentUser();
      if (!user.success || !user.data) {
        return { success: false, error: 'User not authenticated' };
      }

      const currentSettings = await this.getSettings();
      if (!currentSettings.success || !currentSettings.data) {
        return { success: false, error: 'Failed to get current settings' };
      }

      const updatedSettings = {
        ...currentSettings.data,
        quietHours
      };

      return await this.updateSettings(updatedSettings);
    } catch (error) {
      console.error('Error setting quiet hours:', error);
      return { success: false, error: 'Failed to set quiet hours' };
    }
  }

  // Get push history (alias for getHistory)
  async getPushHistory(filters?: NotificationHistoryFilters): Promise<ApiResponse<Notification[]>> {
    return this.getHistory({
      fromDate: filters?.startDate,
      toDate: filters?.endDate,
      type: filters?.type,
      read: filters?.read,
      limit: filters?.limit,
      offset: filters?.offset,
    });
  }

  // Get scheduled notifications
  async getScheduledNotifications(): Promise<ApiResponse<ScheduledNotification[]>> {
    try {
      const user = await authService.getCurrentUser();
      if (!user.success || !user.data) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('scheduled_notifications')
        .select('*')
        .eq('user_id', user.data.id)
        .order('scheduled_at', { ascending: true });

      if (error) {
        console.error('Error fetching scheduled notifications:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching scheduled notifications:', error);
      return { success: false, error: 'Failed to fetch scheduled notifications' };
    }
  }

  // Cancel a scheduled notification
  async cancelScheduledNotification(notificationId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const user = await authService.getCurrentUser();
      if (!user.success || !user.data) {
        return { success: false, error: 'User not authenticated' };
      }

      const { error } = await supabase
        .from('scheduled_notifications')
        .update({ status: 'cancelled' })
        .eq('id', notificationId)
        .eq('user_id', user.data.id);

      if (error) {
        console.error('Error cancelling scheduled notification:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: { message: 'Scheduled notification cancelled' } };
    } catch (error) {
      console.error('Error cancelling scheduled notification:', error);
      return { success: false, error: 'Failed to cancel scheduled notification' };
    }
  }

  // Clean up resources
  cleanup(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }

    if (this.appStateListener) {
      this.appStateListener.remove();
      this.appStateListener = null;
    }
  }
}

export const notificationService = new NotificationService();
