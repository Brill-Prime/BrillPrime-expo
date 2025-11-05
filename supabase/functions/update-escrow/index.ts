
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

    const { escrowId, action, notes, reason } = await req.json();

    // Get escrow details
    const { data: escrow, error: escrowError } = await supabaseClient
      .from('escrow_transactions')
      .select('*, orders(*)')
      .eq('id', escrowId)
      .single();

    if (escrowError || !escrow) {
      throw new Error('Escrow transaction not found');
    }

    let updateData: any = { updated_at: new Date().toISOString() };

    switch (action) {
      case 'release':
        updateData.status = 'RELEASED';
        updateData.released_at = new Date().toISOString();
        
        // Transfer funds to merchant
        await supabaseClient.from('wallet_transactions').insert({
          user_id: escrow.seller_id,
          amount: escrow.amount,
          type: 'CREDIT',
          description: `Escrow release for order #${escrow.order_id}`,
          reference: `escrow-${escrowId}`,
        });
        break;

      case 'refund':
        updateData.status = 'REFUNDED';
        
        // Refund to buyer
        await supabaseClient.from('wallet_transactions').insert({
          user_id: escrow.buyer_id,
          amount: escrow.amount,
          type: 'CREDIT',
          description: `Refund for order #${escrow.order_id}`,
          reference: `escrow-refund-${escrowId}`,
        });
        break;

      case 'dispute':
        updateData.status = 'DISPUTED';
        updateData.disputed_at = new Date().toISOString();
        updateData.dispute_reason = reason;
        break;
    }

    const { error: updateError } = await supabaseClient
      .from('escrow_transactions')
      .update(updateData)
      .eq('id', escrowId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true, message: `Escrow ${action} successful` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
