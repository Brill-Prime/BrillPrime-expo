
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-paystack-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    const signature = req.headers.get('x-paystack-signature');
    const body = await req.text();

    // Verify webhook signature
    const hash = createHmac('sha512', paystackSecretKey!)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      throw new Error('Invalid signature');
    }

    const event = JSON.parse(body);
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        // Update transaction status
        await supabaseClient
          .from('transactions')
          .update({
            status: 'COMPLETED',
            gateway_response: event.data,
            updated_at: new Date().toISOString()
          })
          .eq('reference', event.data.reference);

        // Update order status
        await supabaseClient
          .from('orders')
          .update({ payment_status: 'PAID' })
          .eq('payment_reference', event.data.reference);
        break;

      case 'charge.failed':
        await supabaseClient
          .from('transactions')
          .update({
            status: 'FAILED',
            gateway_response: event.data,
            updated_at: new Date().toISOString()
          })
          .eq('reference', event.data.reference);
        break;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
