// Authentication Service
// Handles user authentication, session management, and user state

import { apiClient } from './api';
import { API_ENDPOINTS } from './apiEndpoints';
import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import {
  User,
  AuthResponse,
  SignUpRequest,
  SignInRequest,
  VerifyOTPRequest,
  ResetPasswordRequest,
  ConfirmPasswordResetRequest,
  ApiResponse
} from './types';

class AuthService {
  private readonly TOKEN_KEY = 'userToken';
  private readonly USER_KEY = 'userData';
  private readonly ROLE_KEY = 'userRole';
  private currentUser: any = null;
  private authToken: string | null = null;

  constructor() {
    this.currentUser = null;
    this.authToken = null;
  }

  // Sign up new user
  async signUp({ email, password, firstName, lastName, phoneNumber, role }: SignUpRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      console.log('Starting signup process for:', email);

      const displayName = `${firstName} ${lastName}`.trim();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone_number: phoneNumber || null,
            role,
            full_name: displayName,
          },
        },
      });

      if (error) {
        throw error;
      }

      const supabaseUser = data.user;
      const session = data.session;

      if (!supabaseUser) {
        return {
          success: false,
          error: 'Your account could not be created. Please try again.',
        };
      }

      const accessToken = session?.access_token || (await supabase.auth.getSession()).data.session?.access_token || '';
      const pendingUserData = {
        email,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber || null,
        role,
        full_name: displayName,
      };

      await AsyncStorage.multiSet([
        ['pendingUserData', JSON.stringify(pendingUserData)],
        ['tempUserEmail', email],
        ['tempUserRole', role],
      ]);

      const authData: AuthResponse = {
        token: accessToken,
        user: {
          id: supabaseUser.id,
          email: supabaseUser.email || email,
          name: displayName,
          role,
          phone: phoneNumber || '',
          isVerified: !!supabaseUser.email_confirmed_at,
          profileImageUrl: undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      if (accessToken) {
        await this.storeAuthData(authData);
      }

      if (!accessToken) {
        return {
          success: true,
          data: authData,
        };
      }

      const profileSync = await apiClient.post<Array<{ firebase_uid?: string; role?: string }>>(
        '/rest/v1/users',
        {
          firebase_uid: supabaseUser.id,
          email: supabaseUser.email,
          role,
          phone_number: phoneNumber || null,
          full_name: displayName,
        },
        {
          Authorization: `Bearer ${accessToken}`,
          Prefer: 'resolution=merge-duplicates,return=representation',
        }
      );

      if (!profileSync.success) {
        console.error('Supabase profile creation failed after Supabase signup:', profileSync.error);
        if (accessToken) {
          await this.clearAuthData();
        }
        return {
          success: false,
          error: 'Your login account was created, but BrillPrime could not finish setting up your profile. Please contact support before trying again.',
        };
      }

      return {
        success: true,
        data: authData,
      };
    } catch (error: any) {
      console.error('SignUp error:', error);

      if (error?.status === 422 || error?.message?.includes('already registered')) {
        return { success: false, error: 'That email address is already in use!' };
      }

      if (error?.message?.toLowerCase().includes('email rate limit exceeded') || error?.message?.toLowerCase().includes('rate limit')) {
        return {
          success: false,
          error: 'Too many signup attempts for this email. Please wait a few minutes and try again.',
        };
      }

      if (error?.message?.includes('invalid email')) {
        return { success: false, error: 'That email address is invalid!' };
      }

      if (error?.message?.includes('Password')) {
        return { success: false, error: 'Password should be at least 6 characters long.' };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  // Sign in user
  async signInWithEmail({ email, password }: SignInRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        throw error;
      }

      const session = data.session;
      const supabaseUser = data.user;

      if (!session || !supabaseUser) {
        return {
          success: false,
          error: 'Unable to authenticate with Supabase. Please try again.',
        };
      }

      const firebaseToken = session.access_token;

      const profileResponse = await apiClient.get<Array<{ role?: string; is_active?: boolean }>>([
        `/rest/v1/users`,
        `?firebase_uid=eq.${encodeURIComponent(supabaseUser.id)}`,
        `&select=role,is_active`,
        `&limit=1`,
      ].join(''), {
        Authorization: `Bearer ${firebaseToken}`,
      });

      const supportedRoles = ['consumer', 'merchant', 'driver'] as const;
      const normalizeStoredRole = (role?: string | null): 'consumer' | 'merchant' | 'driver' | null => {
        if (!role || typeof role !== 'string') return null;
        const normalized = role.trim().toLowerCase();
        return supportedRoles.includes(normalized as (typeof supportedRoles)[number])
          ? normalized as 'consumer' | 'merchant' | 'driver'
          : null;
      };

      let userRole: 'consumer' | 'merchant' | 'driver';

      if (!profileResponse.success) {
        console.error('Role verification request failed:', profileResponse.error || 'Unknown Supabase request error');
        return {
          success: false,
          error: 'We could not verify your account with BrillPrime. Please check your connection and try again. If this continues, contact support.',
        };
      }

      if (Array.isArray(profileResponse.data) && profileResponse.data.length === 1) {
        const profile = profileResponse.data[0];
        const normalizedRole = normalizeStoredRole(profile.role);

        if (profile.is_active === false) {
          return {
            success: false,
            error: 'This account is currently inactive. Please contact support.',
          };
        }

        if (!normalizedRole) {
          return {
            success: false,
            error: 'This account does not have a supported BrillPrime role. Please contact support.',
          };
        }

        userRole = normalizedRole;
      } else {
        console.warn('Supabase user profile not found — falling back to locally selected role.', profileResponse.error);

        const storedRole = normalizeStoredRole(await AsyncStorage.getItem('selectedRole'));

        if (!storedRole) {
          return {
            success: false,
            error: 'Your account profile could not be found. Please sign up again or contact support.',
          };
        }

        userRole = storedRole;

        apiClient
          .post(
            '/rest/v1/users',
            {
              firebase_uid: supabaseUser.id,
              email: supabaseUser.email,
              role: userRole,
              full_name: supabaseUser.user_metadata?.full_name || '',
            },
            {
              Authorization: `Bearer ${firebaseToken}`,
              Prefer: 'resolution=merge-duplicates',
            },
          )
          .then(() => console.log('Supabase profile back-filled successfully.'))
          .catch((err: any) => console.warn('Supabase profile back-fill failed (non-critical):', err));
      }

      const authData: AuthResponse = {
        token: firebaseToken,
        user: {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          name: supabaseUser.user_metadata?.full_name || '',
          role: userRole,
          phone: supabaseUser.phone || '',
          isVerified: !!supabaseUser.email_confirmed_at,
          profileImageUrl: supabaseUser.user_metadata?.avatar_url || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      await this.storeAuthData(authData);

      return {
        success: true,
        data: authData,
      };
    } catch (error: any) {
      console.error('SignIn error:', error);

      let errorMessage = 'An unknown error occurred';
      if (error?.status === 400 || error?.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password.';
      } else if (error?.status === 403 || error?.message?.includes('Email not confirmed')) {
        errorMessage = 'Please confirm your email before signing in.';
      } else {
        errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  private maybeRedirectToOAuthUrl(provider: string, url?: string): boolean {
    if (!url) {
      return false;
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.href = url;
      return true;
    }

    const redirectTarget = 'brillprime://auth/callback';
    WebBrowser.openAuthSessionAsync(url, redirectTarget).catch(() => {
      // Fall back to the provider URL if the browser session cannot be opened.
      if (Platform.OS !== 'web' && typeof window !== 'undefined') {
        window.location.href = url;
      }
    });

    return true;
  }

  // Sign in with Google
  async signInWithGoogle(role?: string): Promise<ApiResponse<AuthResponse>> {
    try {
      const provider = 'google';
      const redirectTo = Platform.OS === 'web' && typeof window !== 'undefined'
        ? window.location.origin
        : 'brillprime://auth/callback';
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        if (this.maybeRedirectToOAuthUrl(provider, data.url)) {
          return {
            success: false,
            requiresRedirect: true,
            error: 'Redirecting to Google sign-in...',
          } as ApiResponse<AuthResponse>;
        }
      }

      return {
        success: false,
        error: 'Google sign-in was started but no redirect URL was returned.',
      };
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      return {
        success: false,
        error: error?.message || 'Failed to sign in with Google',
      };
    }
  }

  // Check for redirect result on app load
  async checkRedirectResult(): Promise<ApiResponse<AuthResponse> | null> {
    if (Platform.OS !== 'web') {
      return null;
    }

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        return null;
      }

      const user = data.session.user;
      const role = (await AsyncStorage.getItem('selectedRole')) || 'consumer';
      const authData: AuthResponse = {
        token: data.session.access_token,
        user: {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.full_name || '',
          role: role as 'consumer' | 'merchant' | 'driver',
          phone: user.phone || '',
          isVerified: !!user.email_confirmed_at,
          profileImageUrl: user.user_metadata?.avatar_url || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      await this.storeAuthData(authData);
      return { success: true, data: authData };
    } catch (error: any) {
      console.error('Redirect result error:', error);
      return null;
    }
  }

  // Sign in with Apple
  async signInWithApple(role?: string): Promise<ApiResponse<AuthResponse>> {
    try {
      const redirectTo = Platform.OS === 'web' && typeof window !== 'undefined'
        ? window.location.origin
        : 'brillprime://auth/callback';
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        if (this.maybeRedirectToOAuthUrl('apple', data.url)) {
          return {
            success: false,
            requiresRedirect: true,
            error: 'Redirecting to Apple sign-in...',
          } as ApiResponse<AuthResponse>;
        }
      }

      return {
        success: false,
        error: 'Apple sign-in was started but no redirect URL was returned.',
      };
    } catch (error: any) {
      console.error('Apple sign-in error:', error);
      return {
        success: false,
        error: error?.message || 'Apple sign-in failed',
      };
    }
  }

  // Sign in with Facebook
  async signInWithFacebook(role?: string): Promise<ApiResponse<AuthResponse>> {
    try {
      const redirectTo = Platform.OS === 'web' && typeof window !== 'undefined'
        ? window.location.origin
        : 'brillprime://auth/callback';
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: { redirectTo },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        if (this.maybeRedirectToOAuthUrl('facebook', data.url)) {
          return {
            success: false,
            requiresRedirect: true,
            error: 'Redirecting to Facebook sign-in...',
          } as ApiResponse<AuthResponse>;
        }
      }

      return {
        success: false,
        error: 'Facebook sign-in was started but no redirect URL was returned.',
      };
    } catch (error: any) {
      console.error('Facebook sign-in error:', error);
      return {
        success: false,
        error: error?.message || 'Failed to sign in with Facebook',
      };
    }
  }

  // Verify OTP
  async verifyOTP(data: VerifyOTPRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.VERIFY_OTP, data);

    if (response.success && response.data) {
      // Store user data locally
      await this.storeAuthData(response.data);
    }

    return response;
  }

  // Resend OTP
  async resendOTP(email: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>(API_ENDPOINTS.AUTH.RESEND_OTP, { email });
  }

  // Request password reset (backend endpoint)
  async requestPasswordReset(data: ResetPasswordRequest): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiClient.post<{ message: string }>(API_ENDPOINTS.PASSWORD_RESET.REQUEST, { email: data.email });

      if (response.success) {
        return response;
      }

      // Log error via errorService for user feedback
      const err = new Error(response.error || 'Failed to request password reset');
      try {
        const { errorService } = await import('./errorService');
        errorService.logError(err, { endpoint: API_ENDPOINTS.PASSWORD_RESET.REQUEST, payload: { email: data.email } }, 'medium');
      } catch (_) {
        // fail silently if dynamic import fails
      }

      return {
        success: false,
        error: response.error || 'Failed to request password reset',
      };
    } catch (error: any) {
      console.error('Password reset request error:', error);

      // Log error via errorService for user feedback
      try {
        const { errorService } = await import('./errorService');
        errorService.logError(error instanceof Error ? error : new Error(String(error)), { endpoint: API_ENDPOINTS.PASSWORD_RESET.REQUEST, payload: { email: data.email } }, 'medium');
      } catch (_) {
        // fail silently if dynamic import fails
      }

      return {
        success: false,
        error: error?.message || 'Network error. Please try again later.',
      };
    }
  }

  // Verify reset code
  async verifyResetCode(email: string, code: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>(API_ENDPOINTS.PASSWORD_RESET.VERIFY_CODE, { email, code });
  }

  // Confirm password reset
  async confirmPasswordReset(data: ConfirmPasswordResetRequest): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>(API_ENDPOINTS.PASSWORD_RESET.COMPLETE, data);
  }

  // Get current user
  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const token = await this.getToken();
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }

      // Use the token from local storage to authenticate with the backend API
      const response = await apiClient.get<User>(API_ENDPOINTS.PROFILE.GET, {
        Authorization: `Bearer ${token}`,
      });

      if (response.success && response.data) {
        return response;
      } else {
        return {
          success: false,
          error: response.error || 'Failed to get user data'
        };
      }
    } catch (error: any) {
      console.error('getCurrentUser error:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.warn('Supabase sign-out warning:', error.message);
        }
      } catch (err) {
        console.warn('Supabase sign-out failed; clearing local auth anyway:', err);
      }

      // Clear all local storage
      await this.clearAuthData();

      // Reset current user state
      this.currentUser = null;
      this.authToken = null;
      // Clear ApiClient token cache
      try { apiClient.setAuthToken(''); } catch (_) { }

      // Optional: Call your backend to invalidate the token if needed
      try {
        const token = await this.getToken();
        if (token) {
          await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, {}, {
            Authorization: `Bearer ${token}`,
          });
        }
      } catch (apiError) {
        console.warn('Failed to invalidate token on server:', apiError);
        // Continue with logout even if server logout fails
      }
    } catch (error: any) {
      console.error('Error during API signout:', error);
    } finally {
      // Clear local storage regardless of API call result
      await this.clearAuthData();
    }
  }

  // Helper methods
  private async storeAuthData(authData: AuthResponse): Promise<void> {
    try {
      const normalizedRole = (() => {
        const role = authData.user.role;
        if (!role || typeof role !== 'string') return 'consumer';
        const canonical = role.trim().toLowerCase();
        return canonical === 'merchant' || canonical === 'driver' || canonical === 'consumer'
          ? canonical
          : 'consumer';
      })();
      const tokenExpiry = Date.now() + (24 * 60 * 60 * 1000);

      await AsyncStorage.multiSet([
        [this.TOKEN_KEY, authData.token],
        [this.USER_KEY, JSON.stringify({ ...authData.user, role: normalizedRole })],
        [this.ROLE_KEY, normalizedRole],
        ['selectedRole', normalizedRole],
        ['tokenExpiry', tokenExpiry.toString()],
        ['userEmail', authData.user.email],
      ]);

      apiClient.setAuthToken(authData.token);
    } catch (error: any) {
      console.error('Error storing auth data:', error);
    }
  }

  private async storeUserData(user: User): Promise<void> {
    try {
      const normalizedRole = (() => {
        const role = user.role;
        if (!role || typeof role !== 'string') return 'consumer';
        const canonical = role.trim().toLowerCase();
        return canonical === 'merchant' || canonical === 'driver' || canonical === 'consumer'
          ? canonical
          : 'consumer';
      })();
      const tokenExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours from now

      await AsyncStorage.multiSet([
        [this.USER_KEY, JSON.stringify({ ...user, role: normalizedRole })],
        [this.ROLE_KEY, normalizedRole],
        ['tokenExpiry', tokenExpiry.toString()],
        ['userEmail', user.email],
      ]);
    } catch (error: any) {
      console.error('Error storing user data:', error);
    }
  }

  private async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.TOKEN_KEY,
        this.USER_KEY,
        this.ROLE_KEY,
        'tokenExpiry',
        'selectedRole',
        'pendingUserData',
        'tempUserEmail',
        'tempUserRole',
        'isOfflineMode', // Also clear offline mode flag
        'userEmail' // Clear stored email as well
      ]);
    } catch (error: any) {
      console.error('Error clearing auth data:', error);
    }
  }

  async getToken(): Promise<string | null> {
    try {
      const { data } = await supabase.auth.getSession();
      const sessionToken = data.session?.access_token;

      if (sessionToken && this.isValidTokenFormat(sessionToken)) {
        this.authToken = sessionToken;
        await AsyncStorage.setItem(this.TOKEN_KEY, sessionToken);
        const newExpiry = Date.now() + (55 * 60 * 1000);
        await AsyncStorage.setItem('tokenExpiry', newExpiry.toString());
        return sessionToken;
      }

      const storedToken = await AsyncStorage.getItem(this.TOKEN_KEY);
      if (storedToken && this.isValidTokenFormat(storedToken)) {
        return storedToken;
      }

      if (storedToken) {
        console.warn('Clearing invalid or stale auth token from local storage.');
        await AsyncStorage.multiRemove([this.TOKEN_KEY, 'tokenExpiry', 'userEmail', this.ROLE_KEY]);
      }

      return null;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  async getStoredUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting stored user:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    if (!token) return false;

    const expiry = await AsyncStorage.getItem('tokenExpiry');
    if (!expiry || Date.now() > parseInt(expiry)) {
      await this.clearAuthData();
      return false;
    }

    const { data } = await supabase.auth.getSession();
    return !!data.session;
  }

  // Check if token needs refresh (expires in next hour)
  async needsTokenRefresh(): Promise<boolean> {
    const expiry = await AsyncStorage.getItem('tokenExpiry');
    if (!expiry) return true;

    const expiryTime = parseInt(expiry);
    const oneHourFromNow = Date.now() + (60 * 60 * 1000);

    return expiryTime < oneHourFromNow;
  }

  // Refresh token if needed
  async refreshTokenIfNeeded(): Promise<boolean> {
    try {
      if (!(await this.needsTokenRefresh())) {
        return true; // Token is still valid
      }

      // Attempt to refresh token using getCurrentUser (which handles network errors)
      const response = await this.getCurrentUser();
      if (response.success && response.data) {
        // Token is still valid on server, just update expiry
        const tokenExpiry = Date.now() + (24 * 60 * 60 * 1000);
        await AsyncStorage.setItem('tokenExpiry', tokenExpiry.toString());
        return true;
      } else {
        // Token is invalid or refresh failed, clear auth data
        await this.clearAuthData();
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      if (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as any).message === 'string' &&
        ((error as any).message.includes('network') || (error as any).message.includes('fetch'))
      ) {
        console.log('Network error during token refresh attempt, keeping tokens for potential offline use.');
        return false;
      }
      console.error('Non-network error during token refresh, clearing auth data.');
      await this.clearAuthData();
      return false;
    }
  }

  // Validate token format and structure
  private isValidTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') return false;

    const parts = token.split('.');
    if (parts.length !== 3) return false;

    try {
      const payload = parts[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      const binary = typeof atob === 'function'
        ? atob(padded)
        : Buffer.from(padded, 'base64').toString('binary');
      const decoded = decodeURIComponent(
        Array.from(binary).map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join('')
      );
      const claims = JSON.parse(decoded);
      const issuer = String(claims.iss || '').toLowerCase();
      const audience = String(claims.aud || '').toLowerCase();
      const isSupabaseIssuer = issuer.includes('supabase.co');
      const isSupabaseAudience = ['authenticated', 'authenticated-user'].includes(audience);
      return isSupabaseIssuer || isSupabaseAudience;
    } catch {
      return false;
    }
  }

  // Enhanced authentication check with better error handling
  async isAuthenticatedWithValidation(): Promise<{ isAuthenticated: boolean; shouldRefresh: boolean; error?: string }> {
    try {
      const token = await this.getToken();
      if (!token) {
        return { isAuthenticated: false, shouldRefresh: false, error: 'No token found' };
      }

      if (!this.isValidTokenFormat(token)) {
        await this.clearAuthData();
        return { isAuthenticated: false, shouldRefresh: false, error: 'Invalid token format' };
      }

      // Check token expiry
      const expiry = await AsyncStorage.getItem('tokenExpiry');
      if (!expiry || Date.now() > parseInt(expiry)) {
        // Token expired, try to refresh
        const refreshed = await this.refreshTokenIfNeeded();
        return {
          isAuthenticated: refreshed,
          shouldRefresh: false,
          error: refreshed ? undefined : 'Token expired and refresh failed'
        };
      }

      // Check if token needs refresh soon
      const needsRefresh = await this.needsTokenRefresh();

      return {
        isAuthenticated: true,
        shouldRefresh: needsRefresh
      };
    } catch (error) {
      console.error('Authentication validation error:', error);
      // If any error occurs during validation, assume not authenticated.
      // The specific error might be from AsyncStorage or other operations.
      return {
        isAuthenticated: false,
        shouldRefresh: false,
        error: 'Authentication validation failed due to an error'
      };
    }
  }
}

export const authService = new AuthService();
