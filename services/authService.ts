// Authentication Service
// Handles user authentication, session management, and user state

import { apiClient, ApiResponse } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import type { Auth } from 'firebase/auth';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  FacebookAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  User, 
  AuthResponse, 
  SignUpRequest, 
  SignInRequest,
  VerifyOTPRequest,
  ResetPasswordRequest,
  ConfirmPasswordResetRequest
} from './types';

class AuthService {
  private readonly TOKEN_KEY = 'userToken';
  private readonly USER_KEY = 'userData';
  private readonly ROLE_KEY = 'userRole';
  private currentUser: any = null;
  private authToken: string | null = null;

  constructor() {
    // Listen to Firebase auth state changes
  onAuthStateChanged(auth as Auth, (user: FirebaseUser | null) => {
      if (user) {
        this.currentUser = user;
        user.getIdToken().then(token => {
          this.authToken = token;
        });
      } else {
        this.currentUser = null;
        this.authToken = null;
      }
    });
  }

  // Sign up new user
  async signUp(data: SignUpRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      // First, try to sign up using Firebase
      const firebaseUserCredential = await createUserWithEmailAndPassword(auth as Auth, data.email, data.password);
      const firebaseUser = firebaseUserCredential.user;

      // Register the user with your backend API
      const response = await apiClient.post<AuthResponse>('/api/auth/signup', {
        ...data,
        firebaseUid: firebaseUser.uid
      });

      if (response.success && response.data) {
        await this.storeAuthData(response.data);
      }

      return response;
    } catch (error: any) {
      console.error('SignUp error:', error);

      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            return { success: false, error: 'That email address is already in use!' };
          case 'auth/invalid-email':
            return { success: false, error: 'That email address is invalid!' };
          case 'auth/weak-password':
            return { success: false, error: 'Password should be at least 6 characters long.' };
          default:
            return { success: false, error: `Firebase authentication error: ${error.message}` };
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  // Sign in user
  async signIn(data: SignInRequest & { role?: string }): Promise<ApiResponse<AuthResponse>> {
    try {
      // First, try to sign in with Firebase
      const firebaseUserCredential = await signInWithEmailAndPassword(auth as Auth, data.email, data.password);
      const firebaseUser = firebaseUserCredential.user;

      // Authenticate with your backend using the Firebase UID
      const response = await apiClient.post<AuthResponse>('/api/auth/signin', {
        email: data.email,
        firebaseUid: firebaseUser.uid
      });

      if (response.success && response.data) {
        if (data.role && response.data.user.role !== data.role) {
          return {
            success: false,
            error: `Account role mismatch. Expected ${data.role} but account is ${response.data.user.role}`
          };
        }
        await this.storeAuthData(response.data);
      }

      return response;
    } catch (error: any) {
      console.error('SignIn error:', error);

      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
            return { success: false, error: 'No user found with that email.' };
          case 'auth/wrong-password':
            return { success: false, error: 'Incorrect password provided.' };
          default:
            return { success: false, error: `Firebase authentication error: ${error.message}` };
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  // Social Authentication - Google
  async signInWithGoogle(role: string): Promise<ApiResponse<AuthResponse>> {
    try {
      console.log('🔵 Starting Google sign-in with role:', role);
      
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth as Auth, provider);
      const firebaseUser = result.user;

      console.log('✅ Firebase Google sign-in successful:', {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName
      });

      // Send Firebase UID and user data to backend
      const requestData = {
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        provider: 'google',
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        role: role
      };
      
      console.log('📤 Sending social login request to backend:', requestData);
      
      const response = await apiClient.post<AuthResponse>('/api/auth/social-login', requestData);

      console.log('📥 Backend response:', response);

      if (response.success && response.data) {
        // Validate role if provided
        if (role && response.data.user.role !== role) {
          return {
            success: false,
            error: `Account role mismatch. Expected ${role} but account is ${response.data.user.role}`
          };
        }

        await this.storeAuthData(response.data);
      }

      return response;
  } catch (error: any) {
      console.error('❌ Google sign-in error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        response: error.response,
        stack: error.stack
      });
      
      if (error.code === 'auth/popup-closed-by-user') {
        return { success: false, error: 'Sign-in cancelled' };
      }
      
      return {
        success: false,
        error: error.message || 'Google sign-in failed'
      };
    }
  }

  // Social Authentication - Apple
  async signInWithApple(role: string): Promise<ApiResponse<AuthResponse>> {
    try {
      const provider = new OAuthProvider('apple.com');
  const result = await signInWithPopup(auth as Auth, provider);
      const firebaseUser = result.user;

      // Send Firebase UID and user data to backend
      const response = await apiClient.post<AuthResponse>('/api/auth/social-login', {
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        provider: 'apple',
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        role: role
      });

      if (response.success && response.data) {
        // Validate role if provided
        if (role && response.data.user.role !== role) {
          return {
            success: false,
            error: `Account role mismatch. Expected ${role} but account is ${response.data.user.role}`
          };
        }

        await this.storeAuthData(response.data);
      }

      return response;
  } catch (error: any) {
      console.error('Apple sign-in error:', error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        return { success: false, error: 'Sign-in cancelled' };
      }
      
      return {
        success: false,
        error: error.message || 'Apple sign-in failed'
      };
    }
  }

  // Social Authentication - Facebook
  async signInWithFacebook(role: string): Promise<ApiResponse<AuthResponse>> {
    try {
      const provider = new FacebookAuthProvider();
  const result = await signInWithPopup(auth as Auth, provider);
      const firebaseUser = result.user;

      // Send Firebase UID and user data to backend
      const response = await apiClient.post<AuthResponse>('/api/auth/social-login', {
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        provider: 'facebook',
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        role: role
      });

      if (response.success && response.data) {
        // Validate role if provided
        if (role && response.data.user.role !== role) {
          return {
            success: false,
            error: `Account role mismatch. Expected ${role} but account is ${response.data.user.role}`
          };
        }

        await this.storeAuthData(response.data);
      }

      return response;
  } catch (error: any) {
      console.error('Facebook sign-in error:', error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        return { success: false, error: 'Sign-in cancelled' };
      }
      
      return {
        success: false,
        error: error.message || 'Facebook sign-in failed'
      };
    }
  }

  // Verify OTP
  async verifyOTP(data: VerifyOTPRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<AuthResponse>('/api/auth/verify-otp', data);

    if (response.success && response.data) {
      // Store user data locally
      await this.storeAuthData(response.data);
    }

    return response;
  }

  // Resend OTP
  async resendOTP(email: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/api/auth/resend-otp', { email });
  }

  // Request password reset
  async requestPasswordReset(data: ResetPasswordRequest): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/api/password-reset/request', data);
  }

