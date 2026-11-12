// Authentication Service
// Handles user authentication, session management, and user state

import { apiClient } from './api';
import { API_ENDPOINTS } from './apiEndpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
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
      const normalizedUser: User = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: displayName,
        firstName: firstName || displayName.split(' ')[0] || '',
        lastName: lastName || displayName.split(' ').slice(1).join(' ') || '',
        role: role,
        phone: phoneNumber || '',
        isVerified: firebaseUser.emailVerified,
        profileImageUrl: firebaseUser.photoURL || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const authData: AuthResponse = {
        token: firebaseToken,
        user: normalizedUser,
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
        '/functions/v1/user-sync',
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
      const normalizedUser = await this.normalizeUserFromFirebase(firebaseUser, userRole);
      const authData: AuthResponse = {
        token: firebaseToken,
        user: normalizedUser,
      };

      await this.storeAuthData(authData);

      // Initialize role status for the user
      // await roleManagementService.initializeRoleStatus(userRole);

      // Fetch user data from Supabase asynchronously (non-blocking)
      apiClient.get<any>(
        '/functions/v1/user-sync',
        {
          Authorization: `Bearer ${firebaseToken}`,
        }
      ).then(userDataResponse => {
        // Update role if Supabase returns different role
        if (userDataResponse.success && userDataResponse.data) {
          const supabaseUser = userDataResponse.data;
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
    if (Platform.OS !== 'web' || typeof signInWithPopup !== 'function') {
      return {
        success: false,
        error: 'Google sign-in via web popup is not available on mobile devices. Please sign in with email/password.',
      };
    }

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
        '/functions/v1/user-sync',
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

      const userRole = await this.resolveUserRole(user, role);
      const normalizedUser = await this.normalizeUserFromFirebase(user, userRole);
      const authData: AuthResponse = {
        token: firebaseToken,
        user: normalizedUser,
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
      if (Platform.OS !== 'web' || typeof getRedirectResult !== 'function') {
        return null;
      }
      const result = await getRedirectResult(auth);
      if (!result) return null;

      const user = result.user;
      if (!user.email) {
        throw new Error('No email associated with account');
      }

      const selectedRole = await AsyncStorage.getItem('selectedRole');
      const role = await this.resolveUserRole(user, selectedRole);
      const normalizedUser = await this.normalizeUserFromFirebase(user, role);
      const authData: AuthResponse = {
        token: await user.getIdToken(),
        user: normalizedUser,
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
    if (Platform.OS !== 'web' || typeof signInWithPopup !== 'function') {
      return {
        success: false,
        error: 'Apple sign-in via web popup is not available on mobile devices. Please sign in with email/password.',
      };
    }

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
        '/functions/v1/user-sync',
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
    if (Platform.OS !== 'web' || typeof signInWithPopup !== 'function') {
      return {
        success: false,
        error: 'Facebook sign-in via web popup is not available on mobile devices. Please sign in with email/password.',
      };
    }

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
        '/functions/v1/user-sync',
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
      const normalizedUser = await this.normalizeUserFromFirebase(user, userRole);
      const authData: AuthResponse = {
        token: firebaseToken,
        user: normalizedUser,
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

      const normalizedUser = await this.normalizeUserFromFirebase(firebaseUser, role, {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || '',
        role,
        phone: firebaseUser.phoneNumber || pendingUser?.phone || '',
        isVerified: true,
        profileImageUrl: firebaseUser.photoURL || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const authData: AuthResponse = {
        token: await firebaseUser.getIdToken(),
        user: normalizedUser,
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
    if (auth) {
      await firebaseSignOut(auth);
    }

    this.currentUser = null;
    this.authToken = null;
    apiClient.setAuthToken('');
    await this.clearAuthData();
  }

  // Helper methods
  private isUserRole(role: unknown): role is User['role'] {
    return role === 'consumer' || role === 'merchant' || role === 'driver';
  }

  async ensureUserProfile(firebaseUser: FirebaseUser, requestedRole?: string | null): Promise<User['role']> {
    return this.resolveUserRole(firebaseUser, requestedRole);
  }

  private async resolveUserRole(firebaseUser: FirebaseUser, requestedRole?: string | null): Promise<User['role']> {
    const response = await apiClient.get<{ id: string; role: string }>(API_ENDPOINTS.PROFILE.GET);
    const profile = response.success ? response.data : undefined;
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
    const token = await firebaseUser.getIdToken();
    const response = await apiClient.callFunctionPost<{ id: string }>('user-sync', {
      role,
      fullName: extra.full_name,
      phoneNumber: extra.phone_number,
    }, {
      Authorization: `Bearer ${token}`,
    });
    if (!response.success) {
      throw new Error(response.error || 'Unable to sync your profile.');
    }
    if (!response.data?.id) {
      throw new Error('Profile sync did not return a database user ID.');
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
      const userWithIds: User = {
        ...authData.user,
        uid: authData.user.uid || authData.user.firebaseUid || authData.user.id,
        firebaseUid: authData.user.firebaseUid || authData.user.uid || authData.user.id,
        merchantId: authData.user.merchantId,
      };

      await AsyncStorage.multiSet([
        [this.TOKEN_KEY, authData.token],
        [this.USER_KEY, JSON.stringify(userWithIds)],
        [this.ROLE_KEY, authData.user.role],
        ['tokenExpiry', tokenExpiry.toString()],
        ['selectedRole', authData.user.role],
        ['userEmail', authData.user.email],
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

  async normalizeUserFromFirebase(firebaseUser: FirebaseUser, requestedRole?: string | null, storedProfile?: Partial<User>): Promise<User> {
    const backendProfile = await this.getUserProfileByFirebaseUid(firebaseUser.uid);
    const storedProfileUid = storedProfile?.firebaseUid || storedProfile?.uid || storedProfile?.id;
    const matchingStoredProfile = storedProfileUid === firebaseUser.uid ? storedProfile : undefined;
    const profile = backendProfile || matchingStoredProfile;
    const backendRole = this.isUserRole(profile?.role) ? profile.role : undefined;
    const resolvedRole = backendRole || (this.isUserRole(requestedRole) ? requestedRole : 'consumer');
    const backendId = backendProfile?.id ||
      (matchingStoredProfile?.id && matchingStoredProfile.id !== firebaseUser.uid ? matchingStoredProfile.id : undefined);
    const merchantId = typeof profile?.merchantId === 'string' ? profile.merchantId : await this.resolveMerchantIdFromSupabase(firebaseUser.uid || backendId || undefined);

    return {
      id: backendId || firebaseUser.uid,
      uid: firebaseUser.uid,
      firebaseUid: firebaseUser.uid,
      email: firebaseUser.email || profile?.email || '',
      firstName: profile?.firstName || firebaseUser.displayName?.split(' ')[0] || undefined,
      lastName: profile?.lastName || firebaseUser.displayName?.split(' ').slice(1).join(' ') || undefined,
      name: profile?.name || firebaseUser.displayName || '',
      phone: firebaseUser.phoneNumber || profile?.phone || '',
      role: resolvedRole,
      isVerified: firebaseUser.emailVerified || Boolean(profile?.isVerified),
      profileImageUrl: firebaseUser.photoURL || profile?.profileImageUrl || undefined,
      createdAt: profile?.createdAt || new Date().toISOString(),
      updatedAt: profile?.updatedAt || new Date().toISOString(),
      merchantId: merchantId || profile?.merchantId || undefined,
      driverId: profile?.driverId,
    };
  }

  async getUserProfileByFirebaseUid(firebaseUid: string): Promise<Partial<User> | null> {
    try {
      const { supabase } = await import('../config/supabase');
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('firebase_uid', firebaseUid)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        name: data.full_name,
        firstName: data.first_name,
        lastName: data.last_name,
        phone: data.phone_number,
        role: data.role,
        isVerified: data.is_verified,
        merchantId: data.merchant_id,
        driverId: data.driver_id,
        createdAt: data.created_at || new Date().toISOString(),
        updatedAt: data.updated_at || new Date().toISOString(),
      };
    } catch (error) {
      console.warn('Unable to resolve user profile from Supabase:', error);
      return null;
    }
  }

  async resolveMerchantIdFromSupabase(firebaseUidOrUserId?: string | null): Promise<string | null> {
    if (!firebaseUidOrUserId) {
      return null;
    }

    try {
      const { supabase } = await import('../config/supabase');
      const { data: userRow, error: userError } = await supabase
        .from('users')
        .select('id, firebase_uid, merchant_id')
        .or(`firebase_uid.eq.${firebaseUidOrUserId},id.eq.${firebaseUidOrUserId}`)
        .maybeSingle();

      if (userError || !userRow) {
        return null;
      }

      if (userRow.merchant_id) {
        return userRow.merchant_id;
      }

      const { data: merchantRow, error: merchantError } = await supabase
        .from('merchants')
        .select('id')
        .eq('user_id', userRow.id)
        .maybeSingle();

      if (merchantError || !merchantRow?.id) {
        return null;
      }

      return merchantRow.id;
    } catch (error) {
      console.warn('Could not resolve merchant ID from Supabase:', error);
      return null;
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
      if (!userData) {
        return null;
      }

      const parsed = JSON.parse(userData) as Partial<User> | null;
      if (!parsed) {
        return null;
      }

      const normalized: User = {
        id: parsed.id || parsed.firebaseUid || parsed.uid || '',
        uid: parsed.uid || parsed.firebaseUid || parsed.id || '',
        firebaseUid: parsed.firebaseUid || parsed.uid || parsed.id || '',
        email: parsed.email || '',
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        name: parsed.name || [parsed.firstName, parsed.lastName].filter(Boolean).join(' ') || '',
        phone: parsed.phone,
        profileImageUrl: parsed.profileImageUrl,
        role: this.isUserRole(parsed.role) ? parsed.role : 'consumer',
        isVerified: parsed.isVerified,
        createdAt: parsed.createdAt || new Date().toISOString(),
        updatedAt: parsed.updatedAt || new Date().toISOString(),
        merchantId: parsed.merchantId,
        driverId: parsed.driverId,
      };

      return normalized;
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
