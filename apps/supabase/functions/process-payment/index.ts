
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
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

    const { orderId, amount, paymentMethod } = await req.json();

    // Validate payment details
    if (!orderId || !amount || !paymentMethod) {
      throw new Error('Missing required payment details');
    }

    // Get order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*, user_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    // Verify amount matches
    if (parseFloat(order.total_amount) !== amount) {
      throw new Error('Amount mismatch');
    }

    // Process payment (integrate with payment gateway here)
    // Example: Stripe, Paystack, Flutterwave, etc.
    
    // Update order status
    const { error: updateError } = await supabaseClient
      .from('orders')
      .update({
        payment_status: 'completed',
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      throw updateError;
    }

    // Create transaction record
    const { error: txError } = await supabaseClient
      .from('transactions')
      .insert({
        order_id: orderId,
        user_id: order.user_id,
        amount: amount,
        type: 'payment',
        status: 'completed',
        payment_method: paymentMethod,
      });

    if (txError) {
      console.error('Transaction record error:', txError);
    }

    return new Response(
      JSON.stringify({ success: true, orderId }),
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
