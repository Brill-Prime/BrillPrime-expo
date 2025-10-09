// Communication Service
// Handles real-time chat and call functionality

import { apiClient, ApiResponse } from './api';
import { authService } from './authService';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'consumer' | 'merchant' | 'driver';
  message: string;
  messageType: 'text' | 'image' | 'location' | 'system';
  timestamp: string;
  read: boolean;
  // Optional attachments for messages (images/documents)
  attachments?: Array<{
    id: string;
    uri: string;
    name?: string;
    type?: 'image' | 'document';
  }>;
}

export interface Conversation {
  id: string;
  orderId: string;
  participants: Array<{
    userId: string;
    name: string;
    role: 'consumer' | 'merchant' | 'driver';
    phone?: string;
    online: boolean;
  }>;
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CallSession {
  id: string;
  conversationId: string;
  initiatorId: string;
  participantId: string;
  status: 'initiated' | 'ringing' | 'active' | 'ended' | 'missed';
  startTime: string;
  endTime?: string;
  duration?: number;
}

class CommunicationService {
  private websocket: WebSocket | null = null;
  private messageCallbacks: Array<(message: ChatMessage) => void> = [];
  private callCallbacks: Array<(call: CallSession) => void> = [];

  // Initialize WebSocket connection for real-time communication
  async initializeConnection(): Promise<void> {
    const token = await authService.getToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      // Use wss:// for production or ws:// for development
      const wsUrl = `ws://localhost:3000/ws?token=${token}`;
      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        console.log('WebSocket connected');
      };

      this.websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleWebSocketMessage(data);
      };

      this.websocket.onclose = () => {
        console.log('WebSocket disconnected');
        // Attempt to reconnect after 3 seconds
        setTimeout(() => this.initializeConnection(), 3000);
      };

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  }

  private handleWebSocketMessage(data: any): void {
    switch (data.type) {
      case 'new_message':
        this.messageCallbacks.forEach(callback => callback(data.message));
        break;
      case 'call_update':
        this.callCallbacks.forEach(callback => callback(data.call));
        break;
    }
  }

  // Subscribe to message updates
  onMessage(callback: (message: ChatMessage) => void): () => void {
    this.messageCallbacks.push(callback);
    return () => {
      const index = this.messageCallbacks.indexOf(callback);
      if (index > -1) {
        this.messageCallbacks.splice(index, 1);
      }
    };
  }

  // Subscribe to call updates
  onCall(callback: (call: CallSession) => void): () => void {
    this.callCallbacks.push(callback);
    return () => {
      const index = this.callCallbacks.indexOf(callback);
      if (index > -1) {
        this.callCallbacks.splice(index, 1);
      }
    };
  }

  // Get conversations for user
  async getConversations(): Promise<ApiResponse<Conversation[]>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.get<Conversation[]>('/api/conversations', {
      Authorization: `Bearer ${token}`,
    });
  }

  // Get or create conversation for an order
  async getOrCreateConversation(orderId: string): Promise<ApiResponse<Conversation>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post<Conversation>('/api/conversations', { orderId }, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Get messages for a conversation
  async getMessages(conversationId: string, limit: number = 50, offset: number = 0): Promise<ApiResponse<ChatMessage[]>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.get<ChatMessage[]>(
      `/api/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`,
      { Authorization: `Bearer ${token}` }
    );
  }

  // Send a message
  async sendMessage(conversationId: string, message: string, messageType: 'text' | 'image' | 'location' = 'text'): Promise<ApiResponse<ChatMessage>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    const response = await apiClient.post<ChatMessage>(
      `/api/conversations/${conversationId}/messages`,
      { message, messageType },
      { Authorization: `Bearer ${token}` }
    );

    // Send via WebSocket for real-time delivery
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'send_message',
        conversationId,
        message,
        messageType
      }));
    }

    return response;
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId: string): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.put(
      `/api/conversations/${conversationId}/read`,
      {},
      { Authorization: `Bearer ${token}` }
    );
  }

  // Initiate a call
  async initiateCall(conversationId: string, participantId: string): Promise<ApiResponse<CallSession>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    const response = await apiClient.post<CallSession>(
      '/api/calls/initiate',
      { conversationId, participantId },
      { Authorization: `Bearer ${token}` }
    );

    // Send via WebSocket for real-time notification
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'initiate_call',
        conversationId,
        participantId
      }));
    }

    return response;
  }

  // Answer a call
  async answerCall(callId: string): Promise<ApiResponse<CallSession>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.put<CallSession>(
      `/api/calls/${callId}/answer`,
      {},
      { Authorization: `Bearer ${token}` }
    );
  }

  // End call
  async endCall(callId: string): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.put(`/api/calls/${callId}/end`, {}, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Get call history
  async getCallHistory(filters?: {
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<Array<{
    id: string;
    participantId: string;
    participantName: string;
    type: 'audio' | 'video';
    direction: 'incoming' | 'outgoing';
    duration: number;
    status: 'completed' | 'missed' | 'rejected';
    timestamp: string;
  }>>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    let endpoint = '/api/calls/history';
    const queryParams = new URLSearchParams();

    if (filters) {
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.offset) queryParams.append('offset', filters.offset.toString());
    }

    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`;
    }

    return apiClient.get(endpoint, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Mark conversation as read
  async markConversationAsRead(conversationId: string): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.put(`/api/conversations/${conversationId}/read`, {}, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Delete conversation
  async deleteConversation(conversationId: string): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.delete(`/api/conversations/${conversationId}`, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Block user
  async blockUser(userId: string): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.post(`/api/users/${userId}/block`, {}, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Unblock user
  async unblockUser(userId: string): Promise<ApiResponse<{ message: string }>> {
    const token = await authService.getToken();
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    return apiClient.delete(`/api/users/${userId}/block`, {
      Authorization: `Bearer ${token}`,
    });
  }

  // Disconnect WebSocket
  disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.messageCallbacks = [];
    this.callCallbacks = [];
  }
}

export const communicationService = new CommunicationService();