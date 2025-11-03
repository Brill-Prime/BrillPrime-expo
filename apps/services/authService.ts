// Authentication Service
// Handles user authentication, session management, and user state

import { apiClient } from './api';
import { API_ENDPOINTS } from './apiEndpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import type { Auth } from 'firebase/auth';
import { supabaseService } from './supabaseService';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  applyActionCode,
  verifyPasswordResetCode,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  OAuthProvider,
  FacebookAuthProvider,
  updateProfile,
  sendEmailVerification,
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
  ConfirmPasswordResetRequest,
  ApiResponse
} from './types';
import { roleManagementService } from './roleManagementService';
import * as Haptics from 'expo-haptics';
import { SecurityService } from './securityService';

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
      console.log('Starting signup process for:', data.email);

      // Create user in Firebase (but they won't be able to sign in until email is verified)
      const firebaseUserCredential = await createUserWithEmailAndPassword(auth as Auth, data.email, data.password);
      const firebaseUser = firebaseUserCredential.user;
      console.log('Firebase user created:', firebaseUser.uid);

      // Update Firebase profile with display name
      const displayName = `${data.firstName} ${data.lastName}`.trim();
      await updateProfile(firebaseUser, { displayName });

      // Get Firebase ID token
      const firebaseToken = await firebaseUser.getIdToken();

      // Store pending user data for OTP verification screen
      await AsyncStorage.setItem('pendingUserData', JSON.stringify({
        email: firebaseUser.email,
        role: data.role,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        firebaseUid: firebaseUser.uid,
      }));

      // Request backend to send 6-digit OTP code via email
      const otpResponse = await apiClient.post<{ message: string }>(
        API_ENDPOINTS.AUTH.SEND_OTP,
        {
          email: data.email,
          firebaseUid: firebaseUser.uid,
          name: displayName,
        },
        {
          Authorization: `Bearer ${firebaseToken}`,
        }
      );

      if (!otpResponse.success) {
        console.warn('OTP send failed (non-critical):', otpResponse.error);
        // Continue anyway - we'll still allow them to verify later
      }

      // Create auth response with unverified status
      const authData: AuthResponse = {
        token: firebaseToken,
        user: {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: displayName,
          role: data.role,
          phone: data.phoneNumber || '',
          isVerified: false, // User needs to verify OTP first
          profileImageUrl: firebaseUser.photoURL || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      // Don't store auth data yet - wait for OTP verification

      // Sync with backend and Supabase asynchronously (non-blocking)
      if (supabaseService) {
        Promise.all([
          // Sync with backend API
          apiClient.post<AuthResponse>(
            API_ENDPOINTS.AUTH.REGISTER,
            {
              firebaseUid: firebaseUser.uid,
              role: data.role,
              phoneNumber: data.phoneNumber,
              email: data.email,
              firstName: data.firstName,
              lastName: data.lastName,
            },
            {
              Authorization: `Bearer ${firebaseToken}`,
            }
          ),
          // Sync with Supabase
          supabaseService.syncFirebaseUser({
            firebaseUid: firebaseUser.uid,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phoneNumber,
            role: data.role as 'consumer' | 'merchant' | 'driver'
          })
        ]).then(([backendResponse, supabaseResponse]) => {
          console.log('✅ Backend sync completed:', backendResponse.success ? 'Success' : backendResponse.error);
          console.log('✅ Supabase sync completed:', supabaseResponse.error ? supabaseResponse.error : 'Success');
        }).catch(err => {
          console.log('⚠️ Sync error (non-critical):', err.message || err);
        });
      } else {
        // Only backend sync if Supabase is not available
        apiClient.post<AuthResponse>(
          API_ENDPOINTS.AUTH.REGISTER,
          {
            firebaseUid: firebaseUser.uid,
            role: data.role,
            phoneNumber: data.phoneNumber,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
          },
          {
            Authorization: `Bearer ${firebaseToken}`,
          }
        ).then(response => {
          console.log('✅ Backend sync completed:', response.success ? 'Success' : response.error);
        }).catch(err => {
          console.log('⚠️ Backend sync error (non-critical):', err.message || err);
        });
      }

      return {
        success: true,
        data: authData,
      };
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
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  // Sign in user
  async signIn(data: SignInRequest & { role?: string }): Promise<ApiResponse<AuthResponse>> {
    try {
      // Sign in with Firebase
      const firebaseUserCredential = await signInWithEmailAndPassword(auth as Auth, data.email, data.password);
      const firebaseUser = firebaseUserCredential.user;

      // Get Firebase ID token
      const firebaseToken = await firebaseUser.getIdToken();

      // Use role from local storage or provided role
      const userRole: 'consumer' | 'merchant' | 'driver' = (data.role || 'consumer') as 'consumer' | 'merchant' | 'driver';

      // Create auth response immediately with Firebase data
      const authData: AuthResponse = {
        token: firebaseToken,
        user: {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || '',
          role: userRole,
          phone: firebaseUser.phoneNumber || '',
          isVerified: firebaseUser.emailVerified,
          profileImageUrl: firebaseUser.photoURL || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      await this.storeAuthData(authData);

      // Initialize role status for the user
      await roleManagementService.initializeRoleStatus(userRole);

      // Check if biometric is available but not enabled
      const isBiometricEnabled = await AsyncStorage.getItem('biometricEnabled');
      if (isBiometricEnabled !== 'true') {
        const isAvailable = await SecurityService.isBiometricAvailable();
        if (isAvailable) {
          // Suggest enabling biometric for future logins (non-blocking)
          setTimeout(async () => {
            try {
              await SecurityService.secureBiometricLogin();
              await AsyncStorage.setItem('biometricEnabled', 'true');
              console.log('✅ Biometric authentication enabled for future sign-ins');
            } catch (err) {
              console.log('User declined biometric setup');
            }
          }, 1000);
        }
      }

      // Fetch user data from backend asynchronously (non-blocking)
      apiClient.get<{ user: any }>(
        API_ENDPOINTS.AUTH.LOGIN,
        {
          Authorization: `Bearer ${firebaseToken}`,
        }
      ).then(userDataResponse => {
        // Update role if backend returns different role
        if (userDataResponse.success && userDataResponse.data?.user?.role) {
          const backendRole = userDataResponse.data.user.role;
          if (backendRole !== userRole) {
            console.log('Updating role from backend:', backendRole);
            authData.user.role = backendRole;
            this.storeAuthData(authData);
          }
        }
      }).catch(err => {
        console.log('Backend user data fetch error (non-critical):', err);
      });

      return {
        success: true,
        data: authData,
      };
    } catch (error: any) {
      console.error('SignIn error:', error);

      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
            return { success: false, error: 'No user found with that email.' };
          case 'auth/wrong-password':
            return { success: false, error: 'Incorrect password provided.' };
          case 'auth/invalid-credential':
            return { success: false, error: 'Invalid email or password.' };
          default:
            return { success: false, error: `Firebase authentication error: ${error.message}` };
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  // Sign in with Google
  async signInWithGoogle(role?: string): Promise<ApiResponse<AuthResponse>> {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');

      let result;
      try {
        // Try popup first
        result = await signInWithPopup(auth, provider);
      } catch (popupError: any) {
        console.log('Popup failed, attempting redirect...', popupError);

        // Don't treat cancelled popups as errors that need redirect
        if (popupError.code === 'auth/popup-closed-by-user' ||
            popupError.code === 'auth/cancelled-popup-request') {
          return { success: false, error: 'Sign-in cancelled' };
        }

        // Only redirect for actual popup blocking
        if (popupError.code === 'auth/popup-blocked') {
          await signInWithRedirect(auth, provider);
          // Don't return here - let the redirect happen
          throw new Error('Redirecting to Google sign-in...');
        }

        throw popupError;
      }

      const user = result.user;

      if (!user.email) {
        throw new Error('No email associated with Google account');
      }

      console.log('Google sign-in successful, getting Firebase token');

      // Get Firebase ID token
      const firebaseToken = await user.getIdToken();

      // Notify backend to sync user from Firebase (non-blocking)
      apiClient.post(
        API_ENDPOINTS.AUTH.SOCIAL_LOGIN,
        {
          provider: 'google',
          firebaseUid: user.uid,
          role: role || 'consumer',
        },
        {
          Authorization: `Bearer ${firebaseToken}`,
        }
      ).catch(err => console.log('Backend sync error (non-critical):', err));

      // Store auth data with Firebase token
      const userRole: 'consumer' | 'merchant' | 'driver' = (role || 'consumer') as 'consumer' | 'merchant' | 'driver';
      const authData: AuthResponse = {
        token: firebaseToken,
        user: {
          id: user.uid,
          email: user.email || '',
          name: user.displayName || '',
          role: userRole,
          phone: user.phoneNumber || '',
          isVerified: user.emailVerified,
          profileImageUrl: user.photoURL || undefined,
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
      console.error('Google sign-in error:', error);

      // Handle unauthorized domain error
      if (error.code === 'auth/unauthorized-domain') {
        return {
          success: false,
          error: 'This domain is not authorized for Google Sign-In. Please contact support or add this domain to Firebase authorized domains.'
        };
      }

      // If popup fails, try redirect
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
        console.log('Popup failed, attempting redirect...');
        try {
          const provider = new GoogleAuthProvider();
          await signInWithRedirect(auth, provider);
          return { success: false, requiresRedirect: true };
        } catch (redirectError: any) {
          console.error('Redirect sign-in error:', redirectError);

          // Handle unauthorized domain in redirect
          if (redirectError.code === 'auth/unauthorized-domain') {
            return {
              success: false,
              error: 'This domain is not authorized. Please contact support.'
            };
          }

          return {
            success: false,
            error: redirectError.message || 'Failed to sign in with Google'
          };
        }
      }

      return {
        success: false,
        error: error.message || 'Failed to sign in with Google'
      };
    }
  }

  // Check for redirect result on app load
  async checkRedirectResult(): Promise<ApiResponse<AuthResponse> | null> {
    try {
      const result = await getRedirectResult(auth);
      if (!result) return null;

      const user = result.user;
      if (!user.email) {
        throw new Error('No email associated with account');
      }

      // Determine provider and send to backend
      const providerId = result.providerId || 'google.com';
      let provider = 'google';

      if (providerId.includes('apple')) {
        provider = 'apple';
      } else if (providerId.includes('facebook')) {
        provider = 'facebook';
      }

      const response = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.SOCIAL_LOGIN, {
        provider,
        firebaseUid: user.uid,
        email: user.email,
        fullName: user.displayName || '',
        photoUrl: user.photoURL || '',
      });

      if (response.success && response.data) {
        await this.storeAuthData(response.data);

        // Route based on user role to role-specific home screens
        if (response.data.user.role === "consumer") {
          router.replace("/(consumer)/(tabs)/home");
        } else if (response.data.user.role === "merchant") {
          router.replace("/(merchant)/(tabs)/home");
        } else if (response.data.user.role === "driver") {
          router.replace("/(driver)/(tabs)/home");
        }

        return response;
      }

      throw new Error(response.error || 'Authentication failed');
    } catch (error: any) {
      console.error('Redirect result error:', error);
      return null;
    }
  }

  // Sign in with Apple
  async signInWithApple(role?: string): Promise<ApiResponse<AuthResponse>> {
    try {
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');

      let result;
      try {
        result = await signInWithPopup(auth, provider);
      } catch (popupError: any) {
        console.log('Popup failed, attempting redirect...', popupError);

        // Don't treat cancelled popups as errors that need redirect
        if (popupError.code === 'auth/popup-closed-by-user' ||
            popupError.code === 'auth/cancelled-popup-request') {
          return { success: false, error: 'Sign-in cancelled' };
        }

        // Only redirect for actual popup blocking
        if (popupError.code === 'auth/popup-blocked') {
          await signInWithRedirect(auth, provider);
          // Don't return here - let the redirect happen
          throw new Error('Redirecting to Apple sign-in...');
        }

        throw popupError;
      }

      const user = result.user;

      if (!user.email) {
        throw new Error('No email associated with Apple account');
      }

      // Get Firebase ID token
      const firebaseToken = await user.getIdToken();

      // Notify backend to sync (non-blocking)
      apiClient.post(
        API_ENDPOINTS.AUTH.SOCIAL_LOGIN,
        {
          provider: 'apple',
          firebaseUid: user.uid,
          role: role || 'consumer',
        },
        {
          Authorization: `Bearer ${firebaseToken}`,
        }
      ).catch(err => console.log('Backend sync error (non-critical):', err));

      const userRole: 'consumer' | 'merchant' | 'driver' = (role || 'consumer') as 'consumer' | 'merchant' | 'driver';
      const authData: AuthResponse = {
        token: firebaseToken,
        user: {
          id: user.uid,
          email: user.email || '',
          name: user.displayName || '',
          role: userRole,
          phone: user.phoneNumber || '',
          isVerified: user.emailVerified,
          profileImageUrl: user.photoURL || undefined,
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
      console.error('Apple sign-in error:', error);

      if (error.code === 'auth/operation-not-allowed') {
        return { success: false, error: 'Apple sign-in is not enabled. Please contact support.' };
      }

      return { success: false, error: error.message || 'Apple sign-in failed' };
    }
  }

  // Sign in with Facebook
  async signInWithFacebook(role?: string): Promise<ApiResponse<AuthResponse>> {
    try {
      const provider = new FacebookAuthProvider();
      provider.addScope('email');
      provider.addScope('public_profile');

      let result;
      try {
        result = await signInWithPopup(auth, provider);
      } catch (popupError: any) {
        console.log('Popup failed, attempting redirect...', popupError);

        // Don't treat cancelled popups as errors that need redirect
        if (popupError.code === 'auth/popup-closed-by-user' ||
            popupError.code === 'auth/cancelled-popup-request') {
          return { success: false, error: 'Sign-in cancelled' };
        }

        // Only redirect for actual popup blocking
        if (popupError.code === 'auth/popup-blocked') {
          await signInWithRedirect(auth, provider);
          // Don't return here - let the redirect happen
          throw new Error('Redirecting to Facebook sign-in...');
        }

        throw popupError;
      }

      const user = result.user;

      if (!user.email) {
        throw new Error('No email associated with Facebook account');
      }

      // Get Firebase ID token
      const firebaseToken = await user.getIdToken();

      // Notify backend to sync (non-blocking)
      apiClient.post(
        API_ENDPOINTS.AUTH.SOCIAL_LOGIN,
        {
          provider: 'facebook',
          firebaseUid: user.uid,
          role: role || 'consumer',
        },
        {
          Authorization: `Bearer ${firebaseToken}`,
        }
      ).catch(err => console.log('Backend sync error (non-critical):', err));

      const userRole: 'consumer' | 'merchant' | 'driver' = (role || 'consumer') as 'consumer' | 'merchant' | 'driver';
      const authData: AuthResponse = {
        token: firebaseToken,
        user: {
          id: user.uid,
          email: user.email || '',
          name: user.displayName || '',
          role: userRole,
          phone: user.phoneNumber || '',
          isVerified: user.emailVerified,
          profileImageUrl: user.photoURL || undefined,
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
      console.error('Facebook sign-in error:', error);

      // Handle unauthorized domain error
      if (error.code === 'auth/unauthorized-domain') {
        return {
          success: false,
          error: 'This domain is not authorized for Facebook Sign-In. Please contact support or add this domain to Firebase authorized domains.'
        };
      }

      // If popup fails, try redirect
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
        try {
          const provider = new FacebookAuthProvider();
          await signInWithRedirect(auth, provider);
          return { success: false, requiresRedirect: true };
        } catch (redirectError: any) {
          console.error('Redirect sign-in error:', redirectError);

          // Handle unauthorized domain in redirect
          if (redirectError.code === 'auth/unauthorized-domain') {
            return {
              success: false,
              error: 'This domain is not authorized. Please contact support.'
            };
          }

          return {
            success: false,
            error: redirectError.message || 'Failed to sign in with Facebook'
          };
        }
      }

      return {
        success: false,
        error: error.message || 'Failed to sign in with Facebook'
      };
    }
  }

  // Verify OTP - Validate 6-digit code
  async verifyOTP(data: VerifyOTPRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      console.log('🔍 Starting OTP verification...');
      const pendingUserData = await AsyncStorage.getItem('pendingUserData');

      if (!pendingUserData) {
        console.error('❌ No pending user data found');
        return { success: false, error: 'Session expired. Please sign up again.' };
      }

      const userData = JSON.parse(pendingUserData);
      console.log('✓ Pending user data found for:', userData.email);

      // Verify OTP with backend
      console.log('📡 Sending OTP verification request to backend...');
      const verifyResponse = await apiClient.post<AuthResponse>(
        API_ENDPOINTS.AUTH.VERIFY_OTP,
        {
          email: userData.email,
          otp: data.otp,
          firebaseUid: userData.firebaseUid,
        }
      );

      if (!verifyResponse.success || !verifyResponse.data) {
        console.error('❌ OTP verification failed:', verifyResponse.error);
        return {
          success: false,
          error: verifyResponse.error || 'Invalid or expired OTP code'
        };
      }

      console.log('✅ OTP verified successfully');

      // OTP verified successfully - now mark user as verified in our system
      const authData: AuthResponse = {
        token: verifyResponse.data.token,
        user: {
          ...verifyResponse.data.user,
          role: userData.role,
          isVerified: true,
        },
      };

      console.log('💾 Storing auth data...');
      await this.storeAuthData(authData);
      await AsyncStorage.removeItem('pendingUserData');

      // Initialize role status for the user
      console.log('🎭 Initializing role status...');
      await roleManagementService.initializeRoleStatus(userData.role);

      // Sync with Supabase if available
      if (supabaseService) {
        console.log('🔄 Syncing verified user with Supabase...');
        supabaseService.syncFirebaseUser({
          firebaseUid: userData.firebaseUid,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phoneNumber,
          role: userData.role
        }).catch(err => console.log('⚠️ Supabase sync error (non-critical):', err));
      }

      console.log('✅ OTP verification complete');
      return { success: true, data: authData };
    } catch (error: any) {
      console.error('❌ OTP verification error:', error);
      return {
        success: false,
        error: error.message || 'Failed to verify OTP. Please try again.'
      };
    }
  }

  // Resend OTP - Request new 6-digit code
  async resendOTP(email: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const pendingUserData = await AsyncStorage.getItem('pendingUserData');

      if (!pendingUserData) {
        return {
          success: false,
          error: 'Session expired. Please sign up again.'
        };
      }

      const userData = JSON.parse(pendingUserData);

      // Request backend to send new OTP
      const response = await apiClient.post<{ message: string }>(
        API_ENDPOINTS.AUTH.SEND_OTP,
        {
          email: userData.email,
          firebaseUid: userData.firebaseUid,
          name: `${userData.firstName} ${userData.lastName}`,
        }
      );

      if (response.success) {
        return {
          success: true,
          data: { message: 'New verification code sent successfully' }
        };
      }

      return {
        success: false,
        error: response.error || 'Failed to send verification code'
      };
    } catch (error: any) {
      console.error('Resend OTP error:', error);

      if (error.message?.includes('too many')) {
        return {
          success: false,
          error: 'Too many requests. Please wait a few minutes before trying again.'
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to resend verification code'
      };
    }
  }

  // Request password reset - Send reset link via email
  async requestPasswordReset(data: ResetPasswordRequest): Promise<ApiResponse<{ message: string }>> {
    try {
      // Use Firebase's built-in password reset link
      await sendPasswordResetEmail(auth as Auth, data.email, {
        url: window.location.origin + '/auth/signin',
        handleCodeInApp: false,
      });

      return {
        success: true,
        data: { message: 'Password reset link sent successfully. Please check your email.' },
      };
    } catch (error: any) {
      console.error('Password reset error:', error);

      if (error.code === 'auth/user-not-found') {
        return { success: false, error: 'No account found with this email address.' };
      }

      if (error.code === 'auth/too-many-requests') {
        return { success: false, error: 'Too many requests. Please try again later.' };
      }

      return {
        success: false,
        error: error.message || 'Failed to send password reset link',
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
      // Call API to invalidate token
      const token = await this.getToken();
      if (token) {
        await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, {}, {
          Authorization: `Bearer ${token}`,
        });
      }
      // Sign out from Firebase as well
      await firebaseSignOut(auth as Auth);
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
      // Store token in SecureStore for biometric authentication
      await SecurityService.storeAuthToken(authData.token);
    } catch (error: any) {
      console.error('Error storing auth data:', error);
    }
  }

  private async storeUserData(user: User): Promise<void> {
    try {
      const tokenExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours from now

      await AsyncStorage.multiSet([
        [this.USER_KEY, JSON.stringify(user)],
        [this.ROLE_KEY, user.role],
        ['tokenExpiry', tokenExpiry.toString()],
        ['selectedRole', user.role],
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
        'userEmail', // Clear stored email as well
        'biometricEnabled' // Clear biometric enabled flag
      ]);
      // Clear token from SecureStore as well
      await SecurityService.clearAuthToken();
    } catch (error: any) {
      console.error('Error clearing auth data:', error);
    }
  }

  async getToken(): Promise<string | null> {
    try {
      // First, try to get token from SecureStore for biometric authentication
      const secureToken = await SecurityService.getAuthToken();
      if (secureToken) {
        // Optionally, validate this token with backend or check expiry if possible
        // For now, assuming it's valid if present
        this.authToken = secureToken;
        return secureToken;
      }

      // Fallback to AsyncStorage if SecureStore is empty or not used
      if (this.currentUser) {
        try {
          // Check if token needs refresh
          const expiry = await AsyncStorage.getItem('tokenExpiry');
          const needsRefresh = !expiry || Date.now() > (parseInt(expiry) - 5 * 60 * 1000); // 5 min buffer

          // Force refresh if token is expiring soon
          const freshToken = await this.currentUser.getIdToken(needsRefresh);
          this.authToken = freshToken;

          // Update stored token and expiry
          if (needsRefresh) {
            await AsyncStorage.setItem(this.TOKEN_KEY, freshToken);
            const newExpiry = Date.now() + (55 * 60 * 1000); // 55 minutes
            await AsyncStorage.setItem('tokenExpiry', newExpiry.toString());
            await SecurityService.storeAuthToken(freshToken); // Update in SecureStore too

            // Sync refreshed token with Supabase
            const { setSupabaseAuthToken } = await import('../config/supabase');
            await setSupabaseAuthToken(freshToken);

            console.log('Token refreshed successfully and synced with Supabase');
          }

          return freshToken;
        } catch (firebaseError) {
          console.warn('Firebase token refresh failed, using stored token');
        }
      }

      // Fallback to AsyncStorage stored token
      const storedToken = await AsyncStorage.getItem(this.TOKEN_KEY);
      if (storedToken && this.isValidTokenFormat(storedToken)) {
        return storedToken;
      }

      return null;
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
        await SecurityService.storeAuthToken(response.data.token); // Update SecureStore
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

  // Biometric authentication methods
  static async enableBiometricAuth(): Promise<boolean> {
    try {
      const isAvailable = await SecurityService.isBiometricAvailable();
      if (!isAvailable) {
        throw new Error('Biometric authentication is not available on this device');
      }

      const result = await SecurityService.secureBiometricLogin();
      if (result) {
        await AsyncStorage.setItem('biometricEnabled', 'true');
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      return result;
    } catch (error) {
      console.error('Error enabling biometric auth:', error);
      return false;
    }
  }

  static async loginWithBiometrics(): Promise<boolean> {
    try {
      const isBiometricEnabled = await AsyncStorage.getItem('biometricEnabled');
      if (isBiometricEnabled !== 'true') {
        return false;
      }

      const result = await SecurityService.secureBiometricLogin();
      if (result) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      return result;
    } catch (error) {
      console.error('Error with biometric login:', error);
      return false;
    }
  }
}

export const authService = new AuthService();