  // Verify reset code
  async verifyResetCode(email: string, code: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/api/password-reset/verify-code', { email, code });
  }

  // Confirm password reset
  async confirmPasswordReset(data: ConfirmPasswordResetRequest): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/api/password-reset/complete', data);
  }

  // Get current user
  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const token = await this.getToken();
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }

      // Use the token from local storage to authenticate with the backend API
      const response = await apiClient.get<User>('/api/auth/profile', {
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
      // Call API to invalidate token
      const token = await this.getToken();
      if (token) {
        await apiClient.post('/api/jwt-tokens/logout', {}, {
          Authorization: `Bearer ${token}`,
        });
      }
      // Sign out from Firebase as well
  await signOut(auth as Auth);
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
      const tokenExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours from now

      await AsyncStorage.multiSet([
        [this.TOKEN_KEY, authData.token],
        [this.USER_KEY, JSON.stringify(authData.user)],
        [this.ROLE_KEY, authData.user.role],
        ['tokenExpiry', tokenExpiry.toString()],
        ['selectedRole', authData.user.role], // Update selected role to match actual user role
        ['userEmail', authData.user.email], // Store email for offline use
        // We don't store firebaseUid here as it's implicitly handled by Firebase auth state
      ]);
  } catch (error: any) {
      console.error('Error storing auth data:', error);
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
      // Prefer token from Firebase if available and valid, otherwise use stored token
      if (this.authToken) {
        return this.authToken;
      }
      return await AsyncStorage.getItem(this.TOKEN_KEY);
  } catch (error: any) {
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

    // Check token expiry
    const expiry = await AsyncStorage.getItem('tokenExpiry');
    if (!expiry || Date.now() > parseInt(expiry)) {
      await this.clearAuthData();
      return false;
    }

    // Additionally, check if Firebase user is authenticated
    return !!this.currentUser;
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

    // Basic JWT format check (header.payload.signature)
    const parts = token.split('.');
    return parts.length === 3;
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