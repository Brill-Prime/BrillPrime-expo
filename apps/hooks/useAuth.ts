
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { PerformanceOptimizer } from '../utils/performance';
import { authService } from '../services/authService';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  token: string | null;
  role: string | null;
}

export const useAuth = () => {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    token: null,
    role: null
  });

  // Check authentication with caching
  const checkAuth = useCallback(async () => {
    try {
      // Try to get from cache first
      const cachedToken = PerformanceOptimizer.getCache('userToken');
      const cachedRole = PerformanceOptimizer.getCache('userRole');
      
      if (cachedToken && cachedRole) {
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user: null,
          token: cachedToken,
          role: cachedRole
        });
        return;
      }

      // Fallback to AsyncStorage
      const authData = await PerformanceOptimizer.preloadCriticalData();
      const { userToken, userRole, tokenExpiry } = authData;

      // Check token validity
      if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
        await authService.signOut();
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          token: null,
          role: null
        });
        return;
      }

      if (userToken && userRole) {
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user: null,
          token: userToken,
          role: userRole
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          token: null,
          role: null
        });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
        role: null
      });
    }
  }, []);

  // Require specific role with redirect
  const requireRole = useCallback((requiredRole: string, redirectTo: string = '/auth/signin') => {
    if (!authState.isLoading) {
      if (!authState.isAuthenticated) {
        router.replace(redirectTo);
        return false;
      }
      
      if (authState.role !== requiredRole) {
        router.replace('/auth/role-selection');
        return false;
      }
    }
    return true;
  }, [authState, router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    ...authState,
    checkAuth,
    requireRole,
    signOut: authService.signOut
  };
};
