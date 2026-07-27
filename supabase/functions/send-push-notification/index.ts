/**
 * send-push-notification
 *
 * Called by the orders_status_change_push DB trigger (and directly from the
 * app) to deliver an Expo push notification to every device token registered
 * for a given user.
 *
 * Request body:
 *   { user_id: string, title: string, body: string, data?: object }
 *
 * Uses the Expo Push Notifications API (https://exp.host/--/api/v2/push/send),
 * which handles FCM (Android) and APNs (iOS) behind the scenes.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, withCors } from '../_shared/cors.ts';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // ── Parse request ─────────────────────────────────────────────────────
    const { user_id, title, body, data } = await req.json() as {
      user_id: string;
      title: string;
      body: string;
      data?: Record<string, unknown>;
    };

    if (!user_id || !title || !body) {
      return withCors(new Response(
        JSON.stringify({ error: 'user_id, title, and body are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      ));
    }

    // ── Fetch device tokens for this user ─────────────────────────────────
    const { data: tokens, error: tokenError } = await supabaseAdmin
      .from('device_tokens')
      .select('token, platform')
      .eq('user_id', user_id);

    if (tokenError) {
      console.error('[send-push] DB error fetching tokens:', tokenError);
      return withCors(new Response(
        JSON.stringify({ error: 'Failed to fetch device tokens' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      ));
    }

    if (!tokens || tokens.length === 0) {
      return withCors(new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No device tokens registered for user' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ));
    }

    // ── Build Expo push messages ──────────────────────────────────────────
    // Only Expo push tokens (ExpoPushToken[xxx]) work with this endpoint.
    // Web tokens are handled by the browser Notification API in the app.
    const expoTokens = tokens
      .filter((t) => t.platform !== 'web' && t.token.startsWith('ExponentPushToken'))
      .map((t) => t.token);

    if (expoTokens.length === 0) {
      return withCors(new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No native push tokens for user' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ));
    }

    const messages = expoTokens.map((token) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data: data ?? {},
      channelId: 'order-updates', // Android notification channel
    }));

    // ── Send to Expo Push API ─────────────────────────────────────────────
    const expoRes = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(messages),
    });

    const expoBody = await expoRes.json();
    console.log('[send-push] Expo response:', JSON.stringify(expoBody));

    // ── Record notification in DB ─────────────────────────────────────────
    // Insert a row into the notifications table so in-app history is updated.
    await supabaseAdmin.from('notifications').insert({
      user_id,
      title,
      message: body,
      read: false,
      data: data ?? {},
      type: (data?.screen as string)?.includes('driver') ? 'order' : 'order',
    });

    return withCors(new Response(
      JSON.stringify({ success: true, sent: expoTokens.length, expo: expoBody }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    ));
  } catch (err) {
    console.error('[send-push] Unhandled error:', err);
    return withCors(new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    ));
  }
});
