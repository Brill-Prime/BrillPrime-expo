// Authentication Service
// Handles user authentication, session management, and user state

import { apiClient } from './api';
import { API_ENDPOINTS } from './apiEndpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  reload,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  OAuthProvider,
  FacebookAuthProvider,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  User,
  AuthResponse,
  SignUpRequest,
  SignInRequest,
  ResetPasswordRequest,
  ApiResponse
} from './types';

class AuthService {
  private readonly TOKEN_KEY = 'userToken';
  private readonly USER_KEY = 'userData';
  private readonly ROLE_KEY = 'userRole';
  private currentUser: FirebaseUser | null = null;
  private authToken: string | null = null;

  constructor() {
    // Check if Firebase auth is available
    if (!auth) {
      console.error('Firebase Auth is not initialized. Please check your Firebase configuration.');
      return;
    }

    // Listen to Firebase auth state changes
    onAuthStateChanged(auth, (user: FirebaseUser | null) => {
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
  async signUp({ email, password, firstName, lastName, phoneNumber, role }: SignUpRequest): Promise<ApiResponse<AuthResponse>> {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized');
    }

    try {
      console.log('Starting signup process for:', email);

      // Create user in Firebase
      const firebaseUserCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = firebaseUserCredential.user;
      console.log('Firebase user created:', firebaseUser.uid);

      // Update Firebase profile with display name
      const displayName = `${firstName} ${lastName}`.trim();
      await updateProfile(firebaseUser, { displayName });
      await sendEmailVerification(firebaseUser);

      // Get Firebase ID token
      const firebaseToken = await firebaseUser.getIdToken();

      // Create auth response immediately with Firebase data
      const authData: AuthResponse = {
        token: firebaseToken,
        user: {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: displayName,
          role: role,
          phone: phoneNumber || '',
          isVerified: firebaseUser.emailVerified,
          profileImageUrl: firebaseUser.photoURL || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      await AsyncStorage.multiSet([
        ['pendingUserData', JSON.stringify({
          id: firebaseUser.uid,
          email: firebaseUser.email || email,
          firstName,
          lastName,
          role,
          phone: phoneNumber || '',
        })],
        ['selectedRole', role],
      ]);

      // Sync with Supabase backend asynchronously (non-blocking)
      // This stores additional user data in Supabase
      apiClient.post<AuthResponse>(
        '/rest/v1/users',
        {
          firebase_uid: firebaseUser.uid,
          email: firebaseUser.email,
          role: role,
          phone_number: phoneNumber,
          full_name: displayName,
        },
        {
          Authorization: `Bearer ${firebaseToken}`,
          'Prefer': 'resolution=merge-duplicates',
        }
      ).then(response => {
        console.log('Supabase sync completed:', response);
      }).catch(err => {
        console.log('Supabase sync error (non-critical):', err);
      });

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
  async signInWithEmail({ email, password }: SignInRequest): Promise<ApiResponse<AuthResponse>> {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized');
    }

    try {
      // Sign in with Firebase
      const firebaseUserCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = firebaseUserCredential.user;

      if (!firebaseUser.emailVerified) {
        await sendEmailVerification(firebaseUser);
        return {
          success: false,
          error: 'Please verify your email using the link we sent before signing in.',
        };
      }

      // Get Firebase ID token
      const firebaseToken = await firebaseUser.getIdToken();

      const selectedRole = await AsyncStorage.getItem('selectedRole');
      const userRole = await this.resolveUserRole(firebaseUser, selectedRole);

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
      // await roleManagementService.initializeRoleStatus(userRole);

      // Fetch user data from Supabase asynchronously (non-blocking)
      apiClient.get<any>(
        `/rest/v1/users?firebase_uid=eq.${firebaseUser.uid}&select=*`,
        {
          Authorization: `Bearer ${firebaseToken}`,
        }
      ).then(userDataResponse => {
        // Update role if Supabase returns different role
        if (userDataResponse.success && userDataResponse.data && userDataResponse.data.length > 0) {
          const supabaseUser = userDataResponse.data[0];
          if (supabaseUser.role && supabaseUser.role !== userRole) {
            console.log('Updating role from Supabase:', supabaseUser.role);
            authData.user.role = supabaseUser.role;
            this.storeAuthData(authData);
          }
        }
      }).catch(err => {
        console.log('Supabase user data fetch error (non-critical):', err);
      });

      return {
        success: true,
        data: authData,
      };
    } catch (error: any) {
      console.error('SignIn error:', error);

      let errorMessage = 'An unknown error occurred';
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
            errorMessage = 'No user found with that email.';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Incorrect password provided.';
            break;
          case 'auth/invalid-credential':
            errorMessage = 'Invalid email or password.';
            break;
          default:
            errorMessage = `Firebase authentication error: ${error.message}`;
        }
      } else {
        errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      }

      return {
        success: false,
        error: errorMessage,
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

      // Sync user to Supabase (non-blocking)
      apiClient.post(
        '/rest/v1/users',
        {
          firebase_uid: user.uid,
          email: user.email,
          role: role || 'consumer',
          full_name: user.displayName || '',
          profile_image_url: user.photoURL || null,
        },
        {
          Authorization: `Bearer ${firebaseToken}`,
          'Prefer': 'resolution=merge-duplicates',
        }
      ).catch(err => console.log('Supabase sync error (non-critical):', err));

      // Store auth data with Firebase token
      const userRole = await this.resolveUserRole(user, role);
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
      if (!auth) throw new Error('Firebase Auth is not initialized.');
      const result = await getRedirectResult(auth);
      if (!result) return null;

      const user = result.user;
      if (!user.email) {
        throw new Error('No email associated with account');
      }

      const selectedRole = await AsyncStorage.getItem('selectedRole');
      const role = await this.resolveUserRole(user, selectedRole);
      const authData: AuthResponse = {
        token: await user.getIdToken(),
        user: {
          id: user.uid,
          email: user.email,
          name: user.displayName || '',
          role,
          phone: user.phoneNumber || '',
          isVerified: user.emailVerified,
          profileImageUrl: user.photoURL || undefined,
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
        '/rest/v1/users',
        {
          firebase_uid: user.uid,
          email: user.email,
          role: role || 'consumer',
          full_name: user.displayName || '',
          profile_image_url: user.photoURL || null,
          phone_number: user.phoneNumber || '',
        },
        {
          'Prefer': 'resolution=merge-duplicates',
          Authorization: `Bearer ${firebaseToken}`,
        }
      ).catch(err => console.log('Supabase profile sync error (non-critical):', err));

      const userRole = await this.resolveUserRole(user, role);
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
        '/rest/v1/users',
        {
          firebase_uid: user.uid,
          email: user.email,
          role: role || 'consumer',
          full_name: user.displayName || '',
          profile_image_url: user.photoURL || null,
          phone_number: user.phoneNumber || '',
        },
        {
          'Prefer': 'resolution=merge-duplicates',
          Authorization: `Bearer ${firebaseToken}`,
        }
      ).catch(err => console.log('Supabase profile sync error (non-critical):', err));

      const userRole = await this.resolveUserRole(user, role);
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

  async verifyEmail(): Promise<ApiResponse<AuthResponse>> {
    const firebaseUser = auth?.currentUser;
    if (!firebaseUser) {
      return { success: false, error: 'Your verification session expired. Please sign up again.' };
    }

    try {
      await reload(firebaseUser);
      if (!firebaseUser.emailVerified) {
        return { success: false, error: 'Your email is not verified yet. Open the link in your email, then try again.' };
      }

      const pendingData = await AsyncStorage.getItem('pendingUserData');
      const pendingUser = pendingData ? JSON.parse(pendingData) : null;
      const selectedRole = await AsyncStorage.getItem('selectedRole');
      const role = this.isUserRole(pendingUser?.role)
        ? pendingUser.role
        : this.isUserRole(selectedRole) ? selectedRole : 'consumer';

      await this.syncUserProfile(firebaseUser, role, {
        full_name: `${pendingUser?.firstName || ''} ${pendingUser?.lastName || ''}`.trim() || firebaseUser.displayName || '',
        phone_number: pendingUser?.phone || firebaseUser.phoneNumber || '',
      });

      const authData: AuthResponse = {
        token: await firebaseUser.getIdToken(),
        user: {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || '',
          role,
          phone: firebaseUser.phoneNumber || pendingUser?.phone || '',
          isVerified: true,
          profileImageUrl: firebaseUser.photoURL || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      await this.storeAuthData(authData);
      await AsyncStorage.multiRemove(['pendingUserData', 'tempUserEmail', 'tempUserRole']);
      return { success: true, data: authData };
    } catch (error) {
      return { success: false, error: this.getFirebaseErrorMessage(error, 'Email verification failed. Please try again.') };
    }
  }

  async resendVerificationEmail(): Promise<ApiResponse<{ message: string }>> {
    const firebaseUser = auth?.currentUser;
    if (!firebaseUser) {
      return { success: false, error: 'Your verification session expired. Please sign up again.' };
    }

    try {
      await sendEmailVerification(firebaseUser);
      return { success: true, data: { message: 'Verification link sent.' } };
    } catch (error) {
      return { success: false, error: this.getFirebaseErrorMessage(error, 'Could not resend the verification link.') };
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const firebaseUser = auth?.currentUser;
    if (!firebaseUser?.email) {
      throw new Error('You must be signed in to change your password.');
    }
    const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
    await reauthenticateWithCredential(firebaseUser, credential);
    await updatePassword(firebaseUser, newPassword);
  }

  // Request password reset using Firebase Auth.
  async requestPasswordReset(data: ResetPasswordRequest): Promise<ApiResponse<{ message: string }>> {
    try {
      if (!auth) throw new Error('Firebase Auth is not initialized.');
      await sendPasswordResetEmail(auth, data.email.trim());
      return { success: true, data: { message: 'Password reset link sent.' } };
    } catch (error) {
      return { success: false, error: this.getFirebaseErrorMessage(error, 'Could not send a password reset link.') };
    }
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
      // Sign out from Firebase first
      if (auth) {
        await firebaseSignOut(auth);
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
  private isUserRole(role: unknown): role is User['role'] {
    return role === 'consumer' || role === 'merchant' || role === 'driver';
  }

  private async resolveUserRole(firebaseUser: FirebaseUser, requestedRole?: string | null): Promise<User['role']> {
    const response = await apiClient.get<any[]>(
      `/rest/v1/users?firebase_uid=eq.${encodeURIComponent(firebaseUser.uid)}&select=*`
    );
    const profile = response.success ? response.data?.[0] : undefined;
    const role = this.isUserRole(profile?.role)
      ? profile.role
      : this.isUserRole(requestedRole) ? requestedRole : 'consumer';

    if (!profile) {
      await this.syncUserProfile(firebaseUser, role, {
        full_name: firebaseUser.displayName || '',
        phone_number: firebaseUser.phoneNumber || '',
      });
    }
    return role;
  }

  private async syncUserProfile(
    firebaseUser: FirebaseUser,
    role: User['role'],
    extra: { full_name: string; phone_number: string }
  ): Promise<void> {
    const response = await apiClient.post('/rest/v1/users', {
      firebase_uid: firebaseUser.uid,
      email: firebaseUser.email,
      role,
      ...extra,
    }, {
      Prefer: 'resolution=merge-duplicates',
    });
    if (!response.success) {
      throw new Error(response.error || 'Unable to sync your profile.');
    }
  }

  private getFirebaseErrorMessage(error: unknown, fallback: string): string {
    if (error && typeof error === 'object' && 'code' in error) {
      const code = String(error.code);
      if (code === 'auth/too-many-requests') return 'Too many attempts. Please try again later.';
      if (code === 'auth/user-not-found') return 'No account was found for that email address.';
      if (code === 'auth/invalid-email') return 'Enter a valid email address.';
      if (code === 'auth/requires-recent-login') return 'Please sign in again before changing your password.';
      if ('message' in error && typeof error.message === 'string') return error.message;
    }
    return error instanceof Error ? error.message : fallback;
  }

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

      // Propagate token to ApiClient for centralized acquisition
      apiClient.setAuthToken(authData.token);
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
        'userEmail' // Clear stored email as well
      ]);
    } catch (error: any) {
      console.error('Error clearing auth data:', error);
    }
  }

  async getToken(): Promise<string | null> {
    try {
      const firebaseUser = auth?.currentUser;
      if (!firebaseUser?.emailVerified) return null;
      this.currentUser = firebaseUser;

      // Check if Firebase user is available and get fresh token
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
            console.log('Token refreshed successfully');
          }

          return freshToken;
        } catch (firebaseError) {
          console.warn('Firebase token refresh failed:', firebaseError);
          return null;
        }
      }

      // Fallback to stored token
      const storedToken = await AsyncStorage.getItem(this.TOKEN_KEY);
      if (storedToken && this.isValidTokenFormat(storedToken)) {
        return storedToken;
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
