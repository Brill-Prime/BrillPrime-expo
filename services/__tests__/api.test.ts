jest.mock('../../config/environment', () => ({
  ENV: {
    apiBaseUrl: 'https://test-project.supabase.co',
    apiTimeout: 1000,
    maxRetries: 1,
  },
  SUPABASE_CONFIG: {
    url: 'https://test-project.supabase.co',
    anonKey: 'test-anon-key',
  },
}));

jest.mock('../../config/firebase', () => ({
  auth: {
    currentUser: {
      uid: 'firebase-user-id',
      getIdToken: jest.fn().mockResolvedValue('firebase-id-token'),
    },
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  multiRemove: jest.fn().mockResolvedValue(undefined),
  multiSet: jest.fn().mockResolvedValue(undefined),
}));

import { apiClient } from '../api';

function makeResponse(status: number, body: string): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: '',
    headers: new Headers(),
    text: jest.fn().mockResolvedValue(body),
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
  } as unknown as Response;
}

describe('ApiClient request reliability', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('does not retry permanent client errors', async () => {
    global.fetch = jest.fn().mockResolvedValue(makeResponse(404, 'missing')) as typeof fetch;

    const result = await apiClient.get('/missing');

    expect(result.success).toBe(false);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('https://test-project.supabase.co/missing');
    const requestHeaders = new Headers(options.headers);
    expect(requestHeaders.get('apikey')).toBe('test-anon-key');
    expect(requestHeaders.get('authorization')).toBe('Bearer firebase-id-token');
    expect(requestHeaders.has('x-firebase-uid')).toBe(false);
  });

  it('retries a transient GET with a fresh abort signal and a bounded retry count', async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(makeResponse(200, '{"ok":true}')) as typeof fetch;

    const request = apiClient.get('/transient');
    await jest.runAllTimersAsync();
    const result = await request;

    expect(result.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    const firstSignal = (global.fetch as jest.Mock).mock.calls[0][1].signal;
    const secondSignal = (global.fetch as jest.Mock).mock.calls[1][1].signal;
    expect(firstSignal).toBeInstanceOf(AbortSignal);
    expect(secondSignal).toBeInstanceOf(AbortSignal);
    expect(secondSignal).not.toBe(firstSignal);
  });

  it('deduplicates concurrent identical GET requests', async () => {
    let resolveFetch: ((response: Response) => void) | undefined;
    global.fetch = jest.fn(() => new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    })) as typeof fetch;

    const first = apiClient.get('/same');
    const second = apiClient.get('/same');
    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(resolveFetch).toBeDefined();
    resolveFetch?.(makeResponse(200, '{"value":1}'));
    const [firstResult, secondResult] = await Promise.all([first, second]);
    expect(firstResult).toEqual(secondResult);
  });
});
