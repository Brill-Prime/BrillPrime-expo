jest.mock('../../config/supabase', () => ({
  supabase: { from: jest.fn() },
}));

jest.mock('../authService', () => ({
  authService: {},
}));

import { supabase } from '../../config/supabase';
import { commodityService, isValidCommodityId } from '../commodityService';

describe('commodity UUID validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(['1', '3', 'sample_1', 'merchant_1'])('rejects placeholder ID %s before querying Supabase', async (id) => {
    expect(isValidCommodityId(id)).toBe(false);
    await expect(commodityService.getCommodityById(id)).resolves.toEqual({
      success: false,
      error: 'A valid commodity ID is required',
    });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('accepts a UUID-shaped commodity ID', () => {
    expect(isValidCommodityId('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
  });
});
