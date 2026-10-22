import { getRoleHomeRoute, isUserRole } from '../authRouting';

describe('auth role routing', () => {
  it.each([
    ['consumer', '/home/consumer'],
    ['merchant', '/home/merchant'],
    ['driver', '/home/driver'],
  ] as const)('routes %s to its own home', (role, route) => {
    expect(getRoleHomeRoute(role)).toBe(route);
  });

  it.each(['consumer', 'merchant', 'driver'])('accepts the supported role %s', (role) => {
    expect(isUserRole(role)).toBe(true);
  });

  it.each(['admin', 'Consumer', '', null, undefined])('rejects unsupported role %s', (role) => {
    expect(isUserRole(role)).toBe(false);
  });
});
