
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, withCors } from '../_shared/cors.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return withCors(new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', Allow: 'POST' },
    }));
  }

  return withCors(new Response(JSON.stringify({
    success: false,
    error: 'Electronic payments are not configured. No payment was processed.',
  }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' },
  }));
});
