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

    const { lat, lng, merchant_id } = await req.json();

    if (!lat || !lng) {
      throw new Error('Latitude and longitude are required');
    }

    try {
      // First try to use PostGIS function if available
      const { data, error } = await supabaseClient.rpc('is_within_delivery_zone', {
        p_lat: lat,
        p_lng: lng,
        p_merchant_id: merchant_id || null
      });

      if (!error && data !== undefined) {
        return withCors(
          new Response(JSON.stringify({ 
            is_within_zone: data,
            success: true 
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      }

      // Fallback to client-side calculation if PostGIS function doesn't exist
      const { data: zones, error: zonesError } = merchant_id
        ? await supabaseClient
            .from('delivery_zones')
            .select('*')
            .eq('merchant_id', merchant_id)
            .eq('is_active', true)
        : await supabaseClient
            .from('delivery_zones')
            .select('*')
            .eq('is_active', true);

      if (zonesError) throw zonesError;

      // Simple point-in-polygon check (for convex polygons)
      const isPointInPolygon = (point: [number, number], polygon: number[][]) => {
        const [x, y] = point;
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
          const [xi, yi] = polygon[i];
          const [xj, yj] = polygon[j];
          const intersect = 
            ((yi > y) !== (yj > y)) && 
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
          if (intersect) inside = !inside;
        }
        return inside;
      };

      // Check if point is within any delivery zone
      const isInZone = zones.some(zone => {
        try {
          const polygon = JSON.parse(zone.coordinates);
          return isPointInPolygon([lng, lat], polygon);
        } catch (e) {
          console.error('Error parsing zone coordinates:', e);
          return false;
        }
      });

      return withCors(
        new Response(JSON.stringify({ 
          is_within_zone: isInZone,
          success: true 
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

    } catch (error) {
      console.error('Error in delivery zone function:', error);
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