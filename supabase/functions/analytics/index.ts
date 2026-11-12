import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, withCors } from '../_shared/cors.ts';
import { FirebaseAuthError, requireFirebaseIdentity } from '../_shared/firebase-auth.ts';
import { createAdminClient } from '../_shared/supabase-admin.ts';

function jsonResponse(body: unknown, status = 200): Response {
  return withCors(new Response(JSON.stringify(body), { status }));
}

serve(async (request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const identity = await requireFirebaseIdentity(request);
    const payload = await request.json().catch(() => null);
    if (!payload || !Array.isArray(payload.events) || payload.events.length === 0 || payload.events.length > 50) {
      return jsonResponse({ error: 'Between 1 and 50 analytics events are required' }, 400);
    }

    const events = payload.events.map((event: Record<string, unknown>) => {
      if (!event || typeof event.name !== 'string' || !event.name.trim() || event.name.length > 100) {
        throw new FirebaseAuthError('Each event must have a valid name', 400);
      }
      const properties = event.properties === undefined ? {} : event.properties;
      if (!properties || typeof properties !== 'object' || Array.isArray(properties) ||
        JSON.stringify(properties).length > 16000) {
        throw new FirebaseAuthError('Event properties must be an object no larger than 16 KB', 400);
      }
      const occurredAt = Number(event.timestamp);
      const eventDate = new Date(occurredAt);
      if (event.timestamp !== undefined && (!Number.isFinite(occurredAt) || Number.isNaN(eventDate.getTime()))) {
        throw new FirebaseAuthError('Event timestamp must be a valid Unix timestamp', 400);
      }
      return {
        event_name: event.name.trim(),
        properties,
        occurred_at: event.timestamp === undefined ? new Date().toISOString() : eventDate.toISOString(),
      };
    });

    const supabase = createAdminClient();
    const { data: user, error: userError } = await supabase.from('users')
      .select('id').eq('firebase_uid', identity.uid).maybeSingle();
    if (userError) throw userError;
    if (!user) return jsonResponse({ error: 'User profile not found' }, 404);
    const { error } = await supabase.from('analytics_events').insert(
      events.map((event: Record<string, unknown>) => ({ ...event, user_id: user.id })),
    );
    if (error) throw error;
    return jsonResponse({ accepted: events.length }, 202);
  } catch (error) {
    console.error('analytics function failed:', error);
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Internal server error',
    }, error instanceof FirebaseAuthError ? error.status : 500);
  }
});
