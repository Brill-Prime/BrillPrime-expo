
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { orderId, amount, paymentMethod } = await req.json();

    // Get user from database
    const { data: userData } = await supabaseClient
      .from('users')
      .select('id')
      .eq('firebase_uid', user.id)
      .single();

    if (!userData) {
      throw new Error('User not found');
    }

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabaseClient
      .from('transactions')
      .insert({
        user_id: userData.id,
        order_id: orderId,
        amount: amount,
        payment_method: paymentMethod,
        status: 'pending',
        type: 'order_payment',
      })
      .select()
      .single();

    if (transactionError) throw transactionError;

    // Here you would integrate with Paystack or Stripe
    // For now, we'll simulate a successful payment
    const paymentSuccessful = true;

    if (paymentSuccessful) {
      // Update transaction status
      await supabaseClient
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', transaction.id);

      // Update order payment status
      await supabaseClient
        .from('orders')
        .update({ payment_status: 'paid' })
        .eq('id', orderId);

      return new Response(
        JSON.stringify({ 
          data: { 
            transactionId: transaction.id, 
            status: 'completed' 
          }, 
          success: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error('Payment failed');
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
