
import { apiClient, ApiResponse } from './api';

class WebhookService {
  // Handle Paystack webhook events (called internally by edge function)
  async handlePaystackEvent(event: {
    event: string;
    data: any;
  }): Promise<ApiResponse<any>> {
    // This is typically handled by the backend edge function
    // But we can use this to process webhook responses
    console.log('Paystack webhook event:', event);
    
    switch (event.event) {
      case 'charge.success':
        return this.handleSuccessfulCharge(event.data);
      case 'charge.failed':
        return this.handleFailedCharge(event.data);
      case 'transfer.success':
        return this.handleSuccessfulTransfer(event.data);
      case 'transfer.failed':
        return this.handleFailedTransfer(event.data);
      default:
        console.log('Unhandled webhook event:', event.event);
        return { success: true, data: { message: 'Event acknowledged' } };
    }
  }

  private async handleSuccessfulCharge(data: any): Promise<ApiResponse<any>> {
    console.log('Payment successful:', data.reference);
    // Update local state, show success notification, etc.
    return { success: true, data: { message: 'Payment processed successfully' } };
  }

  private async handleFailedCharge(data: any): Promise<ApiResponse<any>> {
    console.log('Payment failed:', data.reference);
    // Show error notification, update UI, etc.
    return { success: true, data: { message: 'Payment failed notification sent' } };
  }

  private async handleSuccessfulTransfer(data: any): Promise<ApiResponse<any>> {
    console.log('Transfer successful:', data.reference);
    return { success: true, data: { message: 'Transfer processed successfully' } };
  }

  private async handleFailedTransfer(data: any): Promise<ApiResponse<any>> {
    console.log('Transfer failed:', data.reference);
    return { success: true, data: { message: 'Transfer failed notification sent' } };
  }

  // Get webhook logs (if you add this to your edge function)
  async getWebhookLogs(limit: number = 50): Promise<ApiResponse<any[]>> {
    return apiClient.get(`/functions/v1/paystack-webhook?action=logs&limit=${limit}`);
  }
}

export const webhookService = new WebhookService();
