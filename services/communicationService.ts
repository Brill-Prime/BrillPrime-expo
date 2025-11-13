// Communication Service - Supabase Powered
// Handles real-time chat using Supabase Realtime

import { supabase } from '../config/supabase';
import { authService } from './authService';
import { RealtimeChannel } from '@supabase/supabase-js';

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

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

class CommunicationService {
  private realtimeChannel: RealtimeChannel | null = null;
  private messageCallbacks: Array<(message: ChatMessage) => void> = [];
  private callCallbacks: Array<(call: CallSession) => void> = [];
  private userCache: Map<string, { full_name: string; role: string }> = new Map();

  // Initialize Supabase Realtime for messaging
  async initializeConnection(): Promise<void> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        console.warn('User not authenticated, skipping realtime connection');
        return;
      }

      // Subscribe to messages table for real-time updates
      this.realtimeChannel = supabase
        .channel('messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {
            this.handleNewMessage(payload.new);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Supabase Realtime connected for messaging');
          }
        });

      console.log('📡 Supabase Realtime initialized');
    } catch (error) {
      console.error('Failed to initialize Supabase Realtime:', error);
    }
  }

  private async handleNewMessage(messageData: any): Promise<void> {
    try {
      // OPTIMIZATION: Check cache first to avoid per-message database lookup
      let sender = this.userCache.get(messageData.sender_id);
      
      if (!sender) {
        // Cache miss - fetch and cache the sender
        const { data: senderData } = await supabase
          .from('users')
          .select('id, full_name, role')
          .eq('id', messageData.sender_id)
          .single();

        if (senderData) {
          sender = { full_name: senderData.full_name, role: senderData.role };
          this.userCache.set(messageData.sender_id, sender);
        }
      }

      if (sender) {
        const chatMessage: ChatMessage = {
          id: messageData.id,
          conversationId: messageData.conversation_id,
          senderId: messageData.sender_id,
          senderName: sender.full_name || 'Unknown',
          senderRole: sender.role,
          message: messageData.message,
          messageType: messageData.message_type || 'text',
          timestamp: messageData.created_at,
          read: messageData.read || false,
          attachments: messageData.attachments ? JSON.parse(messageData.attachments) : undefined,
        };

        // Notify all message callbacks
        this.messageCallbacks.forEach((callback) => callback(chatMessage));
      }
    } catch (error) {
      console.error('Error handling new message:', error);
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

  // Subscribe to call updates (placeholder for future implementation)
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
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get Firebase UID to find user in database
      const firebaseUid = user.uid;

      // Get user from database
      const { data: dbUser } = await supabase
        .from('users')
        .select('id')
        .eq('firebase_uid', firebaseUid)
        .single();

      if (!dbUser) {
        return { success: false, error: 'User not found in database' };
      }

      const userId = dbUser.id;

      // Fetch conversations where user is a participant
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          id,
          order_id,
          consumer_id,
          merchant_id,
          driver_id,
          last_message,
          last_message_at,
          created_at,
          updated_at
        `)
        .or(`consumer_id.eq.${userId},merchant_id.eq.${userId},driver_id.eq.${userId}`)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        return { success: false, error: error.message };
      }

      if (!conversations || conversations.length === 0) {
        return { success: true, data: [] };
      }

      // OPTIMIZATION: Batch-fetch all unique participant IDs
      const allParticipantIds = new Set<string>();
      conversations.forEach(conv => {
        if (conv.consumer_id) allParticipantIds.add(conv.consumer_id);
        if (conv.merchant_id) allParticipantIds.add(conv.merchant_id);
        if (conv.driver_id) allParticipantIds.add(conv.driver_id);
      });

      const { data: allUsers } = await supabase
        .from('users')
        .select('id, full_name, role, phone_number')
        .in('id', Array.from(allParticipantIds));

      const usersMap = new Map(
        (allUsers || []).map(u => [u.id, u])
      );

      // OPTIMIZATION: Batch-fetch unread counts for all conversations
      const conversationIds = conversations.map(c => c.id);
      const { data: unreadMessages } = await supabase
        .from('messages')
        .select('conversation_id')
        .in('conversation_id', conversationIds)
        .eq('read', false)
        .neq('sender_id', userId);

      const unreadCountsMap = new Map<string, number>();
      (unreadMessages || []).forEach(msg => {
        const count = unreadCountsMap.get(msg.conversation_id) || 0;
        unreadCountsMap.set(msg.conversation_id, count + 1);
      });

      // Transform to Conversation format (no more N+1 queries!)
      const formattedConversations = conversations.map((conv) => {
        // Build participants from cached user data
        const participantIds = [conv.consumer_id, conv.merchant_id, conv.driver_id].filter(Boolean);
        const participants = participantIds.map(pId => {
          const user = usersMap.get(pId);
          return {
            userId: pId,
            name: pId === userId ? 'You' : user?.full_name || 'Unknown',
            role: user?.role || 'consumer',
            phone: user?.phone_number,
            online: false,
          };
        });

        return {
          id: conv.id,
          orderId: conv.order_id,
          participants,
          lastMessage: conv.last_message
            ? {
                id: '',
                conversationId: conv.id,
                senderId: '',
                senderName: '',
                senderRole: 'consumer' as const,
                message: conv.last_message,
                messageType: 'text' as const,
                timestamp: conv.last_message_at || conv.updated_at,
                read: false,
              }
            : undefined,
          unreadCount: unreadCountsMap.get(conv.id) || 0,
          createdAt: conv.created_at,
          updatedAt: conv.updated_at,
        };
      });

      return { success: true, data: formattedConversations };
    } catch (error) {
      console.error('Error getting conversations:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get conversations',
      };
    }
  }

  // Get or create conversation for an order
  async getOrCreateConversation(orderId: string): Promise<ApiResponse<Conversation>> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Check if conversation exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (existingConv) {
        // Fetch full conversation details
        const conversations = await this.getConversations();
        const conversation = conversations.data?.find((c) => c.id === existingConv.id);
        return { success: true, data: conversation };
      }

      // Fetch order to get participants
      const { data: order } = await supabase
        .from('orders')
        .select('user_id, merchant_id')
        .eq('id', orderId)
        .single();

      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      // Create new conversation
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({
          order_id: orderId,
          consumer_id: order.user_id,
          merchant_id: order.merchant_id,
          driver_id: null, // Will be set when driver is assigned
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
        return { success: false, error: error.message };
      }

      // Fetch full conversation details
      const conversations = await this.getConversations();
      const conversation = conversations.data?.find((c) => c.id === newConv.id);
      return { success: true, data: conversation };
    } catch (error) {
      console.error('Error getting/creating conversation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get/create conversation',
      };
    }
  }

  // Get messages for a conversation
  async getMessages(
    conversationId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ApiResponse<ChatMessage[]>> {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          message,
          message_type,
          read,
          created_at,
          attachments,
          users!messages_sender_id_fkey (
            full_name,
            role
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching messages:', error);
        return { success: false, error: error.message };
      }

      const formattedMessages: ChatMessage[] = (messages || []).map((msg: any) => ({
        id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        senderName: msg.users?.full_name || 'Unknown',
        senderRole: msg.users?.role || 'consumer',
        message: msg.message,
        messageType: msg.message_type || 'text',
        timestamp: msg.created_at,
        read: msg.read || false,
        attachments: msg.attachments ? JSON.parse(msg.attachments) : undefined,
      }));

      return { success: true, data: formattedMessages };
    } catch (error) {
      console.error('Error getting messages:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get messages',
      };
    }
  }

  // Send a message with optional attachments
  async sendMessage(
    conversationId: string,
    message: string,
    messageType: 'text' | 'image' | 'location' = 'text',
    attachments?: Array<{ id: string; uri: string; name?: string; type?: 'image' | 'document' }>
  ): Promise<ApiResponse<ChatMessage>> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get user ID from database
      const { data: dbUser } = await supabase
        .from('users')
        .select('id, full_name, role')
        .eq('firebase_uid', user.uid)
        .single();

      if (!dbUser) {
        return { success: false, error: 'User not found' };
      }

      // Upload attachments to storage if present
      let uploadedAttachments: Array<{ id: string; uri: string; name?: string; type?: 'image' | 'document' }> = [];
      
      if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          try {
            // For web/base64 URIs, we need to upload to Supabase storage
            if (attachment.uri.startsWith('data:') || attachment.uri.startsWith('http')) {
              const fileName = `${conversationId}/${Date.now()}_${attachment.name || 'attachment'}`;
              const fileExt = attachment.name?.split('.').pop() || 'jpg';
              const filePath = `chat-attachments/${fileName}.${fileExt}`;

              // Convert base64 to blob if needed
              let fileData: Blob;
              if (attachment.uri.startsWith('data:')) {
                const base64Data = attachment.uri.split(',')[1];
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                fileData = new Blob([byteArray], { type: `image/${fileExt}` });
              } else {
                // Fetch the file from URL
                const response = await fetch(attachment.uri);
                fileData = await response.blob();
              }

              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('attachments')
                .upload(filePath, fileData);

              if (uploadError) {
                console.error('Error uploading attachment:', uploadError);
                continue;
              }

              const { data: publicUrlData } = supabase.storage
                .from('attachments')
                .getPublicUrl(filePath);

              uploadedAttachments.push({
                id: attachment.id,
                uri: publicUrlData.publicUrl,
                name: attachment.name,
                type: attachment.type,
              });
            } else {
              // Keep original URI for already uploaded files
              uploadedAttachments.push(attachment);
            }
          } catch (uploadError) {
            console.error('Error processing attachment:', uploadError);
          }
        }
      }

      // Insert message with attachments metadata
      const { data: newMessage, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: dbUser.id,
          message,
          message_type: messageType,
          read: false,
          attachments: uploadedAttachments.length > 0 ? JSON.stringify(uploadedAttachments) : null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return { success: false, error: error.message };
      }

      // Update conversation last_message
      const displayMessage = uploadedAttachments.length > 0 
        ? `📎 ${message || 'Sent an attachment'}` 
        : message;
        
      await supabase
        .from('conversations')
        .update({
          last_message: displayMessage,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      const chatMessage: ChatMessage = {
        id: newMessage.id,
        conversationId: newMessage.conversation_id,
        senderId: dbUser.id,
        senderName: dbUser.full_name || 'Unknown',
        senderRole: dbUser.role,
        message: newMessage.message,
        messageType: newMessage.message_type || 'text',
        timestamp: newMessage.created_at,
        read: false,
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
      };

      return { success: true, data: chatMessage };
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message',
      };
    }
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get user ID from database
      const { data: dbUser } = await supabase
        .from('users')
        .select('id')
        .eq('firebase_uid', user.uid)
        .single();

      if (!dbUser) {
        return { success: false, error: 'User not found' };
      }

      // Mark all messages in conversation as read (except own messages)
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', dbUser.id);

      if (error) {
        console.error('Error marking messages as read:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: { message: 'Messages marked as read' } };
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mark messages as read',
      };
    }
  }

  // Call functionality placeholders (to be implemented later)
  async initiateCall(conversationId: string, participantId: string): Promise<ApiResponse<CallSession>> {
    console.warn('Call functionality not yet implemented with Supabase');
    return { success: false, error: 'Call functionality coming soon' };
  }

  async answerCall(callId: string): Promise<ApiResponse<CallSession>> {
    console.warn('Call functionality not yet implemented with Supabase');
    return { success: false, error: 'Call functionality coming soon' };
  }

  async endCall(callId: string): Promise<ApiResponse<{ message: string }>> {
    console.warn('Call functionality not yet implemented with Supabase');
    return { success: false, error: 'Call functionality coming soon' };
  }

  async getCallHistory(): Promise<ApiResponse<any>> {
    console.warn('Call functionality not yet implemented with Supabase');
    return { success: false, error: 'Call functionality coming soon' };
  }

  // Mark conversation as read (alias for markMessagesAsRead)
  async markConversationAsRead(conversationId: string): Promise<ApiResponse<{ message: string }>> {
    return this.markMessagesAsRead(conversationId);
  }

  // Delete conversation
  async deleteConversation(conversationId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) {
        console.error('Error deleting conversation:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: { message: 'Conversation deleted' } };
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete conversation',
      };
    }
  }

  // Utility methods (placeholders for future features)
  async blockUser(userId: string): Promise<ApiResponse<{ message: string }>> {
    console.warn('Block user functionality not yet implemented');
    return { success: false, error: 'Feature coming soon' };
  }

  async unblockUser(userId: string): Promise<ApiResponse<{ message: string }>> {
    console.warn('Unblock user functionality not yet implemented');
    return { success: false, error: 'Feature coming soon' };
  }

  async getMessageTemplates(): Promise<ApiResponse<any>> {
    console.warn('Message templates not yet implemented');
    return { success: false, error: 'Feature coming soon' };
  }

  async saveMessageTemplate(template: any): Promise<ApiResponse<any>> {
    console.warn('Message templates not yet implemented');
    return { success: false, error: 'Feature coming soon' };
  }

  async sendBroadcastMessage(message: any): Promise<ApiResponse<{ message: string }>> {
    console.warn('Broadcast messaging not yet implemented');
    return { success: false, error: 'Feature coming soon' };
  }

  // Disconnect Supabase Realtime
  disconnect(): void {
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
    this.messageCallbacks = [];
    this.callCallbacks = [];
  }
}

export const communicationService = new CommunicationService();