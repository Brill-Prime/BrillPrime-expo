import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, withCors } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

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

    const { lat, lng, user_id } = await req.json();

    if (!lat || !lng) {
      throw new Error('Latitude and longitude are required');
    }

    try {
      // First try to use PostGIS function if available
      const { data, error } = await supabaseClient.rpc('get_location_promotions', {
        p_lat: lat,
        p_lng: lng,
        p_user_id: user_id || null
      });

      if (!error && data) {
        return withCors(
          new Response(JSON.stringify({ 
            data, 
            success: true 
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      }

      // Fallback to client-side calculation if PostGIS function doesn't exist
      const { data: promotions, error: promotionsError } = await supabaseClient
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString());

      if (promotionsError) throw promotionsError;

      // Simple distance calculation (Haversine formula)
      const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        return R * c; // Distance in km
      };

      const nearbyPromotions = promotions.filter(promotion => {
        if (!promotion.location_lat || !promotion.location_lng) return false;
        const distance = calculateDistance(
          lat, lng, 
          promotion.location_lat, 
          promotion.location_lng
        );
        return distance <= (promotion.radius_km || 5); // Default 5km radius
      });

      return withCors(
        new Response(JSON.stringify({ 
          data: nearbyPromotions, 
          success: true 
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

    } catch (error) {
      console.error('Error in geofence promotions function:', error);
      throw error;
    }
  } catch (error) {
    return withCors(
      new Response(JSON.stringify({ 
        error: error.message, 
        success: false 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }
});