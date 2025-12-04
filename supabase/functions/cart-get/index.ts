
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

    // Get user from database
    const { data: userData } = await supabaseClient
      .from('users')
      .select('id')
      .eq('firebase_uid', user.id)
      .single();

    if (!userData) {
      throw new Error('User not found');
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
    return withCors(
      new Response(JSON.stringify({ error: error.message }), {
        status: 400,
      })
    );
  }
});
