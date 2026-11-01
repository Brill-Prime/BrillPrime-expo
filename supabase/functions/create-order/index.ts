import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, withCors } from '../_shared/cors.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return withCors(new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', Allow: 'POST' },
    }));
  }

  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization) {
      return withCors(new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }));
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authorization },
        },
      }
    );

    // Get the user from the JWT token
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return withCors(
        new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401 }
        )
      );
    }

    const body = await req.json();
    const { items, deliveryAddress, paymentMethodId, notes } = body;

    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      throw new Error('Add between 1 and 50 items to your order.');
    }
    if (typeof deliveryAddress !== 'string' || !deliveryAddress.trim() || deliveryAddress.length > 500) {
      throw new Error('A valid delivery address is required.');
    }
    if (paymentMethodId !== 'cash') {
      throw new Error('Only cash on delivery is currently available.');
    }
    if (notes !== undefined && (typeof notes !== 'string' || notes.length > 1000)) {
      throw new Error('Delivery notes must be 1000 characters or fewer.');
    }

    const itemQuantities = new Map<string, number>();
    for (const item of items) {
      if (
        !item || typeof item.productId !== 'string' || !item.productId.trim() ||
        typeof item.quantity !== 'number' || !Number.isFinite(item.quantity) ||
        item.quantity <= 0 || item.quantity > 100
      ) {
        throw new Error('Each item must have a product ID and a quantity between 0 and 100.');
      }
      itemQuantities.set(item.productId, (itemQuantities.get(item.productId) ?? 0) + item.quantity);
    }

    // Get user from database
    const { data: userData, error: userDataError } = await supabaseClient
      .from('users')
      .select('id')
      .eq('firebase_uid', user.id)
      .single();

    if (userDataError || !userData) {
      throw new Error('User not found');
    }

    const productIds = [...itemQuantities.keys()];
    const { data: products, error: productsError } = await supabaseClient
      .from('products')
      .select('id, price, merchant_id, stock_quantity, is_available')
      .in('id', productIds);

    if (productsError) throw productsError;
    if (!products || products.length !== productIds.length) {
      throw new Error('One or more products are no longer available. Please refresh your cart.');
    }

    const productsById = new Map(products.map((product) => [product.id, product]));
    let subtotal = 0;
    const orderItems = [];
    let merchantId: string | null = null;

    for (const [productId, quantity] of itemQuantities) {
      const product = productsById.get(productId);
      if (!product || !product.is_available || Number(product.stock_quantity) < quantity) {
        throw new Error('A product is unavailable or has insufficient stock. Please refresh your cart.');
      }

      if (merchantId && merchantId !== product.merchant_id) {
        throw new Error('Please place separate orders for products from different merchants.');
      }
      merchantId = product.merchant_id;

      const unitPrice = Number(product.price);
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        throw new Error('A product has an invalid price and cannot be ordered.');
      }
      const itemTotal = unitPrice * quantity;
      subtotal += itemTotal;

      orderItems.push({
        product_id: productId,
        quantity,
        unit_price: unitPrice,
        total_price: itemTotal,
        merchant_id: product.merchant_id,
      });
    }

    if (!merchantId) throw new Error('The order has no valid merchant.');

    const deliveryFee = 500;
    const serviceFee = 200;
    const totalAmount = subtotal + deliveryFee + serviceFee;

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
        service_fee: serviceFee,
        delivery_address: deliveryAddress.trim(),
        payment_method: paymentMethodId,
        payment_status: 'pending',
        notes: notes?.trim() || null,
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

    const { data: merchant } = await supabaseClient
      .from('merchants')
      .select('user_id')
      .eq('id', merchantId)
      .maybeSingle();
    if (merchant?.user_id) {
      await supabaseClient.from('notifications').insert({
        user_id: merchant.user_id,
        title: 'New Order',
        message: `You have a new order #${order.id.slice(0, 8)}`,
        type: 'order',
        role: 'merchant',
        data: { order_id: order.id },
      });
    }

    return withCors(
      new Response(JSON.stringify({
        success: true,
        message: 'Order created successfully', 
        order: order 
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  } catch (error) {
    return withCors(
      new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unable to create order.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }
});
