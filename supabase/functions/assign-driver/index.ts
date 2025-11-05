
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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { orderId, deliveryLocation } = await req.json();

    // Find available drivers (simplified - you can add distance calculation)
    const { data: availableDrivers, error: driversError } = await supabaseClient
      .from('users')
      .select('id, full_name')
      .eq('role', 'driver')
      .eq('is_active', true)
      .limit(10);

    if (driversError) throw driversError;

    if (!availableDrivers || availableDrivers.length === 0) {
      throw new Error('No available drivers found');
    }

    const bestDriver = availableDrivers[0];

    // Assign driver to order
    const { error: assignError } = await supabaseClient
      .from('orders')
      .update({
        driver_id: bestDriver.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (assignError) throw assignError;

    // Send notification to driver
    await supabaseClient.from('notifications').insert({
      user_id: bestDriver.id,
      title: 'New Delivery Request',
      message: `You have been assigned a new delivery order`,
      type: 'delivery',
      role: 'driver',
      data: { order_id: orderId }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          driverId: bestDriver.id,
          driverName: bestDriver.full_name
        }
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
