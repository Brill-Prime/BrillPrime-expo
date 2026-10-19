import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return jsonResponse({ success: false, error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing required Supabase server configuration.");
    return jsonResponse({ success: false, error: "Merchant service is not configured" }, 500);
  }

  try {
    // The service-role key stays inside this Edge Function. Only explicitly public
    // merchant fields are returned, and inactive merchants are never listed.
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase
      .from("merchants")
      .select(
        "id,business_name,business_type,address,city,state,country,operating_hours,rating,total_reviews,is_verified,is_active,description,latitude,longitude,category"
      )
      .eq("is_active", true)
      .order("business_name", { ascending: true });

    if (error) {
      console.error("Merchant listing query failed:", error.message);
      return jsonResponse({ success: false, error: "Unable to load merchants right now" }, 500);
    }

    return jsonResponse({ success: true, data: data ?? [] });
  } catch (error) {
    console.error("Unexpected merchant listing error:", error instanceof Error ? error.message : "unknown");
    return jsonResponse({ success: false, error: "Unable to load merchants right now" }, 500);
  }
});
