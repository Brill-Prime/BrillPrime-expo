jest.mock('../api', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

jest.mock('../authService', () => ({
  authService: {
    getToken: jest.fn().mockResolvedValue('firebase-id-token'),
  },
}));

jest.mock('../../config/supabase', () => ({
  supabase: {},
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue('merchant'),
}));

import { apiClient } from '../api';
import { notificationService } from '../notificationService';

describe('NotificationService endpoint mapping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.get as jest.Mock).mockResolvedValue({ success: true, data: { count: 0 } });
  });

  it('requests unread count from the account Edge Function with the selected role', async () => {
    await notificationService.getUnreadCount('merchant');

    expect(apiClient.get).toHaveBeenCalledWith(
      '/functions/v1/account/notifications/unread-count?role=merchant',
      expect.objectContaining({ Authorization: expect.stringContaining('firebase-id-token') }),
    );
  });
});
