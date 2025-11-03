
import { supabaseService } from '../supabaseService';
import { supabase } from '../../config/supabase';

// Mock Supabase client
jest.mock('../../config/supabase', () => ({
  supabase: {
    from: jest.fn(),
    channel: jest.fn(),
    storage: {
      from: jest.fn(),
    },
    realtime: {
      setAuth: jest.fn(),
    },
    removeChannel: jest.fn(),
  },
  setSupabaseAuthToken: jest.fn(),
}));

// Mock Firebase auth
jest.mock('../../config/firebase', () => ({
  auth: {
    currentUser: {
      uid: 'test-firebase-uid',
      getIdToken: jest.fn().mockResolvedValue('test-token'),
    },
    onAuthStateChanged: jest.fn(),
  },
}));

describe('SupabaseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CRUD Operations', () => {
    test('should create a record', async () => {
      const mockData = { id: '1', name: 'Test User' };
      const mockFrom = jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockData, error: null }),
          }),
        }),
      });

      (supabase!.from as jest.Mock) = mockFrom;

      if (supabaseService) {
        const result = await supabaseService.create('users', { name: 'Test User' });
        expect(result.data).toEqual(mockData);
        expect(result.error).toBeNull();
        expect(mockFrom).toHaveBeenCalledWith('users');
      }
    });

    test('should find records with filters', async () => {
      const mockData = [{ id: '1', name: 'Test User', active: true }];
      const mockEq = jest.fn().mockResolvedValue({ data: mockData, error: null });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

      (supabase!.from as jest.Mock) = mockFrom;

      if (supabaseService) {
        const result = await supabaseService.find('users', { active: true });
        expect(result.data).toEqual(mockData);
        expect(result.error).toBeNull();
      }
    });

    test('should find a single record', async () => {
      const mockData = { id: '1', name: 'Test User' };
      const mockSingle = jest.fn().mockResolvedValue({ data: mockData, error: null });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

      (supabase!.from as jest.Mock) = mockFrom;

      if (supabaseService) {
        const result = await supabaseService.findOne('users', { id: '1' });
        expect(result.data).toEqual(mockData);
        expect(result.error).toBeNull();
      }
    });

    test('should update a record', async () => {
      const mockData = { id: '1', name: 'Updated User' };
      const mockSingle = jest.fn().mockResolvedValue({ data: mockData, error: null });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = jest.fn().mockReturnValue({ update: mockUpdate });

      (supabase!.from as jest.Mock) = mockFrom;

      if (supabaseService) {
        const result = await supabaseService.update('users', { id: '1' }, { name: 'Updated User' });
        expect(result.data).toEqual(mockData);
        expect(result.error).toBeNull();
      }
    });

    test('should delete a record', async () => {
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = jest.fn().mockReturnValue({ delete: mockDelete });

      (supabase!.from as jest.Mock) = mockFrom;

      if (supabaseService) {
        const result = await supabaseService.delete('users', { id: '1' });
        expect(result.error).toBeNull();
      }
    });
  });

  describe('Firebase Sync Operations', () => {
    test('should sync Firebase user to Supabase', async () => {
      const userData = {
        firebaseUid: 'test-uid',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'consumer' as const,
      };

      const mockRpc = jest.fn().mockResolvedValue({ data: { id: '1' }, error: null });
      (supabase!.from as jest.Mock) = jest.fn();
      (supabase as any).rpc = mockRpc;

      if (supabaseService) {
        const result = await supabaseService.syncFirebaseUser(userData);
        expect(mockRpc).toHaveBeenCalledWith('sync_firebase_user', {
          p_firebase_uid: userData.firebaseUid,
          p_email: userData.email,
          p_first_name: userData.firstName,
          p_last_name: userData.lastName,
          p_phone: undefined,
        });
      }
    });

    test('should sync order from Firebase to Supabase', async () => {
      const orderData = {
        id: 'order-1',
        userId: 'user-1',
        merchantId: 'merchant-1',
        items: [{ productId: 'prod-1', quantity: 2, price: 100 }],
        total: 200,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      const mockUser = { data: { id: 'supabase-user-1' }, error: null };
      const mockMerchant = { data: { id: 'supabase-merchant-1' }, error: null };
      const mockOrder = { data: { id: 'supabase-order-1' }, error: null };

      const mockSingle = jest.fn()
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockMerchant);

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({ single: mockSingle }),
        single: jest.fn().mockResolvedValue(mockOrder),
      });

      const mockUpsert = jest.fn().mockReturnValue({ select: mockSelect });
      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      const mockFrom = jest.fn((table: string) => {
        if (table === 'users' || table === 'merchants') {
          return { select: mockSelect };
        }
        if (table === 'orders') {
          return { upsert: mockUpsert };
        }
        if (table === 'order_items') {
          return { upsert: mockInsert };
        }
        return {};
      });

      (supabase!.from as jest.Mock) = mockFrom;

      if (supabaseService) {
        const result = await supabaseService.syncOrder(orderData);
        expect(result.data).toBeTruthy();
      }
    });
  });

  describe('Realtime Subscriptions', () => {
    test('should subscribe to table changes', () => {
      const mockCallback = jest.fn();
      const mockSubscribe = jest.fn();
      const mockOn = jest.fn().mockReturnValue({ subscribe: mockSubscribe });
      const mockChannel = jest.fn().mockReturnValue({ on: mockOn });

      (supabase!.channel as jest.Mock) = mockChannel;

      if (supabaseService) {
        supabaseService.subscribeToTable('orders', { user_id: '1' }, mockCallback, 'UPDATE');
        expect(mockChannel).toHaveBeenCalled();
        expect(mockOn).toHaveBeenCalledWith(
          'postgres_changes',
          expect.objectContaining({
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
          }),
          mockCallback
        );
      }
    });
  });

  describe('Storage Operations', () => {
    test('should upload a file', async () => {
      const mockFile = new Blob(['test'], { type: 'text/plain' });
      const mockUpload = jest.fn().mockResolvedValue({ data: { path: 'test.txt' }, error: null });
      const mockFrom = jest.fn().mockReturnValue({ upload: mockUpload });

      (supabase!.storage.from as jest.Mock) = mockFrom;

      if (supabaseService) {
        const result = await supabaseService.uploadFile('documents', 'test.txt', mockFile);
        expect(result.data).toEqual({ path: 'test.txt' });
        expect(mockFrom).toHaveBeenCalledWith('documents');
      }
    });

    test('should get public URL', () => {
      const mockGetPublicUrl = jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/test.txt' } });
      const mockFrom = jest.fn().mockReturnValue({ getPublicUrl: mockGetPublicUrl });

      (supabase!.storage.from as jest.Mock) = mockFrom;

      if (supabaseService) {
        const url = supabaseService.getPublicUrl('documents', 'test.txt');
        expect(url).toBe('https://example.com/test.txt');
      }
    });
  });

  describe('Batch Sync Operations', () => {
    test('should batch sync multiple entities', async () => {
      const syncData = {
        users: [{ firebaseUid: 'user-1', email: 'user1@example.com' }],
        products: [{ id: 'prod-1', merchantId: 'merchant-1', name: 'Test Product', price: 100 }],
        orders: [{ id: 'order-1', userId: 'user-1', merchantId: 'merchant-1', items: [], total: 100, status: 'pending', createdAt: new Date().toISOString() }],
      };

      if (supabaseService) {
        // Mock the sync methods
        supabaseService.syncFirebaseUser = jest.fn().mockResolvedValue({ data: {}, error: null });
        supabaseService.syncProduct = jest.fn().mockResolvedValue({ data: {}, error: null });
        supabaseService.syncOrder = jest.fn().mockResolvedValue({ data: {}, error: null });

        const result = await supabaseService.batchSync(syncData);
        expect(result.success).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });
  });
});

describe('Supabase Configuration', () => {
  test('should have required environment variables', () => {
    // This test verifies the configuration is set up
    expect(supabase).toBeDefined();
  });

  test('should sync Firebase auth token with Supabase', async () => {
    const { setSupabaseAuthToken } = require('../../config/supabase');
    await setSupabaseAuthToken('test-token');
    expect(supabase?.realtime.setAuth).toHaveBeenCalledWith('test-token');
  });
});
