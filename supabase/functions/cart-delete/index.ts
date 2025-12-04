
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

    // Get user from database
    const { data: userData } = await supabaseClient
      .from('users')
      .select('id')
      .eq('firebase_uid', user.id)
      .single();

    if (!userData) {
      throw new Error('User not found');
    }

    // Delete cart item
    const { error } = await supabaseClient
      .from('cart_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', userData.id);

    if (error) throw error;

    return withCors(
      new Response(JSON.stringify({ message: 'Item removed from cart' }), {
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
