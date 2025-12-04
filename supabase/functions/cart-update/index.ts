
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

    const url = new URL(req.url);
    const itemId = url.pathname.split('/').pop();
    const { quantity } = await req.json();

    // Update cart item quantity
    const { data, error } = await supabaseClient
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;

    return withCors(
      new Response(JSON.stringify({ message: 'Cart updated', data }), {
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
