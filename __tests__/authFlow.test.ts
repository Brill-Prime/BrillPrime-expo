import { resolveAuthRoute, normalizeRole, getStoredRole, hasCompletedOnboarding, getPendingRegistrationData } from '../utils/authFlow';

describe('auth flow routing', () => {
  it('redirects first-time users to onboarding', () => {
    expect(resolveAuthRoute({
      hasSeenOnboarding: false,
      selectedRole: null,
      userRole: null,
      userEmail: null,
      token: null,
      tokenExpiry: null,
      hasSupabaseSession: false,
    })).toMatchObject({ route: 'onboarding' });
  });

  it('routes users without a role to role selection', () => {
    expect(resolveAuthRoute({
      hasSeenOnboarding: true,
      selectedRole: null,
      userRole: null,
      userEmail: null,
      token: null,
      tokenExpiry: null,
      hasSupabaseSession: false,
    })).toMatchObject({ route: 'role-selection' });
  });

  it('treats false onboarding flags stored as strings as not complete', () => {
    expect(hasCompletedOnboarding('false')).toBe(false);
    expect(hasCompletedOnboarding('true')).toBe(true);
    expect(hasCompletedOnboarding(null)).toBe(false);
  });

  it('recovers pending signup state from fallback email and role data', () => {
    expect(getPendingRegistrationData(null, 'fallback@example.com', 'merchant')).toMatchObject({
      email: 'fallback@example.com',
      role: 'merchant',
    });

    expect(getPendingRegistrationData('{"email":"json@example.com","role":"driver"}', null, null)).toMatchObject({
      email: 'json@example.com',
      role: 'driver',
    });
  });

  it('recovers pending signup state from persisted user email and role when registration cache is missing', () => {
    expect(getPendingRegistrationData(null, null, null, 'persisted@example.com', 'driver')).toMatchObject({
      email: 'persisted@example.com',
      role: 'driver',
    });

    expect(getPendingRegistrationData(null, null, null, 'persisted@example.com', 'merchant')).toMatchObject({
      email: 'persisted@example.com',
      role: 'merchant',
    });
  });

  it('prefers a valid Supabase session and authenticated role', () => {
    expect(resolveAuthRoute({
      hasSeenOnboarding: true,
      selectedRole: 'consumer',
      userRole: 'consumer',
      userEmail: 'user@example.com',
      token: 'valid-token',
      tokenExpiry: String(Date.now() + 60_000),
      hasSupabaseSession: true,
    })).toMatchObject({ route: 'home', role: 'consumer' });
  });

  it('routes signed-up users with a saved role to the correct auth screen', () => {
    expect(resolveAuthRoute({
      hasSeenOnboarding: true,
      selectedRole: 'merchant',
      userRole: null,
      userEmail: 'merchant@example.com',
      token: null,
      tokenExpiry: null,
      hasSupabaseSession: false,
    })).toMatchObject({ route: 'signin', role: 'merchant' });
  });

  it('rejects stale or fake JWTs even when an expiry is present', () => {
    const fakeToken = 'not-a-real-jwt.with-expiry-and-no-supabase-claims';

    expect(resolveAuthRoute({
      hasSeenOnboarding: true,
      selectedRole: 'consumer',
      userRole: 'consumer',
      userEmail: 'user@example.com',
      token: fakeToken,
      tokenExpiry: String(Date.now() + 60_000),
      hasSupabaseSession: false,
    })).toMatchObject({ route: 'signin', role: 'consumer' });
  });

  it('normalizes uppercase backend roles to supported lowercase values', () => {
    expect(normalizeRole('CONSUMER')).toBe('consumer');
    expect(normalizeRole('MERCHANT')).toBe('merchant');
    expect(resolveAuthRoute({
      hasSeenOnboarding: true,
      selectedRole: 'CONSUMER',
      userRole: null,
      userEmail: 'user@example.com',
      token: 'not-a-real-jwt.with-expiry-and-no-supabase-claims',
      tokenExpiry: String(Date.now() + 60_000),
      hasSupabaseSession: false,
    })).toMatchObject({ route: 'signin', role: 'consumer' });
  });

  it('uses the existing userRole when selectedRole is missing', () => {
    expect(getStoredRole(null, 'merchant')).toBe('merchant');
    expect(resolveAuthRoute({
      hasSeenOnboarding: true,
      selectedRole: null,
      userRole: 'merchant',
      userEmail: 'merchant@example.com',
      token: null,
      tokenExpiry: null,
      hasSupabaseSession: false,
    })).toMatchObject({ route: 'signin', role: 'merchant' });
  });

  it('normalizes unsupported roles to null', () => {
    expect(normalizeRole('admin')).toBeNull();
    expect(normalizeRole('consumer')).toBe('consumer');
  });
});
