import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { getRoleHomeRoute, isUserRole, type UserRole } from '../utils/authRouting';

export function useRoleAccess(requiredRole: UserRole): boolean {
  const router = useRouter();
  const { isAuthenticated, isLoading, role } = useAuth();
  const canAccess = isAuthenticated && !isLoading && role === requiredRole;

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/auth/signin' as never);
    } else if (isUserRole(role) && role !== requiredRole) {
      router.replace(getRoleHomeRoute(role) as never);
    } else if (!isUserRole(role)) {
      router.replace('/auth/role-selection' as never);
    }
  }, [isAuthenticated, isLoading, requiredRole, role, router]);

  return canAccess;
}
