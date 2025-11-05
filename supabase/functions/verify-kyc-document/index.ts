
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Verify admin permissions
    const { data: adminUser } = await supabaseClient
      .from('users')
      .select('role')
      .eq('firebase_uid', user.id)
      .single();

    if (!adminUser || adminUser.role !== 'admin') {
      throw new Error('Insufficient permissions');
    }

    const { documentId, status, reason } = await req.json();

    // Get document details
    const { data: document, error: docError } = await supabaseClient
      .from('kyc_documents')
      .select('*, users!inner(id, email, full_name, role)')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      throw new Error('Document not found');
    }

    // Update document status
    const { error: updateError } = await supabaseClient
      .from('kyc_documents')
      .update({
        verification_status: status,
        rejection_reason: status === 'rejected' ? reason : null,
        verified_by: user.id,
        verified_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (updateError) throw updateError;

    // Check if all documents are approved
    const { data: userDocs } = await supabaseClient
      .from('kyc_documents')
      .select('verification_status')
      .eq('user_id', document.user_id);

    const allApproved = userDocs?.every(doc => doc.verification_status === 'approved');

    // Update user verification level
    if (allApproved) {
      await supabaseClient
        .from('users')
        .update({
          is_verified: true
        })
        .eq('id', document.user_id);
    }

    // Send notification
    await supabaseClient.from('notifications').insert({
      user_id: document.user_id,
      title: status === 'approved' ? 'KYC Document Approved' : 'KYC Document Rejected',
      message: status === 'approved' 
        ? 'Your KYC document has been verified successfully'
        : `Your KYC document was rejected. Reason: ${reason}`,
      type: 'system',
      role: document.users.role,
      data: { document_id: documentId, status: status }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          documentId,
          status,
          userVerified: allApproved
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
