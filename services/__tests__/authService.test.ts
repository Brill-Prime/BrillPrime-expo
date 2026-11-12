jest.mock('../api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    callFunctionPost: jest.fn(),
    setAuthToken: jest.fn(),
  },
}));

jest.mock('../../config/firebase', () => ({
  auth: { currentUser: null },
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(() => jest.fn()),
  signOut: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  multiRemove: jest.fn().mockResolvedValue(undefined),
  multiSet: jest.fn().mockResolvedValue(undefined),
  getItem: jest.fn().mockResolvedValue(null),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { apiClient } from '../api';
import { authService } from '../authService';
import { API_ENDPOINTS } from '../apiEndpoints';

describe('AuthService session and profile behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (firebaseSignOut as jest.Mock).mockResolvedValue(undefined);
  });

  it('resolves an existing profile through the profile function, not user-sync GET', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: 'database-user-id', role: 'merchant' },
    });

    const firebaseUser = {
      uid: 'firebase-user-id',
      displayName: 'Merchant User',
      phoneNumber: null,
      getIdToken: jest.fn().mockResolvedValue('firebase-id-token'),
    };

    await expect(authService.ensureUserProfile(firebaseUser as never, 'consumer')).resolves.toBe('merchant');

    expect(apiClient.get).toHaveBeenCalledWith(API_ENDPOINTS.PROFILE.GET);
    expect(apiClient.callFunctionPost).not.toHaveBeenCalled();
  });

  it('creates a missing profile through user-sync POST', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ success: false, error: 'Profile not found' });
    (apiClient.callFunctionPost as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: 'database-user-id' },
    });
    const firebaseUser = {
      uid: 'firebase-user-id',
      displayName: 'Merchant User',
      phoneNumber: null,
      getIdToken: jest.fn().mockResolvedValue('firebase-id-token'),
    };

    await expect(authService.ensureUserProfile(firebaseUser as never, 'merchant')).resolves.toBe('merchant');

    expect(apiClient.get).toHaveBeenCalledWith(API_ENDPOINTS.PROFILE.GET);
    expect(apiClient.callFunctionPost).toHaveBeenCalledWith('user-sync', {
      role: 'merchant',
      fullName: 'Merchant User',
      phoneNumber: '',
    }, expect.any(Object));
  });

  it('completes local Firebase sign-out without calling a backend logout endpoint', async () => {
    await authService.signOut();

    expect(firebaseSignOut).toHaveBeenCalledTimes(1);
    expect(apiClient.setAuthToken).toHaveBeenCalledWith('');
    expect(AsyncStorage.multiRemove).toHaveBeenCalledTimes(1);
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('surfaces Firebase sign-out failures instead of reporting a false logout', async () => {
    (firebaseSignOut as jest.Mock).mockRejectedValueOnce(new Error('Firebase sign-out failed'));

    await expect(authService.signOut()).rejects.toThrow('Firebase sign-out failed');
    expect(AsyncStorage.multiRemove).not.toHaveBeenCalled();
  });
});
