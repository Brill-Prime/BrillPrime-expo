
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { communicationService, Conversation } from '../../services/communicationService';

export default function ConversationsScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [screenData, setScreenData] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    const setup = async () => {
      await loadConversations();
      try {
        await communicationService.initializeConnection();
        if (!active) return;
        unsubscribe = communicationService.onMessage((message) => {
          setConversations(prev =>
            prev.map(conv => {
              if (conv.id !== message.conversationId) return conv;
              const currentUserId = conv.participants.find(participant => participant.name === 'You')?.userId;
              return {
                ...conv,
                lastMessage: message,
                unreadCount: message.senderId === currentUserId ? conv.unreadCount : conv.unreadCount + 1,
                updatedAt: message.timestamp,
              };
            })
          );
        });
      } catch (error) {
        console.error('Error initializing communication:', error);
        if (active) Alert.alert('Chat Unavailable', 'Live chat could not be connected.');
      }
    };
    void setup();
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const loadConversations = async () => {
    try {
      const response = await communicationService.getConversations();
      if (!response.success) {
        throw new Error(response.error || 'Failed to load conversations');
      }
      setConversations(response.data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
      Alert.alert('Chat Unavailable', 'Conversations could not be loaded. Pull down to retry.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadConversations();
    } finally {
      setRefreshing(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const messageDate = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p.role !== 'consumer');
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const otherParticipant = getOtherParticipant(item);
    
    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => router.push(`/chat/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: getAvatarColor(otherParticipant?.role) }]}>
            <Text style={styles.avatarText}>
              {otherParticipant?.name.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          {otherParticipant?.online && <View style={styles.onlineIndicator} />}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.participantName} numberOfLines={1}>
              {otherParticipant?.name || 'Unknown'}
            </Text>
            <Text style={styles.timestamp}>
              {item.lastMessage ? formatTime(item.lastMessage.timestamp) : ''}
            </Text>
          </View>
          
          <View style={styles.conversationFooter}>
            <Text style={styles.orderNumber}>Order #{item.orderId}</Text>
            <View style={styles.messagePreview}>
              <Text style={[
                styles.lastMessage,
                item.unreadCount > 0 && styles.unreadMessage
              ]} numberOfLines={1}>
                {item.lastMessage?.senderRole === 'consumer' ? 'You: ' : ''}
                {item.lastMessage?.message || 'No messages yet'}
              </Text>
              {item.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadCount}>
                    {item.unreadCount > 99 ? '99+' : item.unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => {
              Alert.alert('Call', `Call ${otherParticipant?.name}?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Call', onPress: () => console.log('Calling...') }
              ]);
            }}
          >
            <Ionicons name="call" size={20} color="#667eea" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const getAvatarColor = (role?: string) => {
    switch (role) {
      case 'merchant': return '#667eea';
      case 'driver': return '#4CAF50';
      default: return '#999';
    }
  };

  const styles = getResponsiveStyles(screenData);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Conversations List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading conversations...</Text>
        </View>
      ) : conversations.length > 0 ? (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          style={styles.conversationsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubtext}>
            Start chatting with merchants and drivers about your orders
          </Text>
        </View>
      )}
    </View>
  );
}

const getResponsiveStyles = (screenData: any) => {
  const { width, height } = screenData;
  const isTablet = width >= 768;
  const isSmallScreen = width < 350;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f8f9fa',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Math.max(16, width * 0.04),
      paddingTop: Math.max(50, height * 0.07),
      paddingBottom: 16,
      backgroundColor: 'white',
      borderBottomWidth: 1,
      borderBottomColor: '#e9ecef',
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: isTablet ? 24 : isSmallScreen ? 18 : 20,
      fontWeight: 'bold',
      color: '#333',
    },
    placeholder: {
      width: 40,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Math.max(32, width * 0.08),
    },
    emptyText: {
      fontSize: isTablet ? 20 : isSmallScreen ? 16 : 18,
      fontWeight: '600',
      color: '#666',
      marginTop: 16,
      textAlign: 'center',
    },
    emptySubtext: {
      fontSize: isTablet ? 16 : isSmallScreen ? 14 : 15,
      color: '#999',
      marginTop: 8,
      textAlign: 'center',
      lineHeight: 20,
    },
    conversationsList: {
      flex: 1,
    },
    conversationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'white',
      paddingHorizontal: Math.max(16, width * 0.04),
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    avatarContainer: {
      position: 'relative',
      marginRight: 12,
    },
    avatar: {
      width: isTablet ? 50 : 45,
      height: isTablet ? 50 : 45,
      borderRadius: isTablet ? 25 : 22.5,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: isTablet ? 20 : isSmallScreen ? 16 : 18,
      fontWeight: 'bold',
      color: 'white',
    },
    onlineIndicator: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: '#4CAF50',
      borderWidth: 2,
      borderColor: 'white',
    },
    conversationContent: {
      flex: 1,
    },
    conversationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    participantName: {
      fontSize: isTablet ? 18 : isSmallScreen ? 15 : 16,
      fontWeight: '600',
      color: '#333',
      flex: 1,
    },
    timestamp: {
      fontSize: isTablet ? 14 : isSmallScreen ? 11 : 12,
      color: '#999',
    },
    conversationFooter: {
      gap: 4,
    },
    orderNumber: {
      fontSize: isTablet ? 14 : isSmallScreen ? 11 : 12,
      color: '#667eea',
      fontWeight: '500',
    },
    messagePreview: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    lastMessage: {
      fontSize: isTablet ? 15 : isSmallScreen ? 13 : 14,
      color: '#666',
      flex: 1,
    },
    unreadMessage: {
      fontWeight: '600',
      color: '#333',
    },
    unreadBadge: {
      backgroundColor: '#667eea',
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
    },
    unreadCount: {
      fontSize: 12,
      fontWeight: 'bold',
      color: 'white',
    },
    actionButtons: {
      marginLeft: 12,
    },
    callButton: {
      padding: 8,
    },
  });
};
