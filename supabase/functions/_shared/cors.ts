// Shared CORS configuration for all Edge Functions
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Max-Age': '86400', // 24 hours
};

// Helper function to handle CORS preflight requests
export function handleCors(request: Request): Response | null {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain',
      } 
    });
  }
  
  // For non-OPTIONS requests, return null to continue with the request
  return null;
}

// Helper to add CORS headers to responses
export function withCors(response: Response): Response {
  const newHeaders = new Headers(response.headers);
  
  // Add CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  
  // Ensure content type is set
  if (!newHeaders.has('Content-Type')) {
    newHeaders.set('Content-Type', 'application/json');
  }
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
