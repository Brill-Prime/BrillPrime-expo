import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, withCors } from '../_shared/cors.ts';
import { FirebaseAuthError, requireFirebaseIdentity } from '../_shared/firebase-auth.ts';
import { createAdminClient } from '../_shared/supabase-admin.ts';

const allowedRoles = new Set(['consumer', 'merchant', 'driver']);

function jsonResponse(body: unknown, status = 200): Response {
  return withCors(new Response(JSON.stringify(body), { status }));
}

serve(async (request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const identity = await requireFirebaseIdentity(request);
    if (!identity.email) {
      return jsonResponse({ error: 'A Firebase account email is required' }, 400);
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'A valid JSON body is required' }, 400);
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return jsonResponse({ error: 'A JSON object is required' }, 400);
    }

    if (body.role !== undefined && (typeof body.role !== 'string' || !allowedRoles.has(body.role))) {
      return jsonResponse({ error: 'Role must be consumer, merchant, or driver' }, 400);
    }
    if (
      (body.fullName !== undefined && typeof body.fullName !== 'string') ||
      (body.phoneNumber !== undefined && typeof body.phoneNumber !== 'string')
    ) {
      return jsonResponse({ error: 'Profile name and phone number must be strings' }, 400);
    }

    const supabase = createAdminClient();
    const { data: existingUser, error: lookupError } = await supabase
      .from('users')
      .select('id, firebase_uid, email, role')
      .eq('firebase_uid', identity.uid)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (existingUser) return jsonResponse(existingUser);

    const role = allowedRoles.has(identity.role || '')
      ? identity.role
      : body.role === undefined || body.role === 'consumer'
        ? 'consumer'
        : null;
    if (!role) {
      return jsonResponse({
        error: 'A new merchant or driver profile must be provisioned by an administrator',
      }, 403);
    }

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        firebase_uid: identity.uid,
        email: identity.email,
        role,
        full_name: typeof body.fullName === 'string' && body.fullName.trim()
          ? body.fullName.trim()
          : identity.name || '',
        phone_number: typeof body.phoneNumber === 'string' ? body.phoneNumber.trim() : '',
      })
      .select('id, firebase_uid, email, role')
      .single();

    if (!insertError && newUser) return jsonResponse(newUser, 201);

    if (insertError?.code === '23505') {
      const { data: racedUser, error: racedLookupError } = await supabase
        .from('users')
        .select('id, firebase_uid, email, role')
        .eq('firebase_uid', identity.uid)
        .maybeSingle();
      if (racedLookupError) throw racedLookupError;
      if (racedUser) return jsonResponse(racedUser);
    }

    if (insertError) throw insertError;
    throw new Error('Supabase did not return the synchronized user profile');
  } catch (error) {
    if (!(error instanceof FirebaseAuthError)) {
      console.error('user-sync function failed:', error);
    }
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Internal server error',
    }, error instanceof FirebaseAuthError ? error.status : 500);
  }
});
