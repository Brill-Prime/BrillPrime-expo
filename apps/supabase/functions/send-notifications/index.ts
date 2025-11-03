
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

    const { userId, title, message, type, data } = await req.json();

    // Store notification in database
    const { error: notifError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        data,
        read: false,
      });

    if (notifError) {
      throw notifError;
    }

    // Get user's FCM token
    const { data: userData } = await supabaseClient
      .from('users')
      .select('fcm_token')
      .eq('id', userId)
      .single();

    // Send push notification via Firebase (if FCM token exists)
    if (userData?.fcm_token) {
      const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `key=${Deno.env.get('FIREBASE_SERVER_KEY')}`,
        },
        body: JSON.stringify({
          to: userData.fcm_token,
          notification: {
            title,
            body: message,
          },
          data,
        }),
      });

      if (!fcmResponse.ok) {
        console.error('FCM error:', await fcmResponse.text());
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
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
