import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { communicationService } from '../../services/communicationService';
import { orderService } from '../../services/orderService';

const PRIMARY_COLOR = 'rgb(11, 26, 81)';
const SECONDARY_COLOR = '#4682B4';

interface Contact {
  id: string;
  name: string;
  role: 'merchant' | 'driver' | 'consumer';
  orderId?: string;
  online?: boolean;
}

export default function NewChatScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'recent' | 'merchants' | 'drivers'>('recent');

  useEffect(() => {
    loadContacts();
  }, [selectedTab]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      
      if (selectedTab === 'recent') {
        // Load recent orders to find contacts
        const ordersResponse = await orderService.getUserOrders({ limit: 20 });
        if (ordersResponse.success && ordersResponse.data?.orders) {
          const recentContacts: Contact[] = [];
          
          ordersResponse.data.orders.forEach((order: any) => {
            if (order.merchantId && order.merchantName) {
              recentContacts.push({
                id: order.merchantId,
                name: order.merchantName,
                role: 'merchant',
                orderId: order.id,
              });
            }
            if (order.driverId && order.driverName) {
              recentContacts.push({
                id: order.driverId,
                name: order.driverName,
                role: 'driver',
                orderId: order.id,
              });
            }
          });
          
          // Remove duplicates
          const uniqueContacts = recentContacts.filter((contact, index, self) =>
            index === self.findIndex((c) => c.id === contact.id)
          );
          
          setContacts(uniqueContacts);
        }
      } else {
        // For merchants/drivers tabs, show placeholder
        setContacts([]);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert('Error', 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (contact: Contact) => {
    try {
      if (!contact.orderId) {
        Alert.alert('Info', 'Please select a contact from a recent order');
        return;
      }

      // Create or get existing conversation
      const response = await communicationService.getOrCreateConversation(contact.orderId);

      if (response.success && response.data) {
        router.push(`/chat/${response.data.id}`);
      } else {
        Alert.alert('Error', response.error || 'Failed to start conversation');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      Alert.alert('Error', 'Failed to start conversation');
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'merchant': return 'storefront-outline';
      case 'driver': return 'car-outline';
      default: return 'person-outline';
    }
  };

  const getAvatarColor = (role: string) => {
    switch (role) {
      case 'merchant': return SECONDARY_COLOR;
      case 'driver': return '#2196F3';
      default: return '#9E9E9E';
    }
  };

  const renderContact = ({ item }: { item: Contact }) => (
    <TouchableOpacity
      style={styles.contactItem}
      onPress={() => handleStartChat(item)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.role) }]}>
          <Ionicons name={getRoleIcon(item.role)} size={24} color="#fff" />
        </View>
        {item.online && <View style={styles.statusIndicator} />}
      </View>

      <View style={styles.contactContent}>
        <Text style={styles.contactName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.contactRole}>
          {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
          {item.orderId && ` • Order #${item.orderId.slice(-8)}`}
        </Text>
      </View>

      <Ionicons name="chatbubble-outline" size={20} color={SECONDARY_COLOR} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={PRIMARY_COLOR} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Chat</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'recent' && styles.activeTab]}
          onPress={() => setSelectedTab('recent')}
        >
          <Text style={[styles.tabText, selectedTab === 'recent' && styles.activeTabText]}>
            Recent Orders
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'merchants' && styles.activeTab]}
          onPress={() => setSelectedTab('merchants')}
        >
          <Text style={[styles.tabText, selectedTab === 'merchants' && styles.activeTabText]}>
            Merchants
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'drivers' && styles.activeTab]}
          onPress={() => setSelectedTab('drivers')}
        >
          <Text style={[styles.tabText, selectedTab === 'drivers' && styles.activeTabText]}>
            Drivers
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contacts List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={SECONDARY_COLOR} />
          <Text style={styles.loadingText}>Loading contacts...</Text>
        </View>
      ) : filteredContacts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No Contacts Found</Text>
          <Text style={styles.emptyText}>
            {selectedTab === 'recent'
              ? 'Start ordering to chat with merchants and drivers'
              : 'No contacts available in this category'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredContacts}
          renderItem={renderContact}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PRIMARY_COLOR,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: SECONDARY_COLOR,
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: SECONDARY_COLOR,
    fontWeight: '600',
  },
  listContent: {
    padding: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 15,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#fff',
  },
  contactContent: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1B1F',
    marginBottom: 4,
  },
  contactRole: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1B1F',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
