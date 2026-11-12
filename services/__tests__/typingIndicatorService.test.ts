jest.mock('../../config/supabase', () => {
  const channel = {
    subscribe: jest.fn(),
    send: jest.fn().mockResolvedValue('ok'),
    unsubscribe: jest.fn().mockResolvedValue('ok'),
    on: jest.fn(),
  };

  return {
    supabase: {
      channel: jest.fn(() => channel),
      removeChannel: jest.fn().mockResolvedValue('ok'),
    },
    __mockChannel: channel,
  };
});

import { typingIndicatorService } from '../typingIndicatorService';

const mockChannel = jest.requireMock('../../config/supabase').__mockChannel;
let notifyStatus: ((status: string, error?: Error) => void) | undefined;

describe('TypingIndicatorService channel readiness', () => {
  beforeEach(() => {
    notifyStatus = undefined;
    mockChannel.subscribe.mockImplementation((callback: typeof notifyStatus) => {
      notifyStatus = callback;
      return mockChannel;
    });
  });

  afterEach(async () => {
    await typingIndicatorService.cleanup();
    jest.clearAllMocks();
  });

  it('does not send a broadcast until the channel has joined', async () => {
    const sending = typingIndicatorService.sendTypingIndicator(
      'conversation-1',
      'user-1',
      'User',
      true
    );

    await Promise.resolve();
    expect(mockChannel.send).not.toHaveBeenCalled();

    notifyStatus?.('SUBSCRIBED');
    await expect(sending).resolves.toBeUndefined();
    expect(mockChannel.send).toHaveBeenCalledWith({
      type: 'broadcast',
      event: 'typing',
      payload: expect.objectContaining({
        conversationId: 'conversation-1',
        userId: 'user-1',
        isTyping: true,
      }),
    });
  });

  it('rejects initialization and removes the channel on join failure', async () => {
    const initializing = typingIndicatorService.initialize('conversation-2');
    notifyStatus?.('CHANNEL_ERROR', new Error('not authorized'));

    await expect(initializing).rejects.toThrow(
      'Typing channel failed to join (CHANNEL_ERROR): not authorized'
    );
    expect(
      jest.requireMock('../../config/supabase').supabase.removeChannel
    ).toHaveBeenCalled();
  });
});
