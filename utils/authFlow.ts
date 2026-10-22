export type SupportedRole = 'consumer' | 'merchant' | 'driver';

const SUPPORTED_ROLES: SupportedRole[] = ['consumer', 'merchant', 'driver'];

export function hasCompletedOnboarding(value: string | null | undefined): boolean {
  return value?.trim().toLowerCase() === 'true';
}

export function normalizeRole(value: string | null | undefined): SupportedRole | null {
  if (!value || typeof value !== 'string') return null;

  const normalized = value.trim().toLowerCase();
  return SUPPORTED_ROLES.includes(normalized as SupportedRole)
    ? (normalized as SupportedRole)
    : null;
}

export function getStoredRole(selectedRole: string | null | undefined, userRole: string | null | undefined): SupportedRole | null {
  return normalizeRole(userRole) ?? normalizeRole(selectedRole);
}

export function getPendingRegistrationData(
  pendingUserData: string | null | undefined,
  fallbackEmail?: string | null,
  fallbackRole?: string | null,
  persistedUserEmail?: string | null,
  persistedUserRole?: string | null,
): { email: string; role: SupportedRole | null } | null {
  let parsedEmail = '';
  let parsedRole: SupportedRole | null = null;

  if (pendingUserData) {
    try {
      const parsed = JSON.parse(pendingUserData) as Record<string, any>;
      parsedEmail = typeof parsed.email === 'string' ? parsed.email.trim() : '';
      parsedRole = normalizeRole(parsed.role ?? fallbackRole ?? persistedUserRole ?? null);
    } catch {
      // Fall through to fallback values below.
    }
  }

  const emailCandidates = [parsedEmail, fallbackEmail, persistedUserEmail].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
  const roleCandidates = [parsedRole, normalizeRole(fallbackRole), normalizeRole(persistedUserRole)].filter((value): value is SupportedRole => value !== null);

  const email = emailCandidates[0]?.trim() ?? '';
  if (!email) {
    return null;
  }

  return {
    email,
    role: roleCandidates[0] ?? normalizeRole(fallbackRole ?? persistedUserRole ?? null),
  };
}

export function hasValidExpiry(expiry: string | null | undefined): boolean {
  if (!expiry) return false;
  const expiryTime = Number(expiry);
  return Number.isFinite(expiryTime) && expiryTime > Date.now();
}

export function isLikelySupabaseAccessToken(token: string | null | undefined): boolean {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;

  try {
    const payloadPart = parts[1];
    const padded = payloadPart.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payloadPart.length / 4) * 4, '=');
    const binary = typeof atob === 'function'
      ? atob(padded)
      : Buffer.from(padded, 'base64').toString('binary');
    const json = decodeURIComponent(
      Array.from(binary).map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join('')
    );
    const claims = JSON.parse(json) as Record<string, any>;

    const issuer = String(claims.iss || '').toLowerCase();
    const audience = String(Array.isArray(claims.aud) ? claims.aud.join(',') : claims.aud || '').toLowerCase();

    return issuer.includes('supabase.co') || issuer.includes('supabase') || audience.includes('authenticated');
  } catch {
    return false;
  }
}

export function resolveAuthRoute({
  hasSeenOnboarding,
  selectedRole,
  userRole,
  userEmail,
  token,
  tokenExpiry,
  hasSupabaseSession,
}: {
  hasSeenOnboarding: boolean;
  selectedRole: string | null;
  userRole: string | null;
  userEmail: string | null;
  token: string | null;
  tokenExpiry: string | null;
  hasSupabaseSession: boolean;
}): { route: 'onboarding' | 'role-selection' | 'signin' | 'signup' | 'home'; role: SupportedRole | null } {
  if (!hasSeenOnboarding) {
    return { route: 'onboarding', role: null };
  }

  const role = getStoredRole(selectedRole, userRole);

  if (!role) {
    return { route: 'role-selection', role: null };
  }

  const hasValidSupabaseToken = isLikelySupabaseAccessToken(token) && hasValidExpiry(tokenExpiry);
  const hasValidSession = hasSupabaseSession || hasValidSupabaseToken;

  if (hasValidSession) {
    return { route: 'home', role };
  }

  return {
    route: userEmail ? 'signin' : 'signup',
    role,
  };
}
