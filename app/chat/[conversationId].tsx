
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { communicationService, ChatMessage, Conversation } from '../../services/communicationService';

export default function ChatScreen() {
  const router = useRouter();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const [screenData, setScreenData] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    loadConversation();
    loadMessages();
    initializeCommunication();

    return () => {
      communicationService.disconnect();
    };
  }, [conversationId]);

  const loadConversation = async () => {
    // Mock conversation data - replace with actual API call
    const mockConversation: Conversation = {
      id: conversationId!,
      orderId: 'ORDER-123',
      participants: [
        {
          userId: 'user1',
          name: 'John Doe',
          role: 'consumer',
          phone: '+234-801-234-5678',
          online: true,
        },
        {
          userId: 'user2',
          name: 'Lagos Fuel Station',
          role: 'merchant',
          phone: '+234-803-123-4567',
          online: true,
        }
      ],
      unreadCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setConversation(mockConversation);
  };

  const loadMessages = async () => {
    try {
      // Mock messages - replace with actual API call
      const mockMessages: ChatMessage[] = [
        {
          id: '1',
          conversationId: conversationId!,
          senderId: 'user2',
          senderName: 'Lagos Fuel Station',
          senderRole: 'merchant',
          message: 'Hello! Your fuel order is being prepared.',
          messageType: 'text',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          read: true,
        },
        {
          id: '2',
          conversationId: conversationId!,
          senderId: 'user1',
          senderName: 'John Doe',
          senderRole: 'consumer',
          message: 'Great! How long will it take?',
          messageType: 'text',
          timestamp: new Date(Date.now() - 3000000).toISOString(),
          read: true,
        },
        {
          id: '3',
          conversationId: conversationId!,
          senderId: 'user2',
          senderName: 'Lagos Fuel Station',
          senderRole: 'merchant',
          message: 'It should be ready in about 10 minutes. We\'ll notify you when ready for pickup.',
          messageType: 'text',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          read: true,
        }
      ];
      setMessages(mockMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeCommunication = async () => {
    try {
      await communicationService.initializeConnection();
      
      // Subscribe to new messages
      const unsubscribe = communicationService.onMessage((message) => {
        if (message.conversationId === conversationId) {
          setMessages(prev => [...prev, message]);
          // Auto-scroll to bottom
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error initializing communication:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const tempMessage: ChatMessage = {
        id: Date.now().toString(),
        conversationId: conversationId!,
        senderId: 'user1',
        senderName: 'You',
        senderRole: 'consumer',
        message: newMessage.trim(),
        messageType: 'text',
        timestamp: new Date().toISOString(),
        read: false,
      };

      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');

      // Auto-scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Send to backend (mock for now)
      // const response = await communicationService.sendMessage(conversationId!, newMessage.trim());
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const initiateCall = async () => {
    if (!conversation?.participants[1]) return;

    try {
      Alert.alert(
        'Call',
        `Call ${conversation.participants[1].name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Call',
            onPress: async () => {
              // Mock call initiation
              Alert.alert('Calling...', `Calling ${conversation.participants[1].name}`);
              // const response = await communicationService.initiateCall(conversationId!, conversation.participants[1].userId);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error initiating call:', error);
      Alert.alert('Error', 'Failed to initiate call');
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwnMessage = item.senderRole === 'consumer';
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble
        ]}>
          {!isOwnMessage && (
            <Text style={styles.senderName}>{item.senderName}</Text>
          )}
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {item.message}
          </Text>
          <Text style={[
            styles.messageTime,
            isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
          ]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  const styles = getResponsiveStyles(screenData);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading conversation...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            {conversation?.participants.find(p => p.role !== 'consumer')?.name || 'Chat'}
          </Text>
          <Text style={styles.headerSubtitle}>
            Order #{conversation?.orderId}
          </Text>
        </View>

        <TouchableOpacity onPress={initiateCall} style={styles.callButton}>
          <Ionicons name="call" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          multiline
          maxLength={1000}
        />
        <TouchableOpacity 
          onPress={sendMessage}
          style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
          disabled={!newMessage.trim() || sending}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const getResponsiveStyles = (screenData: any) => {
  const { width, height } = screenData;
  const isTablet = width >= 768;
  const isSmallScreen = width < 350;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#667eea',
      paddingHorizontal: Math.max(16, width * 0.04),
      paddingTop: Math.max(50, height * 0.07),
      paddingBottom: 16,
    },
    backButton: {
      padding: 8,
    },
    headerInfo: {
      flex: 1,
      marginLeft: 12,
    },
    headerTitle: {
      fontSize: isTablet ? 18 : isSmallScreen ? 16 : 17,
      fontWeight: 'bold',
      color: '#fff',
    },
    headerSubtitle: {
      fontSize: isTablet ? 14 : isSmallScreen ? 12 : 13,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    callButton: {
      padding: 8,
    },
    messagesList: {
      flex: 1,
    },
    messagesContent: {
      padding: Math.max(16, width * 0.04),
    },
    messageContainer: {
      marginVertical: 4,
    },
    ownMessage: {
      alignItems: 'flex-end',
    },
    otherMessage: {
      alignItems: 'flex-start',
    },
    messageBubble: {
      maxWidth: '80%',
      borderRadius: 16,
      padding: 12,
    },
    ownBubble: {
      backgroundColor: '#667eea',
    },
    otherBubble: {
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: '#e0e0e0',
    },
    senderName: {
      fontSize: isTablet ? 12 : isSmallScreen ? 10 : 11,
      fontWeight: '600',
      color: '#666',
      marginBottom: 4,
    },
    messageText: {
      fontSize: isTablet ? 16 : isSmallScreen ? 14 : 15,
      lineHeight: 20,
    },
    ownMessageText: {
      color: '#fff',
    },
    otherMessageText: {
      color: '#333',
    },
    messageTime: {
      fontSize: isTablet ? 12 : isSmallScreen ? 10 : 11,
      marginTop: 4,
    },
    ownMessageTime: {
      color: 'rgba(255, 255, 255, 0.7)',
    },
    otherMessageTime: {
      color: '#999',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      backgroundColor: '#fff',
      paddingHorizontal: Math.max(16, width * 0.04),
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: '#e0e0e0',
    },
    textInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: '#e0e0e0',
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      maxHeight: 100,
      fontSize: isTablet ? 16 : isSmallScreen ? 14 : 15,
    },
    sendButton: {
      backgroundColor: '#667eea',
      borderRadius: 20,
      padding: 10,
      marginLeft: 8,
    },
    sendButtonDisabled: {
      backgroundColor: '#ccc',
    },
  });
};
