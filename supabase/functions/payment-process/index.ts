// Fail-closed payment endpoint.
//
// IMPORTANT: Do not create or mark transactions as paid until a real payment
// provider integration verifies the transaction server-side. This endpoint is
// intentionally unavailable until Paystack (or another approved provider) is
// integrated with signature verification, amount/currency checks, idempotency,
// and verified webhooks. Never trust a client-supplied "success" value.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });
}

Deno.serve((req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ success: false, error: "Method not allowed" }, 405);
  }

  // Fail closed: do not insert transactions or update order payment status.
  // Re-enable only after provider verification and end-to-end tests are complete.
  return jsonResponse({
    success: false,
    code: "PAYMENT_PROVIDER_NOT_CONFIGURED",
    error: "Payments are temporarily unavailable while secure payment verification is being configured. No payment was processed.",
  }, 503);
});
