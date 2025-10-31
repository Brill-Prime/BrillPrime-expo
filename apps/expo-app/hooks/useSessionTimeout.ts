
import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useRouter } from 'expo-router';
import { authService } from '../services/authService';
import { biometricService } from '../services/biometricService';
import { useAlert } from '../components/AlertProvider';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before timeout

export const useSessionTimeout = () => {
  const router = useRouter();
  const { showConfirmDialog } = useAlert();
  const lastActivityRef = useRef(Date.now());
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const warningIdRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimers = useCallback(() => {
    lastActivityRef.current = Date.now();

    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    if (warningIdRef.current) clearTimeout(warningIdRef.current);

    // Set warning timer
    warningIdRef.current = setTimeout(async () => {
      const biometricEnabled = await biometricService.isBiometricEnabled();
      const biometricAvailable = await biometricService.isBiometricAvailable();

      if (biometricEnabled && biometricAvailable) {
        const authenticated = await biometricService.authenticate('Verify to continue your session');
        if (authenticated) {
          resetTimers();
        } else {
          handleSessionExpiry();
        }
      } else {
        showConfirmDialog(
          'Session Expiring',
          'Your session will expire in 5 minutes due to inactivity. Continue?',
          () => {
            resetTimers();
          },
          () => {
            handleSessionExpiry();
          }
        );
      }
    }, SESSION_TIMEOUT - WARNING_TIME);

    // Set timeout timer
    timeoutIdRef.current = setTimeout(() => {
      handleSessionExpiry();
    }, SESSION_TIMEOUT);
  }, [showConfirmDialog]);

  const handleSessionExpiry = useCallback(async () => {
    await authService.signOut();
    router.replace('/auth/signin');
  }, [router]);

  const handleAppStateChange = useCallback(async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      // Check if token needs refresh
      const needsRefresh = await authService.needsTokenRefresh();
      if (needsRefresh) {
        await authService.refreshTokenIfNeeded();
      }
      resetTimers();
    }
  }, [resetTimers]);

  useEffect(() => {
    resetTimers();

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      if (warningIdRef.current) clearTimeout(warningIdRef.current);
    };
  }, [handleAppStateChange, resetTimers]);

  return { resetTimers };
};
