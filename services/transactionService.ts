import { supabase } from '../config/supabase';
import { apiClient } from './api';

export interface TransactionRecord {
  id: string;
  userId: string;
  orderId?: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  date: string;
  paymentMethod?: string;
}

interface TransactionsResponse {
  payments: TransactionRecord[];
  total: number;
}

export const transactionService = {
  async getMyTransactions(page = 1, limit = 100): Promise<{
    success: boolean;
    transactions?: TransactionRecord[];
    error?: string;
  }> {
    try {
      const response = await apiClient.get<TransactionsResponse>(
        `/functions/v1/transactions?page=${page}&limit=${limit}`
      );
      if (!response.success || !response.data) {
        return { success: false, error: response.error || 'Unable to load transactions' };
      }
      return { success: true, transactions: response.data.payments };
    } catch (error) {
      console.error('Error loading transactions:', error);
      return { success: false, error: String(error) };
    }
  },

  async subscribeToMyTransactions(callback: () => void): Promise<{
    unsubscribe: () => void;
    error?: string;
  }> {
    try {
      const response = await apiClient.get<{ id: string }>('/functions/v1/profile');
      const userId = response.success ? response.data?.id : null;
      if (!userId) return { unsubscribe: () => undefined, error: 'User profile is unavailable' };

      const channel = supabase
        .channel(`user-transactions:${userId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` },
          callback
        )
        .subscribe((status, error) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('Transaction realtime subscription failed:', error || status);
          }
        });

      return { unsubscribe: () => { void supabase.removeChannel(channel); } };
    } catch (error) {
      console.error('Error subscribing to transactions:', error);
      return { unsubscribe: () => undefined, error: String(error) };
    }
  },
};
