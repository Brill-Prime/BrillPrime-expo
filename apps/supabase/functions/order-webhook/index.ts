
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

    const { orderId, status, metadata } = await req.json();

    if (!orderId || !status) {
      throw new Error('Missing required fields');
    }

    // Get order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*, user_id, merchant_id, driver_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    // Update order status
    const { error: updateError } = await supabaseClient
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) throw updateError;

    // Send notifications based on status
    const notificationMessages: Record<string, string> = {
      confirmed: 'Your order has been confirmed',
      preparing: 'Your order is being prepared',
      ready: 'Your order is ready for pickup',
      in_transit: 'Your order is on the way',
      delivered: 'Your order has been delivered',
      cancelled: 'Your order has been cancelled',
    };

    const message = notificationMessages[status] || 'Order status updated';

    // Notify user
    await supabaseClient.from('notifications').insert({
      user_id: order.user_id,
      title: 'Order Update',
      message,
      type: 'order',
      data: { orderId, status },
      read: false,
    });

    // Notify merchant
    if (order.merchant_id) {
      await supabaseClient.from('notifications').insert({
        user_id: order.merchant_id,
        title: 'Order Update',
        message: `Order #${orderId} status: ${status}`,
        type: 'order',
        data: { orderId, status },
        read: false,
      });
    }

    // Notify driver if assigned
    if (order.driver_id && status === 'ready') {
      await supabaseClient.from('notifications').insert({
        user_id: order.driver_id,
        title: 'New Delivery',
        message: `Order #${orderId} is ready for pickup`,
        type: 'delivery',
        data: { orderId, status },
        read: false,
      });
    }

    return new Response(
      JSON.stringify({ success: true, orderId, status }),
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
