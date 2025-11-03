
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

    const { userId, userRole, dateRange } = await req.json();

    if (!userId || !userRole) {
      throw new Error('Missing required fields');
    }

    const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = dateRange?.end || new Date().toISOString();

    let analytics: any = {};

    if (userRole === 'merchant') {
      // Merchant analytics
      const { data: orders } = await supabaseClient
        .from('orders')
        .select('*, order_items(*)')
        .eq('merchant_id', userId)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      const totalRevenue = orders?.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0) || 0;
      const totalOrders = orders?.length || 0;
      const completedOrders = orders?.filter(o => o.status === 'delivered').length || 0;

      analytics = {
        totalRevenue,
        totalOrders,
        completedOrders,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
      };
    } else if (userRole === 'driver') {
      // Driver analytics
      const { data: deliveries } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('driver_id', userId)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      const totalDeliveries = deliveries?.length || 0;
      const completedDeliveries = deliveries?.filter(d => d.status === 'delivered').length || 0;
      const totalEarnings = deliveries?.reduce((sum, delivery) => sum + parseFloat(delivery.delivery_fee || 0), 0) || 0;

      analytics = {
        totalDeliveries,
        completedDeliveries,
        totalEarnings,
        averageEarningsPerDelivery: totalDeliveries > 0 ? totalEarnings / totalDeliveries : 0,
        completionRate: totalDeliveries > 0 ? (completedDeliveries / totalDeliveries) * 100 : 0,
      };
    } else if (userRole === 'consumer') {
      // Consumer analytics
      const { data: orders } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      const totalSpent = orders?.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0) || 0;
      const totalOrders = orders?.length || 0;

      analytics = {
        totalOrders,
        totalSpent,
        averageOrderValue: totalOrders > 0 ? totalSpent / totalOrders : 0,
      };
    }

    return new Response(
      JSON.stringify({ success: true, analytics }),
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
