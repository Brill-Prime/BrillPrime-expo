
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

    const { userId, documents } = await req.json();

    if (!userId || !documents) {
      throw new Error('Missing required fields');
    }

    // Get user's KYC record
    const { data: kycData, error: kycError } = await supabaseClient
      .from('kyc_verification')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (kycError && kycError.code !== 'PGRST116') {
      throw kycError;
    }

    // Here you would integrate with a third-party KYC service
    // For now, we'll simulate verification
    const verificationResult = {
      status: 'pending',
      documentType: documents.type,
      verifiedAt: null,
    };

    // Update or create KYC record
    const kycUpdate = {
      user_id: userId,
      status: 'pending',
      document_type: documents.type,
      document_number: documents.number,
      document_front_url: documents.frontUrl,
      document_back_url: documents.backUrl,
      selfie_url: documents.selfieUrl,
      submitted_at: new Date().toISOString(),
    };

    if (kycData) {
      const { error: updateError } = await supabaseClient
        .from('kyc_verification')
        .update(kycUpdate)
        .eq('user_id', userId);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabaseClient
        .from('kyc_verification')
        .insert(kycUpdate);

      if (insertError) throw insertError;
    }

    return new Response(
      JSON.stringify({ success: true, status: verificationResult.status }),
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
