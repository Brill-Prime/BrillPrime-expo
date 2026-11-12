
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
    const itemId = url.pathname.split('/').pop();
    const { quantity } = await req.json();
    if (!itemId || itemId === 'cart-update') {
      return withCors(new Response(JSON.stringify({ error: 'A cart item ID is required' }), { status: 400 }));
    }
    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 100) {
      return withCors(new Response(JSON.stringify({ error: 'Quantity must be an integer between 1 and 100' }), { status: 400 }));
    }

    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('id')
      .eq('firebase_uid', firebaseUid)
      .maybeSingle();
    if (userError) throw userError;
    if (!userData) {
      return withCors(new Response(JSON.stringify({ error: 'User not found' }), { status: 404 }));
    }

    const { data, error } = await supabaseClient
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId)
      .eq('user_id', userData.id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return withCors(new Response(JSON.stringify({ error: 'Cart item not found' }), { status: 404 }));
    }

    return withCors(
      new Response(JSON.stringify({ message: 'Cart updated', data }), {
        status: 200,
      })
    );
  } catch (error) {
    const status = error instanceof FirebaseAuthError ? error.status : 400;
    return withCors(
      new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to update cart item' }), {
        status,
      })
    );
  }
});
