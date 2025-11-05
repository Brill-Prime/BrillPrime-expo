
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { merchantLocation, deliveryLocation, orderValue } = await req.json();

    const distance = calculateDistance(
      merchantLocation.latitude,
      merchantLocation.longitude,
      deliveryLocation.latitude,
      deliveryLocation.longitude
    );

    const baseFee = 500; // ₦500 base fee
    const perKmRate = 100; // ₦100 per km
    const freeDeliveryThreshold = 5000; // Free delivery for orders over ₦5000

    const currentHour = new Date().getHours();
    const isPeakHour = (currentHour >= 17 && currentHour <= 20);
    const surgeMultiplier = isPeakHour ? 1.5 : 1.0;

    const distanceFee = Math.ceil(distance * perKmRate);
    const surgeFee = isPeakHour ? Math.ceil(distanceFee * 0.5) : 0;
    let totalFee = Math.ceil((baseFee + distanceFee + surgeFee) * surgeMultiplier);

    if (orderValue >= freeDeliveryThreshold) {
      totalFee = 0;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          distance: distance.toFixed(2),
          baseFee,
          distanceFee,
          surgeFee,
          total: totalFee,
          isFreeDelivery: orderValue >= freeDeliveryThreshold,
          estimatedTime: Math.ceil(distance * 3)
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
