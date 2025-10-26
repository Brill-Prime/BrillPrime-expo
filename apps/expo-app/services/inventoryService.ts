
import { apiClient, ApiResponse } from './api';
import { authService } from './authService';

export interface InventoryItem {
  id: string;
  commodityId: string;
  name: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  unit: string;
  price: number;
  lastRestocked: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface StockAlert {
  id: string;
  commodityId: string;
  commodityName: string;
  currentStock: number;
  minStockLevel: number;
  alertType: 'low_stock' | 'out_of_stock';
  createdAt: string;
}

export interface RestockSuggestion {
  commodityId: string;
  commodityName: string;
  suggestedQuantity: number;
  estimatedCost: number;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

class InventoryService {
  // Get all inventory items
  async getInventory(merchantId: string): Promise<ApiResponse<InventoryItem[]>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.get<InventoryItem[]>(`/api/merchants/${merchantId}/inventory`, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Get low stock alerts
  async getLowStockAlerts(merchantId: string): Promise<ApiResponse<StockAlert[]>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.get<StockAlert[]>(`/api/merchants/${merchantId}/inventory/alerts`, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Get restock suggestions
  async getRestockSuggestions(merchantId: string): Promise<ApiResponse<RestockSuggestion[]>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.get<RestockSuggestion[]>(
      `/api/merchants/${merchantId}/inventory/suggestions`,
      {
        Authorization: `Bearer ${token}`,
      }
    );
  }

  // Update stock levels
  async updateStock(
    merchantId: string,
    commodityId: string,
    quantity: number,
    operation: 'add' | 'subtract' | 'set'
  ): Promise<ApiResponse<InventoryItem>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.put<InventoryItem>(
      `/api/merchants/${merchantId}/inventory/${commodityId}`,
      { quantity, operation },
      {
        Authorization: `Bearer ${token}`,
      }
    );
  }

  // Set stock alert thresholds
  async setStockThresholds(
    merchantId: string,
    commodityId: string,
    minLevel: number,
    maxLevel: number
  ): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.put(
      `/api/merchants/${merchantId}/inventory/${commodityId}/thresholds`,
      { minStockLevel: minLevel, maxStockLevel: maxLevel },
      {
        Authorization: `Bearer ${token}`,
      }
    );
  }

  // Batch update inventory
  async batchUpdateInventory(
    merchantId: string,
    updates: Array<{ commodityId: string; quantity: number; operation: 'add' | 'subtract' | 'set' }>
  ): Promise<ApiResponse<{ updated: number; failed: number }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post(
      `/api/merchants/${merchantId}/inventory/batch-update`,
      { updates },
      {
        Authorization: `Bearer ${token}`,
      }
    );
  }

  // Get inventory statistics
  async getInventoryStats(merchantId: string): Promise<ApiResponse<{
    totalItems: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalValue: number;
    reorderNeeded: number;
  }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.get(`/api/merchants/${merchantId}/inventory/stats`, {
      Authorization: `Bearer ${token}`,
    });
  }
}

export const inventoryService = new InventoryService();
