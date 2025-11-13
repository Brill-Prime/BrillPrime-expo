import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AttachmentUploader, { Attachment } from '../../components/AttachmentUploader';
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
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showAttachmentUploader, setShowAttachmentUploader] = useState(false);

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
    try {
      const response = await communicationService.getOrCreateConversation(conversationId as string);
      if (response.success && response.data) {
        setConversation(response.data as Conversation);
      } else {
        console.warn('Failed to load conversation from API, using placeholder');
        setConversation(null);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      setConversation(null);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await communicationService.getMessages(conversationId as string, 100, 0);
      if (response.success && Array.isArray(response.data)) {
        setMessages(response.data as ChatMessage[]);
      } else {
        console.warn('No messages from API');
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading messages from API:', error);
      setMessages([]);
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
    if (newMessage.trim() || attachments.length > 0) {
      setSending(true);
      
      try {
        // Determine message type based on attachments
        let messageType: 'text' | 'image' | 'location' = 'text';
        if (attachments.length > 0 && attachments[0].type === 'image') {
          messageType = 'image';
        }

        // Create optimistic message for UI
        const optimisticMessage: ChatMessage = {
          id: Date.now().toString(),
          conversationId: conversationId!,
          senderId: 'user1',
          senderName: 'You',
          senderRole: 'consumer',
          message: newMessage.trim(),
          messageType,
          timestamp: new Date().toISOString(),
          read: false,
          attachments: attachments.length > 0 ? [...attachments] : undefined,
        };

        setMessages(prev => [...prev, optimisticMessage]);
        const messageText = newMessage.trim();
        const messageAttachments = [...attachments];
        
        setNewMessage('');
        setAttachments([]);
        setShowAttachmentUploader(false);

        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);

        // Send to backend with attachments
        const response = await communicationService.sendMessage(
          conversationId as string,
          messageText || '📎 Attachment',
          messageType,
          messageAttachments
        );
        
        if (!response.success) {
          console.warn('Failed to send message to backend:', response.error);
          Alert.alert('Error', 'Failed to send message. Please try again.');
          // Remove optimistic message on failure
          setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
        }
      } catch (error) {
        console.error('Error sending message:', error);
        Alert.alert('Error', 'Failed to send message. Please try again.');
      } finally {
        setSending(false);
      }
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
              try {
                const participantId = conversation?.participants[1].userId;
                if (!participantId) {
                  Alert.alert('Error', 'Participant not available');
                  return;
                }

                const response = await communicationService.initiateCall(conversationId as string, participantId);
                if (response.success && response.data) {
                  Alert.alert('Calling...', `Calling ${conversation.participants[1].name}`);
                } else {
                  Alert.alert('Error', 'Failed to initiate call');
                }
              } catch (error) {
                console.error('Initiate call error:', error);
                Alert.alert('Error', 'Failed to initiate call');
              }
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
          {item.message && (
            <Text style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText
            ]}>
              {item.message}
            </Text>
          )}

          {item.attachments && item.attachments.length > 0 && (
            <View style={styles.messageAttachments}>
              {item.attachments.map((attachment: { id: string; uri: string; name?: string; type?: 'image' | 'document' }) => (
                <View key={attachment.id} style={styles.messageAttachment}>
                  {attachment.type === 'image' ? (
                    <Image source={{ uri: attachment.uri }} style={styles.messageImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.messageDocument}>
                      <Ionicons name="document" size={20} color="#4682B4" />
                      <Text style={styles.documentName} numberOfLines={1}>
                        {attachment.name || 'Attachment'}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

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

      {/* Attachment Uploader */}
      {showAttachmentUploader && (
        <View style={styles.attachmentSection}>
          <AttachmentUploader
            attachments={attachments}
            onAttachmentsChange={setAttachments}
            maxAttachments={3}
            allowedTypes={['image', 'document']}
            maxFileSize={5}
            placeholder="Add images or documents"
            style={styles.chatAttachmentUploader}
          />
        </View>
      )}

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TouchableOpacity
            style={styles.attachmentButton}
            onPress={() => setShowAttachmentUploader(!showAttachmentUploader)}
          >
            <Ionicons
              name={showAttachmentUploader ? "close" : "attach"}
              size={20}
              color="#4682B4"
            />
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() && attachments.length === 0) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim() && attachments.length === 0}
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {attachments.length > 0 && (
          <Text style={styles.attachmentCount}>
            {attachments.length} attachment{attachments.length > 1 ? 's' : ''} selected
          </Text>
        )}
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
      flexDirection: 'column',
      backgroundColor: '#fff',
      paddingHorizontal: Math.max(16, width * 0.04),
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: '#e0e0e0',
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
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
      backgroundColor: '#4682B4',
      borderRadius: 20,
      padding: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonDisabled: {
      backgroundColor: '#ccc',
    },
    attachmentButton: {
      padding: 8,
      marginRight: 8,
    },
    attachmentSection: {
      backgroundColor: 'white',
      padding: 15,
      borderTopWidth: 1,
      borderTopColor: '#eee',
    },
    chatAttachmentUploader: {
      marginVertical: 0,
    },
    attachmentCount: {
      fontSize: 12,
      color: '#4682B4',
      marginTop: 5,
      marginLeft: 40,
      fontFamily: 'Montserrat-Regular',
    },
    messageAttachments: {
      marginTop: 8,
      marginBottom: 4,
    },
    messageAttachment: {
      marginBottom: 8,
    },
    messageImage: {
      width: 200,
      height: 150,
      borderRadius: 8,
    },
    messageDocument: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(70, 130, 180, 0.1)',
      padding: 8,
      borderRadius: 8,
      maxWidth: 200,
    },
    documentName: {
      marginLeft: 8,
      fontSize: 12,
      color: '#4682B4',
      flex: 1,
      fontFamily: 'Montserrat-Regular',
    },
  });
};