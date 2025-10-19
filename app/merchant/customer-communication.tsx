import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAlert } from '../../components/AlertProvider';
import { communicationService } from '../../services/communicationService';
import { merchantService } from '../../services/merchantService';
import { useAuth } from '../../contexts/AuthContext';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  lastOrder: string;
  totalOrders: number;
  totalSpent: number;
  status: 'active' | 'inactive';
  joinDate: string;
  lastContactDate?: string;
}

interface CommunicationTemplate {
  id: string;
  title: string;
  content: string;
  type: 'promotion' | 'order_update' | 'welcome' | 'feedback' | 'announcement';
}

export default function CustomerCommunication() {
  const router = useRouter();
  const { showSuccess, showError } = useAlert();
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // Load real customers from backend
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await merchantService.getCustomers(merchantId);
        if (response.success) {
          setCustomers(response.data);
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };
    fetchCustomers();
  }, [merchantId]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [selectedTab, setSelectedTab] = useState<'customers' | 'templates' | 'broadcast'>('customers');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [messageSubject, setMessageSubject] = useState('');
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    title: '',
    content: '',
    type: 'promotion' as CommunicationTemplate['type']
  });

  useEffect(() => {
    loadCustomers();
    loadTemplates();
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchQuery]);

  const loadCustomers = async () => {
    try {
      const { user } = useAuth();
      const merchantId = user?.merchantId;
      
      if (!merchantId) {
        console.error('No merchant ID available');
        return;
      }

      const response = await merchantService.getCustomers(merchantId);
      if (response.success && response.data) {
        setCustomers(response.data);
      } else {
        showError('Error', 'Failed to load customers');
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      showError('Error', 'Failed to load customers');
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await communicationService.getMessageTemplates();
      if (response.success && response.data) {
        setTemplates(response.data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const filterCustomers = () => {
    let filtered = [...customers];

    if (searchQuery) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery)
      );
    }

    setFilteredCustomers(filtered);
  };

  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const selectAllCustomers = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map(c => c.id));
    }
  };

  const sendMessage = async () => {
    if (!messageSubject.trim() || !messageContent.trim()) {
      showError('Missing Information', 'Please fill in both subject and message content');
      return;
    }

    if (selectedCustomers.length === 0) {
      showError('No Recipients', 'Please select at least one customer');
      return;
    }

    try {
      const response = await communicationService.sendBroadcastMessage({
        subject: messageSubject,
        content: messageContent,
        recipientIds: selectedCustomers
      });

      if (response.success) {
        showSuccess('Message Sent', `Message sent to ${selectedCustomers.length} customer(s)`);
        
        // Reload customers to get updated contact dates
        await loadCustomers();

        // Reset form
        setMessageSubject('');
        setMessageContent('');
        setSelectedCustomers([]);
        setShowMessageModal(false);
      } else {
        showError('Error', response.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showError('Error', 'Failed to send message');
    }
  };

  const saveTemplate = async () => {
    if (!newTemplate.title.trim() || !newTemplate.content.trim()) {
      showError('Missing Information', 'Please fill in both title and content');
      return;
    }

    try {
      const response = await communicationService.saveMessageTemplate(newTemplate);

      if (response.success) {
        showSuccess('Template Saved', 'Communication template saved successfully');
        await loadTemplates();
        setNewTemplate({ title: '', content: '', type: 'promotion' });
        setShowTemplateModal(false);
      } else {
        showError('Error', response.error || 'Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      showError('Error', 'Failed to save template');
    }
  };

  const useTemplate = (template: CommunicationTemplate) => {
    setMessageSubject(template.title);
    setMessageContent(template.content);
    setSelectedTab('broadcast');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getCustomerStatus = (customer: Customer) => {
    const daysSinceLastOrder = Math.floor(
      (Date.now() - new Date(customer.lastOrder).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastOrder <= 7) return { color: '#28a745', text: 'Recent' };
    if (daysSinceLastOrder <= 30) return { color: '#ffc107', text: 'Active' };
    return { color: '#dc3545', text: 'Inactive' };
  };

  const renderCustomerItem = (customer: Customer) => {
    const status = getCustomerStatus(customer);
    const isSelected = selectedCustomers.includes(customer.id);

    return (
      <TouchableOpacity
        key={customer.id}
        style={[styles.customerCard, isSelected && styles.selectedCustomerCard]}
        onPress={() => toggleCustomerSelection(customer.id)}
      >
        <View style={styles.customerHeader}>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{customer.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
              <Text style={styles.statusText}>{status.text}</Text>
            </View>
          </View>
          <View style={styles.selectionIndicator}>
            <Ionicons 
              name={isSelected ? "checkbox" : "square-outline"} 
              size={20} 
              color={isSelected ? "#4682B4" : "#ccc"} 
            />
          </View>
        </View>

        <View style={styles.customerDetails}>
          <Text style={styles.customerEmail}>{customer.email}</Text>
          <Text style={styles.customerPhone}>{customer.phone}</Text>
          <Text style={styles.customerStats}>
            {customer.totalOrders} orders • ₦{customer.totalSpent.toLocaleString()} total
          </Text>
          <Text style={styles.customerDates}>
            Last order: {formatDate(customer.lastOrder)}
            {customer.lastContactDate && ` • Last contact: ${formatDate(customer.lastContactDate)}`}
          </Text>
        </View>

        <View style={styles.customerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/chat/customer_${customer.id}`)}
          >
            <Ionicons name="chatbubble-outline" size={16} color="#4682B4" />
            <Text style={styles.actionText}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('Call Customer', `Call ${customer.name}?`)}
          >
            <Ionicons name="call-outline" size={16} color="#4682B4" />
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTemplateItem = (template: CommunicationTemplate) => (
    <View key={template.id} style={styles.templateCard}>
      <View style={styles.templateHeader}>
        <Text style={styles.templateTitle}>{template.title}</Text>
        <View style={[styles.templateTypeBadge, { backgroundColor: getTemplateTypeColor(template.type) }]}>
          <Text style={styles.templateTypeText}>{template.type.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.templateContent}>{template.content}</Text>
      <TouchableOpacity
        style={styles.useTemplateButton}
        onPress={() => useTemplate(template)}
      >
        <Text style={styles.useTemplateText}>Use Template</Text>
      </TouchableOpacity>
    </View>
  );

  const getTemplateTypeColor = (type: string) => {
    switch (type) {
      case 'promotion': return '#28a745';
      case 'order_update': return '#17a2b8';
      case 'welcome': return '#6f42c1';
      case 'feedback': return '#fd7e14';
      case 'announcement': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#1C1B1F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer Communication</Text>
        <TouchableOpacity onPress={() => setShowMessageModal(true)}>
          <Ionicons name="send" size={24} color="#1C1B1F" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {[
          { key: 'customers', label: 'Customers', icon: 'people' },
          { key: 'templates', label: 'Templates', icon: 'document-text' },
          { key: 'broadcast', label: 'Broadcast', icon: 'megaphone' }
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              selectedTab === tab.key && styles.activeTab
            ]}
            onPress={() => setSelectedTab(tab.key as any)}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={20} 
              color={selectedTab === tab.key ? "#4682B4" : "#666"} 
            />
            <Text style={[
              styles.tabText,
              selectedTab === tab.key && styles.activeTabText
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {selectedTab === 'customers' && (
        <View style={styles.content}>
          {/* Search and Select All */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search customers..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity
              style={styles.selectAllButton}
              onPress={selectAllCustomers}
            >
              <Text style={styles.selectAllText}>
                {selectedCustomers.length === filteredCustomers.length ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Selected Count */}
          {selectedCustomers.length > 0 && (
            <View style={styles.selectedCountContainer}>
              <Text style={styles.selectedCountText}>
                {selectedCustomers.length} customer(s) selected
              </Text>
              <TouchableOpacity onPress={() => setShowMessageModal(true)}>
                <Ionicons name="send" size={20} color="#4682B4" />
              </TouchableOpacity>
            </View>
          )}

          {/* Customers List */}
          <ScrollView style={styles.customersList} showsVerticalScrollIndicator={false}>
            {filteredCustomers.map(renderCustomerItem)}
          </ScrollView>
        </View>
      )}

      {selectedTab === 'templates' && (
        <View style={styles.content}>
          <View style={styles.templatesHeader}>
            <Text style={styles.sectionTitle}>Message Templates</Text>
            <TouchableOpacity
              style={styles.addTemplateButton}
              onPress={() => setShowTemplateModal(true)}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addTemplateText}>Add Template</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.templatesList} showsVerticalScrollIndicator={false}>
            {templates.map(renderTemplateItem)}
          </ScrollView>
        </View>
      )}

      {selectedTab === 'broadcast' && (
        <View style={styles.content}>
          <View style={styles.broadcastContainer}>
            <Text style={styles.sectionTitle}>Send Broadcast Message</Text>

            <TextInput
              style={styles.subjectInput}
              placeholder="Message Subject"
              value={messageSubject}
              onChangeText={setMessageSubject}
            />

            <TextInput
              style={styles.messageInput}
              placeholder="Type your message here..."
              value={messageContent}
              onChangeText={setMessageContent}
              multiline
              numberOfLines={6}
            />

            <Text style={styles.recipientInfo}>
              Recipients: {selectedCustomers.length} customer(s) selected
            </Text>

            <TouchableOpacity
              style={[
                styles.sendButton,
                (!messageSubject.trim() || !messageContent.trim() || selectedCustomers.length === 0) && styles.sendButtonDisabled
              ]}
              onPress={sendMessage}
              disabled={!messageSubject.trim() || !messageContent.trim() || selectedCustomers.length === 0}
            >
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles.sendButtonText}>Send Message</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Message Modal */}
      <Modal
        visible={showMessageModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMessageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Message</Text>
              <TouchableOpacity onPress={() => setShowMessageModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalSubjectInput}
              placeholder="Subject"
              value={messageSubject}
              onChangeText={setMessageSubject}
            />

            <TextInput
              style={styles.modalMessageInput}
              placeholder="Message content"
              value={messageContent}
              onChangeText={setMessageContent}
              multiline
              numberOfLines={4}
            />

            <Text style={styles.modalRecipientInfo}>
              Will be sent to {selectedCustomers.length} customer(s)
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowMessageModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSendButton}
                onPress={sendMessage}
              >
                <Text style={styles.modalSendText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Template Modal */}
      <Modal
        visible={showTemplateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTemplateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Template</Text>
              <TouchableOpacity onPress={() => setShowTemplateModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalSubjectInput}
              placeholder="Template Title"
              value={newTemplate.title}
              onChangeText={(text) => setNewTemplate({...newTemplate, title: text})}
            />

            {/* Template Type Selector */}
            <Text style={styles.typeLabel}>Template Type:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
              {['promotion', 'order_update', 'welcome', 'feedback', 'announcement'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    newTemplate.type === type && styles.selectedTypeButton
                  ]}
                  onPress={() => setNewTemplate({...newTemplate, type: type as any})}
                >
                  <Text style={[
                    styles.typeButtonText,
                    newTemplate.type === type && styles.selectedTypeButtonText
                  ]}>
                    {type.replace('_', ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={styles.modalMessageInput}
              placeholder="Template content"
              value={newTemplate.content}
              onChangeText={(text) => setNewTemplate({...newTemplate, content: text})}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowTemplateModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSendButton}
                onPress={saveTemplate}
              >
                <Text style={styles.modalSendText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#4682B4',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 5,
  },
  activeTabText: {
    color: '#4682B4',
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 10,
    fontSize: 16,
  },
  selectAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#4682B4',
  },
  selectAllText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  selectedCountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#e3f2fd',
  },
  selectedCountText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '600',
  },
  customersList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  customerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  selectedCustomerCard: {
    borderColor: '#4682B4',
    backgroundColor: '#f0f8ff',
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  selectionIndicator: {
    padding: 5,
  },
  customerDetails: {
    marginBottom: 10,
  },
  customerEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  customerStats: {
    fontSize: 12,
    color: '#4682B4',
    fontWeight: '600',
    marginBottom: 2,
  },
  customerDates: {
    fontSize: 12,
    color: '#999',
  },
  customerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 10,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  actionText: {
    fontSize: 12,
    color: '#4682B4',
    marginLeft: 4,
  },
  templatesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addTemplateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#4682B4',
  },
  addTemplateText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 5,
    fontWeight: '600',
  },
  templatesList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  templateCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  templateTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  templateTypeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  templateContent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
  useTemplateButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#4682B4',
  },
  useTemplateText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  broadcastContainer: {
    padding: 15,
  },
  subjectInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#fff',
    height: 120,
    textAlignVertical: 'top',
  },
  recipientInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4682B4',
    paddingVertical: 15,
    borderRadius: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalSubjectInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginHorizontal: 20,
    marginBottom: 15,
  },
  modalMessageInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginHorizontal: 20,
    marginBottom: 15,
    height: 100,
    textAlignVertical: 'top',
  },
  modalRecipientInfo: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  modalSendButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#4682B4',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
  },
  modalSendText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  typeSelector: {
    marginHorizontal: 20,
    marginBottom: 15,
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#f8f9fa',
    marginRight: 8,
  },
  selectedTypeButton: {
    backgroundColor: '#4682B4',
  },
  typeButtonText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600',
  },
  selectedTypeButtonText: {
    color: '#fff',
  },
});