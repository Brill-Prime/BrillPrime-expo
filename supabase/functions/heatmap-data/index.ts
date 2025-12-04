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

    const url = new URL(req.url);
    const minLat = parseFloat(url.searchParams.get('min_lat') || '0');
    const minLng = parseFloat(url.searchParams.get('min_lng') || '0');
    const maxLat = parseFloat(url.searchParams.get('max_lat') || '0');
    const maxLng = parseFloat(url.searchParams.get('max_lng') || '0');
    const daysBack = parseInt(url.searchParams.get('days_back') || '30');
    const gridSize = parseFloat(url.searchParams.get('grid_size') || '0.01');

    try {
      // First try to use PostGIS if available
      const { data, error } = await supabaseClient.rpc('get_clustered_heatmap', {
        min_lat: minLat,
        min_lng: minLng,
        max_lat: maxLat,
        max_lng: maxLng,
        grid_size: gridSize,
        days_back: daysBack,
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
      const { data: orderData, error: orderError } = await supabaseClient
        .from('order_locations')
        .select('latitude, longitude, order_value')
        .gte('created_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString());

      if (orderError) throw orderError;

      // Simple grid-based clustering
      const grid: Record<string, { 
        lat: number; 
        lng: number; 
        count: number; 
        totalValue: number 
      }> = {};

      orderData?.forEach(order => {
        if (!order.latitude || !order.longitude) return;
        
        const gridX = Math.floor(order.longitude / gridSize) * gridSize;
        const gridY = Math.floor(order.latitude / gridSize) * gridSize;
        const gridKey = `${gridX},${gridY}`;

        if (!grid[gridKey]) {
          grid[gridKey] = { 
            lat: gridY + gridSize/2, 
            lng: gridX + gridSize/2, 
            count: 0, 
            totalValue: 0 
          };
        }

        grid[gridKey].count += 1;
        grid[gridKey].totalValue += order.order_value || 0;
      });

      const result = Object.values(grid).map(point => ({
        latitude: point.lat,
        longitude: point.lng,
        order_count: point.count,
        total_value: point.totalValue,
        intensity: Math.min(1, point.count / 10) // Normalize to 0-1 range
      }));

      return withCors(
        new Response(JSON.stringify({ 
          data: result, 
          success: true 
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

    } catch (error) {
      console.error('Error in heatmap function:', error);
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
