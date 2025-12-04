
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, withCors } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return withCors(
        new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401 }
        )
      );
    }

    const { productId, quantity } = await req.json();

    // Get user from database
    const { data: userData } = await supabaseClient
      .from('users')
      .select('id')
      .eq('firebase_uid', user.id)
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
      new Response(JSON.stringify({ message: 'Item added to cart', data }), {
        status: 200,
      })
    );
  } catch (error) {
    return withCors(
      new Response(JSON.stringify({ error: error.message }), {
        status: 400,
      })
    );
  }
});
