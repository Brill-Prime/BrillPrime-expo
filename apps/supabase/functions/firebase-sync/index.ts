
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

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

    const { action, data } = await req.json();

    let result;

    switch (action) {
      case 'sync_user':
        result = await supabaseClient.rpc('sync_firebase_user', {
          p_firebase_uid: data.firebaseUid,
          p_email: data.email,
          p_first_name: data.firstName,
          p_last_name: data.lastName,
          p_phone: data.phone,
        });
        break;

      case 'sync_order':
        // Get user and merchant IDs
        const { data: user } = await supabaseClient
          .from('users')
          .select('id')
          .eq('firebase_uid', data.userId)
          .single();

        const { data: merchant } = await supabaseClient
          .from('merchants')
          .select('id')
          .eq('firebase_uid', data.merchantId)
          .single();

        // Insert or update order
        result = await supabaseClient
          .from('orders')
          .upsert({
            firebase_order_id: data.id,
            user_id: user?.id,
            merchant_id: merchant?.id,
            total: data.total,
            status: data.status,
            delivery_address: data.deliveryAddress,
            created_at: data.createdAt,
            updated_at: new Date().toISOString(),
          })
          .select();
        break;

      case 'sync_product':
        const { data: productMerchant } = await supabaseClient
          .from('merchants')
          .select('id')
          .eq('firebase_uid', data.merchantId)
          .single();

        result = await supabaseClient
          .from('commodities')
          .upsert({
            firebase_product_id: data.id,
            merchant_id: productMerchant?.id,
            name: data.name,
            description: data.description,
            price: data.price,
            category: data.category,
            stock: data.stock,
            image_url: data.imageUrl,
            updated_at: new Date().toISOString(),
          })
          .select();
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
