
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
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

    // Get the user from the JWT token
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { items, deliveryAddressId, paymentMethodId, notes } = await req.json();

    // Get user from database
    const { data: userData } = await supabaseClient
      .from('users')
      .select('id')
      .eq('firebase_uid', user.id)
      .single();

    if (!userData) {
      throw new Error('User not found');
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const { data: product } = await supabaseClient
        .from('products')
        .select('price, merchant_id')
        .eq('id', item.productId)
        .single();

      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: product.price,
        total_price: itemTotal,
        merchant_id: product.merchant_id,
      });
    }

    // Assume single merchant for now (group orders by merchant in production)
    const merchantId = orderItems[0].merchant_id;
    const deliveryFee = 5.00; // Fixed delivery fee
    const totalAmount = subtotal + deliveryFee;

    // Get delivery address
    const { data: address } = await supabaseClient
      .from('addresses')
      .select('*')
      .eq('id', deliveryAddressId)
      .single();

    // Create order
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        user_id: userData.id,
        merchant_id: merchantId,
        status: 'PENDING',
        total_amount: totalAmount,
        subtotal: subtotal,
        delivery_fee: deliveryFee,
        delivery_address: `${address.address_line1}, ${address.city}, ${address.state}`,
        payment_method: paymentMethodId,
        notes: notes,
      })
      .select()
      .single();

    if (orderError) {
      throw orderError;
    }

    // Create order items
    const orderItemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsError } = await supabaseClient
      .from('order_items')
      .insert(orderItemsWithOrderId);

    if (itemsError) {
      throw itemsError;
    }

    // Create notification for merchant
    await supabaseClient.from('notifications').insert({
      user_id: merchantId,
      title: 'New Order',
      message: `You have a new order #${order.id.slice(0, 8)}`,
      type: 'order',
      role: 'merchant',
      data: { order_id: order.id },
    });

    return new Response(
      JSON.stringify({ data: order, success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
