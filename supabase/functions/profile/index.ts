import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, withCors } from '../_shared/cors.ts';
import { FirebaseAuthError, requireFirebaseUid } from '../_shared/firebase-auth.ts';
import { createAdminClient } from '../_shared/supabase-admin.ts';

function jsonResponse(body: unknown, status = 200): Response {
  return withCors(new Response(JSON.stringify(body), { status }));
}

function formatProfile(user: Record<string, any>) {
  const displayName = user.role === 'merchant' && user.business_name
    ? user.business_name
    : user.full_name || '';
  const nameParts = String(displayName).trim().split(/\s+/).filter(Boolean);
  return {
    id: user.id,
    uid: user.firebase_uid,
    email: user.email,
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' '),
    fullName: displayName,
    phone: user.phone_number || '',
    profilePicture: user.profile_image_url || undefined,
    profileImageUrl: user.profile_image_url || undefined,
    role: user.role,
    address: user.address || undefined,
    isEmailVerified: Boolean(user.is_verified),
    isPhoneVerified: false,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

serve(async (request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  if (request.method !== 'GET' && request.method !== 'PUT') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const firebaseUid = await requireFirebaseUid(request);
    const supabase = createAdminClient();
    const { data: currentUser, error: lookupError } = await supabase
      .from('users')
      .select('id, firebase_uid, email, full_name, phone_number, profile_image_url, role, is_verified, created_at, updated_at')
      .eq('firebase_uid', firebaseUid)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (!currentUser) return jsonResponse({ error: 'User not found' }, 404);
    let profileUser: Record<string, any> = currentUser;
    if (currentUser.role === 'merchant') {
      const { data: merchant, error: merchantError } = await supabase
        .from('merchants')
        .select('business_name, address')
        .eq('user_id', currentUser.id)
        .maybeSingle();
      if (merchantError) throw merchantError;
      profileUser = { ...currentUser, ...merchant };
    }
    if (request.method === 'GET') return jsonResponse(formatProfile(profileUser));

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'A valid JSON body is required' }, 400);
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return jsonResponse({ error: 'A JSON object is required' }, 400);
    }

    if (
      body.email !== undefined &&
      (typeof body.email !== 'string' || body.email !== currentUser.email)
    ) {
      return jsonResponse({ error: 'Email changes must be completed through Firebase Authentication' }, 400);
    }
    if (body.bio !== undefined) {
      return jsonResponse({ error: 'The profile schema does not support a bio field' }, 400);
    }

    if (
      ['fullName', 'firstName', 'lastName', 'phone', 'profilePicture', 'profileImageUrl', 'address']
        .some((field) => body[field] !== undefined && typeof body[field] !== 'string')
    ) {
      return jsonResponse({ error: 'Profile fields must be strings' }, 400);
    }
    const fullName = typeof body.fullName === 'string'
      ? body.fullName.trim()
      : [body.firstName, body.lastName].filter((part) => typeof part === 'string' && part.trim()).join(' ').trim();
    const updates: Record<string, string> = { updated_at: new Date().toISOString() };

    if (fullName) updates.full_name = fullName;
    if (typeof body.phone === 'string') updates.phone_number = body.phone.trim();
    const profileImage = body.profilePicture ?? body.profileImageUrl;
    if (typeof profileImage === 'string') updates.profile_image_url = profileImage;

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('firebase_uid', firebaseUid)
      .select('id, firebase_uid, email, full_name, phone_number, profile_image_url, role, is_verified, created_at, updated_at')
      .single();

    if (updateError) throw updateError;

    if (typeof body.address === 'string' && currentUser.role === 'merchant') {
      const { error: merchantError } = await supabase
        .from('merchants')
        .update({
          ...(typeof body.firstName === 'string' ? { business_name: body.firstName.trim() } : {}),
          address: body.address.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', currentUser.id);
      if (merchantError) throw merchantError;
    } else if (currentUser.role === 'merchant' && typeof body.firstName === 'string') {
      const { error: merchantError } = await supabase
        .from('merchants')
        .update({ business_name: body.firstName.trim(), updated_at: new Date().toISOString() })
        .eq('user_id', currentUser.id);
      if (merchantError) throw merchantError;
    }

    return jsonResponse(formatProfile({
      ...updatedUser,
      ...(currentUser.role === 'merchant'
        ? {
            business_name: typeof body.firstName === 'string'
              ? body.firstName.trim()
              : profileUser.business_name,
            address: typeof body.address === 'string' ? body.address.trim() : profileUser.address,
          }
        : {}),
    }));
  } catch (error) {
    if (!(error instanceof FirebaseAuthError)) {
      console.error('profile function failed:', error);
    }
    const status = error instanceof FirebaseAuthError ? error.status : 500;
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Internal server error',
    }, status);
  }
});
