import { createRemoteJWKSet, jwtVerify } from 'https://deno.land/x/jose@v4.14.4/index.ts';

const firebaseJwks = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

export class FirebaseAuthError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'FirebaseAuthError';
  }
}

export async function requireFirebaseUid(request: Request): Promise<string> {
  const projectId = Deno.env.get('FIREBASE_PROJECT_ID');
  if (!projectId) {
    throw new FirebaseAuthError('Firebase authentication is not configured', 500);
  }

  const authorization = request.headers.get('Authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  if (!match) {
    throw new FirebaseAuthError('Authentication required', 401);
  }

  try {
    const { payload } = await jwtVerify(match[1], firebaseJwks, {
      algorithms: ['RS256'],
      audience: projectId,
      issuer: `https://securetoken.google.com/${projectId}`,
    });

    if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
      throw new Error('Firebase token has no subject');
    }

    return payload.sub;
  } catch {
    throw new FirebaseAuthError('Invalid or expired Firebase ID token', 401);
  }
}
