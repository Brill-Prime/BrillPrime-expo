jest.mock('../api', () => ({
  apiClient: { get: jest.fn() },
}));

const mockChannel = {
  on: jest.fn(),
  subscribe: jest.fn(),
};

jest.mock('../../config/supabase', () => ({
  supabase: {
    channel: jest.fn(() => mockChannel),
    removeChannel: jest.fn(),
  },
}));

import { apiClient } from '../api';
import { supabase } from '../../config/supabase';
import { transactionService } from '../transactionService';

describe('transactionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChannel.on.mockReturnValue(mockChannel);
    mockChannel.subscribe.mockReturnValue(mockChannel);
  });

  it('fetches the signed-in user transaction page', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({
      success: true,
      data: { payments: [{ id: 'tx-1', amount: 25, type: 'payment' }], total: 1 },
    });

    const result = await transactionService.getMyTransactions();

    expect(apiClient.get).toHaveBeenCalledWith('/functions/v1/transactions?page=1&limit=100');
    expect(result.success).toBe(true);
    expect(result.transactions).toHaveLength(1);
  });

  it('subscribes to the authenticated user transactions and removes the channel', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: 'user-1' },
    });
    const callback = jest.fn();

    const subscription = await transactionService.subscribeToMyTransactions(callback);
    subscription.unsubscribe();

    expect(apiClient.get).toHaveBeenCalledWith('/functions/v1/profile');
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'transactions', filter: 'user_id=eq.user-1' },
      callback,
    );
    expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
  });
});
