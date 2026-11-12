
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

    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('id')
      .eq('firebase_uid', firebaseUid)
      .maybeSingle();

    if (userError) {
      throw userError;
    }
    if (!userData) {
      return withCors(new Response(JSON.stringify({ error: 'User not found' }), { status: 404 }));
    }

    // Get cart items
    const { data: cartItems, error } = await supabaseClient
      .from('cart_items')
      .select(`
        *,
        products:product_id (
          id,
          name,
          price,
          image_url,
          merchant:merchant_id (
            id,
            business_name
          )
        )
      `)
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return withCors(
      new Response(JSON.stringify({ data: cartItems }), {
        status: 200,
      })
    );
  } catch (error) {
    const status = error instanceof FirebaseAuthError ? error.status : 500;
    if (!(error instanceof FirebaseAuthError)) {
      console.error('cart-get failed:', error);
    }
    return withCors(
      new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }), {
        status,
      })
    );
  }
});
