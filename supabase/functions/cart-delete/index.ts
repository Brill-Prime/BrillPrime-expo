
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, withCors } from '../_shared/cors.ts';
import { FirebaseAuthError, requireFirebaseUid } from '../_shared/firebase-auth.ts';
import { createAdminClient } from '../_shared/supabase-admin.ts';

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const firebaseUid = await requireFirebaseUid(req);
    const supabaseClient = createAdminClient();

    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const functionIndex = pathSegments.lastIndexOf('cart-delete');
    const itemId = functionIndex >= 0 ? pathSegments[functionIndex + 1] : undefined;

    // Get user from database
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('id')
      .eq('firebase_uid', firebaseUid)
      .maybeSingle();

    if (userError) throw userError;
    if (!userData) {
      return withCors(new Response(JSON.stringify({ error: 'User not found' }), { status: 404 }));
    }

    let deleteQuery = supabaseClient
      .from('cart_items')
      .delete()
      .eq('user_id', userData.id);
    if (itemId) {
      deleteQuery = deleteQuery.eq('id', itemId);
    }
    const { error } = await deleteQuery;

    if (error) throw error;

    return withCors(
      new Response(JSON.stringify({ message: 'Item removed from cart' }), {
        status: 200,
      })
    );
  } catch (error) {
    const status = error instanceof FirebaseAuthError ? error.status : 400;
    return withCors(
      new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to delete cart item' }), {
        status,
      })
    );
  }
});
