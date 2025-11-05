
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const validTransitions = {
  'PENDING': ['CONFIRMED', 'CANCELLED'],
  'CONFIRMED': ['PREPARING', 'CANCELLED'],
  'PREPARING': ['READY', 'OUT_FOR_DELIVERY', 'CANCELLED'],
  'READY': ['OUT_FOR_DELIVERY', 'CANCELLED'],
  'OUT_FOR_DELIVERY': ['DELIVERED', 'CANCELLED'],
  'DELIVERED': [],
  'CANCELLED': []
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { orderId, newStatus, driverId, notes } = await req.json();

    // Get current order
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*, users!inner(id, email, full_name)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    // Validate status transition
    const currentStatus = order.status;
    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }

    // Update order status
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    if (driverId && newStatus === 'OUT_FOR_DELIVERY') {
      updateData.driver_id = driverId;
    }

    if (newStatus === 'DELIVERED') {
      updateData.delivered_at = new Date().toISOString();
    }

    const { error: updateError } = await supabaseClient
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (updateError) throw updateError;

    // Send notifications
    const notifications = [];

    notifications.push({
      user_id: order.user_id,
      title: 'Order Status Updated',
      message: `Your order #${orderId.slice(0, 8)} is now ${newStatus.replace('_', ' ').toLowerCase()}`,
      type: 'order',
      role: 'consumer',
      data: { order_id: orderId, status: newStatus }
    });

    if (driverId) {
      notifications.push({
        user_id: driverId,
        title: 'New Delivery Assignment',
        message: `You have been assigned to order #${orderId.slice(0, 8)}`,
        type: 'delivery',
        role: 'driver',
        data: { order_id: orderId, status: newStatus }
      });
    }

    await supabaseClient.from('notifications').insert(notifications);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: { orderId, newStatus },
        message: 'Order status updated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
