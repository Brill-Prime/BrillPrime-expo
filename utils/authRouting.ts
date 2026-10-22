export type UserRole = 'consumer' | 'merchant' | 'driver';

const ROLE_HOME_ROUTES: Record<UserRole, string> = {
  consumer: '/home/consumer',
  merchant: '/home/merchant',
  driver: '/home/driver',
};

export function isUserRole(value: unknown): value is UserRole {
  return value === 'consumer' || value === 'merchant' || value === 'driver';
}

export function getRoleHomeRoute(role: UserRole): string {
  return ROLE_HOME_ROUTES[role];
}
