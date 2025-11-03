
import { auth } from '../config/firebase';
import { setSupabaseAuthToken } from '../config/supabase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SessionService {
  private unsubscribe: (() => void) | null = null;
  private sessionCheckInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize session management
   * Sets up Firebase auth state listener and syncs with Supabase
   */
  initialize() {
    console.log('🔐 Initializing session service...');

    // Listen to Firebase auth state changes
    this.unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (user) {
        console.log('✅ User authenticated:', user.uid);
        
        // Get fresh token and sync with Supabase
        const token = await user.getIdToken();
        await setSupabaseAuthToken(token);
        
        // Store session info
        await this.storeSessionInfo(user, token);
        
        // Start session monitoring
        this.startSessionMonitoring();
      } else {
        console.log('🚪 User signed out');
        
        // Clear Supabase session
        await setSupabaseAuthToken(null);
        
        // Clear session info
        await this.clearSessionInfo();
        
        // Stop session monitoring
        this.stopSessionMonitoring();
      }
    });

    console.log('✅ Session service initialized');
  }

  /**
   * Store session information
   */
  private async storeSessionInfo(user: FirebaseUser, token: string) {
    try {
      const sessionData = {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        lastActivity: Date.now(),
        tokenExpiry: Date.now() + (55 * 60 * 1000), // 55 minutes
      };

      await AsyncStorage.setItem('sessionData', JSON.stringify(sessionData));
      await AsyncStorage.setItem('lastTokenRefresh', Date.now().toString());
    } catch (error) {
      console.error('Error storing session info:', error);
    }
  }

  /**
   * Clear session information
   */
  private async clearSessionInfo() {
    try {
      await AsyncStorage.multiRemove([
        'sessionData',
        'lastTokenRefresh',
        'tokenExpiry',
      ]);
    } catch (error) {
      console.error('Error clearing session info:', error);
    }
  }

  /**
   * Start monitoring session for token refresh
   */
  private startSessionMonitoring() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }

    // Check every 5 minutes if token needs refresh
    this.sessionCheckInterval = setInterval(async () => {
      await this.checkAndRefreshToken();
    }, 5 * 60 * 1000);
  }

  /**
   * Stop session monitoring
   */
  private stopSessionMonitoring() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  /**
   * Check if token needs refresh and refresh if necessary
   */
  private async checkAndRefreshToken() {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const expiryStr = await AsyncStorage.getItem('tokenExpiry');
      if (!expiryStr) return;

      const expiry = parseInt(expiryStr);
      const now = Date.now();

      // Refresh if token expires in less than 10 minutes
      if (now > (expiry - 10 * 60 * 1000)) {
        console.log('🔄 Refreshing Firebase token...');
        
        const freshToken = await user.getIdToken(true);
        
        // Sync with Supabase
        await setSupabaseAuthToken(freshToken);
        
        // Update session info
        await this.storeSessionInfo(user, freshToken);
        
        console.log('✅ Token refreshed and synced');
      }
    } catch (error) {
      console.error('Error checking/refreshing token:', error);
    }
  }

  /**
   * Manually refresh session
   */
  async refreshSession(): Promise<boolean> {
    try {
      const user = auth.currentUser;
      if (!user) return false;

      const freshToken = await user.getIdToken(true);
      await setSupabaseAuthToken(freshToken);
      await this.storeSessionInfo(user, freshToken);

      return true;
    } catch (error) {
      console.error('Error refreshing session:', error);
      return false;
    }
  }

  /**
   * Get current session info
   */
  async getSessionInfo() {
    try {
      const sessionDataStr = await AsyncStorage.getItem('sessionData');
      if (!sessionDataStr) return null;

      return JSON.parse(sessionDataStr);
    } catch (error) {
      console.error('Error getting session info:', error);
      return null;
    }
  }

  /**
   * Cleanup
   */
  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.stopSessionMonitoring();
  }
}

export const sessionService = new SessionService();
