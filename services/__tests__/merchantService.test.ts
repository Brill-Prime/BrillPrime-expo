jest.mock('../api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

import { apiClient } from '../api';
import { merchantService } from '../merchantService';

describe('merchant catalog endpoint mapping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.get as jest.Mock).mockResolvedValue({ success: true, data: [] });
    (apiClient.post as jest.Mock).mockResolvedValue({ success: true, data: {} });
    (apiClient.put as jest.Mock).mockResolvedValue({ success: true, data: {} });
    (apiClient.delete as jest.Mock).mockResolvedValue({ success: true });
  });

  it.each([
    ['merchants', () => merchantService.getMerchants(), '/functions/v1/catalog/merchants'],
    ['merchant details', () => merchantService.getMerchantById('merchant-id'), '/functions/v1/catalog/merchants/merchant-id'],
    ['commodities', () => merchantService.getCommodities(), '/functions/v1/catalog/commodities'],
    [
      'merchant commodities',
      () => merchantService.getMerchantCommodities('merchant-id'),
      '/functions/v1/catalog/merchants/merchant-id/commodities',
    ],
  ])('routes %s to the Supabase catalog function', async (_label, call, endpoint) => {
    await call();

    expect(apiClient.get).toHaveBeenCalledWith(endpoint);
  });

  it('routes merchant management to the Supabase catalog function', async () => {
    await merchantService.createMerchant({ name: 'Shop' });
    await merchantService.updateMerchant('merchant-id', { name: 'Updated Shop' });
    await merchantService.deleteMerchant('merchant-id');
    await merchantService.addCommodity('merchant-id', { name: 'Rice', price: 2 });
    await merchantService.updateCommodity('merchant-id', 'product-id', { price: 3 });
    await merchantService.deleteCommodity('merchant-id', 'product-id');
    await merchantService.updateStoreSettings('merchant-id', { isOpen: true });

    expect(apiClient.post).toHaveBeenCalledWith('/functions/v1/catalog/merchants', { name: 'Shop' });
    expect(apiClient.post).toHaveBeenCalledWith(
      '/functions/v1/catalog/merchants/merchant-id/commodities',
      { name: 'Rice', price: 2 },
    );
    expect(apiClient.put).toHaveBeenCalledWith(
      '/functions/v1/catalog/merchants/merchant-id',
      { name: 'Updated Shop' },
    );
    expect(apiClient.put).toHaveBeenCalledWith(
      '/functions/v1/catalog/merchants/merchant-id/commodities/product-id',
      { price: 3 },
    );
    expect(apiClient.put).toHaveBeenCalledWith(
      '/functions/v1/catalog/merchants/merchant-id/settings',
      { isOpen: true },
    );
    expect(apiClient.delete).toHaveBeenCalledWith('/functions/v1/catalog/merchants/merchant-id');
    expect(apiClient.delete).toHaveBeenCalledWith(
      '/functions/v1/catalog/merchants/merchant-id/commodities/product-id',
    );
  });

  it('routes merchant operations, settings, and reviews to the catalog function', async () => {
    await merchantService.getAnalytics('merchant-id');
    await merchantService.getMerchantOrders('merchant-id', { status: 'pending', limit: 10 });
    await merchantService.getStoreSettings('merchant-id');
    await merchantService.getMerchantReviews('merchant-id');
    await merchantService.submitMerchantReview('merchant-id', { rating: 5, comment: 'Great' });
    await merchantService.getCustomers('merchant-id');

    expect(apiClient.get).toHaveBeenCalledWith('/functions/v1/catalog/merchants/merchant-id/analytics');
    expect(apiClient.get).toHaveBeenCalledWith(
      '/functions/v1/catalog/merchants/merchant-id/orders?status=pending&limit=10',
    );
    expect(apiClient.get).toHaveBeenCalledWith('/functions/v1/catalog/merchants/merchant-id/settings');
    expect(apiClient.get).toHaveBeenCalledWith('/functions/v1/catalog/ratings/user/merchant-id');
    expect(apiClient.get).toHaveBeenCalledWith('/functions/v1/catalog/merchants/merchant-id/customers');
    expect(apiClient.post).toHaveBeenCalledWith('/functions/v1/catalog/ratings', {
      merchantId: 'merchant-id',
      rating: 5,
      comment: 'Great',
    });
  });
});
