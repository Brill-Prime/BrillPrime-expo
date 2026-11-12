
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

    const { productId, quantity } = await req.json();
    if (typeof productId !== 'string' || !productId.trim()) {
      return withCors(new Response(JSON.stringify({ error: 'A product ID is required' }), { status: 400 }));
    }
    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 100) {
      return withCors(new Response(JSON.stringify({ error: 'Quantity must be an integer between 1 and 100' }), { status: 400 }));
    }

    // Get user from database
    const { data: userData } = await supabaseClient
      .from('users')
      .select('id')
      .eq('firebase_uid', firebaseUid)
      .single();

    if (!userData) {
      throw new Error('User not found');
    }

    // Check if item already exists in cart
    const { data: existingItem } = await supabaseClient
      .from('cart_items')
      .select('*')
      .eq('user_id', userData.id)
      .eq('product_id', productId)
      .single();

    let result;
    if (existingItem) {
      // Update quantity
      const { data, error } = await supabaseClient
        .from('cart_items')
        .update({ quantity: existingItem.quantity + quantity })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new cart item
      const { data, error } = await supabaseClient
        .from('cart_items')
        .insert({
          user_id: userData.id,
          product_id: productId,
          quantity: quantity,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return withCors(
      new Response(JSON.stringify({ message: 'Item added to cart', data: result }), {
        status: 200,
      })
    );
  } catch (error) {
    const status = error instanceof FirebaseAuthError ? error.status : 400;
    return withCors(
      new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to add cart item' }), {
        status,
      })
    );
  }
});
