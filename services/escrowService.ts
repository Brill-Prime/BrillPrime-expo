
import { apiClient, ApiResponse } from './api';

interface EscrowTransaction {
  id: number;
  orderId: number;
  amount: number;
  status: 'PENDING' | 'HELD' | 'RELEASED' | 'DISPUTED' | 'REFUNDED';
  buyerId: number;
  sellerId: number;
  createdAt: string;
  updatedAt: string;
  releasedAt?: string;
  disputedAt?: string;
  order?: {
    id: number;
    status: string;
    totalAmount: number;
  };
}

class EscrowService {
  // Get escrow transactions
  async getEscrowTransactions(): Promise<ApiResponse<EscrowTransaction[]>> {
    return apiClient.get<EscrowTransaction[]>('/api/escrows');
  }

  // Get escrow details
  async getEscrowDetails(escrowId: number): Promise<ApiResponse<EscrowTransaction>> {
    return apiClient.get<EscrowTransaction>(`/api/escrows/${escrowId}`);
  }

  // Release escrow (buyer confirms delivery)
  async releaseEscrow(escrowId: number): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>(`/api/escrows/${escrowId}/release`, {});
  }

  // Dispute escrow
  async disputeEscrow(escrowId: number, data: {
    reason: string;
    description: string;
  }): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>(`/api/escrows/${escrowId}/dispute`, data);
  }
}

export const escrowService = new EscrowService();
export type { EscrowTransaction };
