import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, withCors } from '../_shared/cors.ts';
import { FirebaseAuthError, requireFirebaseIdentity } from '../_shared/firebase-auth.ts';
import { createAdminClient } from '../_shared/supabase-admin.ts';

function jsonResponse(body: unknown, status = 200): Response {
  return withCors(new Response(JSON.stringify(body), { status }));
}

function mapTransaction(row: Record<string, any>) {
  return {
    id: row.id,
    userId: row.user_id,
    orderId: row.order_id || undefined,
    type: row.type === 'order_payment' ? 'payment' : row.type,
    amount: Number(row.amount),
    description: row.description || '',
    status: row.status,
    date: row.created_at,
    paymentMethod: row.payment_method || undefined,
  };
}

serve(async (request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;
  if (request.method !== 'GET') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const identity = await requireFirebaseIdentity(request);
    const supabase = createAdminClient();
    const { data: user, error: userError } = await supabase.from('users')
      .select('id').eq('firebase_uid', identity.uid).maybeSingle();
    if (userError) throw userError;
    if (!user) return jsonResponse({ error: 'User profile not found' }, 404);

    const url = new URL(request.url);
    const segments = url.pathname.split('/').filter(Boolean).slice(3);
    const transactionId = segments[0];
    if (transactionId) {
      const { data, error } = await supabase.from('transactions')
        .select('id, user_id, order_id, amount, type, status, payment_method, description, created_at')
        .eq('id', transactionId).eq('user_id', user.id).maybeSingle();
      if (error) throw error;
      return data ? jsonResponse(mapTransaction(data)) : jsonResponse({ error: 'Transaction not found' }, 404);
    }

    const page = Math.max(1, Number.parseInt(url.searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get('limit') || '20', 10) || 20));
    const { data, error, count } = await supabase.from('transactions')
      .select('id, user_id, order_id, amount, type, status, payment_method, description, created_at', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
    if (error) throw error;
    const total = count || 0;
    return jsonResponse({
      payments: (data || []).map(mapTransaction),
      total,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('transactions function failed:', error);
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Internal server error',
    }, error instanceof FirebaseAuthError ? error.status : 500);
  }
});
