
import { apiClient, ApiResponse } from './api';
import { authService } from './authService';

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
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.get<EscrowTransaction[]>('/api/escrows', {
      Authorization: `Bearer ${token}`,
    });
  }

  // Get escrow details
  async getEscrowDetails(escrowId: number): Promise<ApiResponse<EscrowTransaction>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.get<EscrowTransaction>(`/api/escrows/${escrowId}`, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Release escrow (buyer confirms delivery)
  async releaseEscrow(escrowId: number): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post<{ message: string }>(`/api/escrows/${escrowId}/release`, {}, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Dispute escrow
  async disputeEscrow(escrowId: number, data: {
    reason: string;
    description: string;
  }): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post<{ message: string }>(`/api/escrows/${escrowId}/dispute`, data, {
      Authorization: `Bearer ${token}`,
    });
  }
}

export const escrowService = new EscrowService();
export type { EscrowTransaction };
