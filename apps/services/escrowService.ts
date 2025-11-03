
import { supabase } from '../config/supabase';
import { auth } from '../config/firebase';
import { authService } from './authService';

interface EscrowTransaction {
  id: string;
  order_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  status: 'held' | 'released' | 'disputed' | 'refunded';
  released_at?: string;
  created_at: string;
  updated_at: string;
  order?: {
    id: string;
    status: string;
    total_amount: number;
  };
}

class EscrowService {
  // Get escrow transactions for current user
  async getEscrowTransactions(): Promise<{ data: EscrowTransaction[] | null; error: any }> {
    if (!supabase) {
      return { data: null, error: 'Supabase not available' };
    }

    const { data, error } = await supabase
      .from('escrow_transactions')
      .select(`
        *,
        order:orders(id, status, total_amount)
      `)
      .order('created_at', { ascending: false });

    return { data, error };
  }

  // Get escrow details
  async getEscrowDetails(escrowId: string): Promise<{ data: EscrowTransaction | null; error: any }> {
    if (!supabase) {
      return { data: null, error: 'Supabase not available' };
    }

    const { data, error } = await supabase
      .from('escrow_transactions')
      .select(`
        *,
        order:orders(id, status, total_amount)
      `)
      .eq('id', escrowId)
      .single();

    return { data, error };
  }

  // Release escrow (buyer confirms delivery)
  async releaseEscrow(escrowId: string): Promise<{ data: { message: string } | null; error: any }> {
    if (!supabase) {
      return { data: null, error: 'Supabase not available' };
    }

    const { data, error } = await supabase
      .from('escrow_transactions')
      .update({
        status: 'released',
        released_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', escrowId)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: { message: 'Escrow released successfully' }, error: null };
  }

  // Dispute escrow
  async disputeEscrow(escrowId: string, data: {
    reason: string;
    description: string;
  }): Promise<{ data: { message: string } | null; error: any }> {
    if (!supabase) {
      return { data: null, error: 'Supabase not available' };
    }

    // Get current user
    const user = auth.currentUser;
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    // Update escrow status to disputed
    const { data: result, error } = await supabase
      .from('escrow_transactions')
      .update({
        status: 'disputed',
        updated_at: new Date().toISOString()
      })
      .eq('id', escrowId)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    // Store dispute details in disputes table
    const { error: disputeError } = await supabase
      .from('escrow_disputes')
      .insert({
        escrow_transaction_id: escrowId,
        raised_by_user_id: user.uid,
        reason: data.reason,
        description: data.description,
        status: 'open'
      });

    if (disputeError) {
      console.error('Error storing dispute details:', disputeError);
      // Still return success for the main escrow update
    }

    return { data: { message: 'Escrow disputed successfully' }, error: null };
  }
}

export const escrowService = new EscrowService();
export type { EscrowTransaction };
