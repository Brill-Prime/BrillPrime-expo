import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, withCors } from '../_shared/cors.ts';
import { FirebaseAuthError, requireFirebaseUid } from '../_shared/firebase-auth.ts';

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    await requireFirebaseUid(req);
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !anonKey) {
      throw new Error('Supabase configuration is missing');
    }

    const supabaseClient = createClient(
      supabaseUrl,
      anonKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const url = new URL(req.url);
    const latitude = url.searchParams.get('lat');
    const longitude = url.searchParams.get('lng');
    const radius = Number(url.searchParams.get('radius') || '10');
    if (
      latitude === null ||
      latitude.trim() === '' ||
      longitude === null ||
      longitude.trim() === ''
    ) {
      return withCors(new Response(JSON.stringify({ error: 'Valid latitude and longitude are required' }), { status: 400 }));
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    if (
      !Number.isFinite(lat) ||
      lat < -90 ||
      lat > 90 ||
      !Number.isFinite(lng) ||
      lng < -180 ||
      lng > 180 ||
      !Number.isFinite(radius) ||
      radius <= 0 ||
      radius > 100
    ) {
      return withCors(new Response(JSON.stringify({ error: 'Valid latitude, longitude, and radius are required' }), { status: 400 }));
    }

    // Fetch all active merchants
    const { data: merchants, error } = await supabaseClient
      .from('merchants')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    // Distance calculation function
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    // Filter merchants by distance
    const nearbyMerchants = merchants?.filter(merchant => {       
      if (merchant.latitude == null || merchant.longitude == null) return false;
      const distance = calculateDistance(lat, lng, merchant.latitude, merchant.longitude);
      return distance <= radius;
    }) || [];

    return withCors(
      new Response(JSON.stringify({ 
        data: nearbyMerchants, 
        success: true 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

  } catch (error) {
    if (!(error instanceof FirebaseAuthError)) {
      console.error('merchants-nearby failed:', error);
    }
    return withCors(
      new Response(JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      }), {
        status: error instanceof FirebaseAuthError ? error.status : 500,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }
});
