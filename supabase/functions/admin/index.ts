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
    const supabase = createAdminClient();
    const { data: user, error: userError } = await supabase.from('users')
      .select('id, role').eq('firebase_uid', identity.uid).maybeSingle();
    if (userError) throw userError;
    if (!user || user.role !== 'admin') return jsonResponse({ error: 'Admin access required' }, 403);

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return jsonResponse({ error: 'A valid JSON object is required' }, 400);
    }

    const route = new URL(request.url).pathname.split('/').filter(Boolean).slice(3)[0];
    if (route === 'maintenance') {
      if (typeof body.enabled !== 'boolean') return jsonResponse({ error: 'enabled must be a boolean' }, 400);
      if (body.message !== undefined && typeof body.message !== 'string') {
        return jsonResponse({ error: 'message must be a string' }, 400);
      }
      const { error } = await supabase.from('platform_settings').upsert({
        key: 'maintenance_mode',
        value: { enabled: body.enabled, message: body.message || null },
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });
      if (error) throw error;
      return jsonResponse({ status: body.enabled ? 'enabled' : 'disabled' });
    }

    if (route === 'announcements') {
      const title = typeof body.title === 'string' ? body.title.trim() : '';
      const message = typeof body.message === 'string' ? body.message.trim() : '';
      const audienceRoles: Record<string, string[]> = {
        all: ['consumer', 'merchant', 'driver'],
        consumers: ['consumer'],
        merchants: ['merchant'],
        drivers: ['driver'],
      };
      const priority = body.priority;
      if (!title || !message || title.length > 200 || message.length > 5000 ||
        typeof body.targetAudience !== 'string' || !audienceRoles[body.targetAudience] ||
        !['low', 'medium', 'high'].includes(priority)) {
        return jsonResponse({ error: 'Valid title, message, audience, and priority are required' }, 400);
      }

      let sent = 0;
      for (const role of audienceRoles[body.targetAudience]) {
        let offset = 0;
        const pageSize = 500;
        while (true) {
          const { data: users, error: usersError } = await supabase.from('users')
            .select('id').eq('role', role).eq('is_active', true)
            .order('id').range(offset, offset + pageSize - 1);
          if (usersError) throw usersError;
          if (!users?.length) break;

          const { error: insertError } = await supabase.from('notifications').insert(users.map((recipient) => ({
            user_id: recipient.id,
            title,
            message,
            type: 'system',
            role,
            priority,
            data: { announcement: true },
          })));
          if (insertError) throw insertError;
          sent += users.length;
          if (users.length < pageSize) break;
          offset += pageSize;
        }
      }
      return jsonResponse({ sent });
    }

    return jsonResponse({ error: 'Admin endpoint not found' }, 404);
  } catch (error) {
    console.error('admin function failed:', error);
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Internal server error',
    }, error instanceof FirebaseAuthError ? error.status : 500);
  }
});
