
<old_str>import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SupportScreen() {
  const router = useRouter();
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  const faqs = [
    {
      question: "How do I place an order?",
      answer: "You can place an order by browsing products, adding them to your cart, and completing the checkout process."
    },
    {
      question: "How can I track my order?",
      answer: "Go to 'My Orders' in your dashboard to track all your orders in real-time."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept credit/debit cards, bank transfers, and digital wallets."
    },
    {
      question: "How do I contact customer support?",
      answer: "You can contact us through this support page, email, or phone during business hours."
    }
  ];

  const handleSubmitMessage = () => {
    if (message.trim()) {
      Alert.alert(
        "Message Sent",
        "Your message has been sent to our support team. We'll get back to you soon!",
        [{ text: "OK", onPress: () => setMessage('') }]
      );
    } else {
      Alert.alert("Error", "Please enter a message");
    }
  };

  const handlePhoneCall = () => {
    Linking.openURL('tel:+1234567890');
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@brillprime.com');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#0c1a2a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get Help</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handlePhoneCall}>
              <Ionicons name="call" size={24} color="#4CAF50" />
              <Text style={styles.actionText}>Call Support</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleEmail}>
              <Ionicons name="mail" size={24} color="#2196F3" />
              <Text style={styles.actionText}>Email Us</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="chatbubbles" size={24} color="#FF9800" />
              <Text style={styles.actionText}>Live Chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {faqs.map((faq, index) => (
            <View key={index} style={styles.faqItem}>
              <TouchableOpacity
                style={styles.faqQuestion}
                onPress={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
              >
                <Text style={styles.questionText}>{faq.question}</Text>
                <Ionicons 
                  name={expandedFAQ === index ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
              {expandedFAQ === index && (
                <Text style={styles.answerText}>{faq.answer}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Contact Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send us a message</Text>
          <View style={styles.messageContainer}>
            <TextInput
              style={styles.messageInput}
              placeholder="Describe your issue or question..."
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmitMessage}>
              <Text style={styles.submitButtonText}>Send Message</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0c1a2a',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0c1a2a',
    marginBottom: 15,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  faqItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  answerText: {
    padding: 15,
    paddingTop: 0,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  messageContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    height: 100,
    marginBottom: 15,
  },
  submitButton: {
    backgroundColor: '#4682B4',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});</old_str>
<new_str>import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Linking,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SupportTicket {
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  lastUpdated: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export default function SupportScreen() {
  const router = useRouter();
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  const [activeTab, setActiveTab] = useState<'help' | 'contact' | 'tickets'>('help');

  useEffect(() => {
    loadTickets();
    
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const loadTickets = async () => {
    try {
      // Mock data - replace with actual API call
      const mockTickets: SupportTicket[] = [
        {
          id: '1',
          subject: 'Payment issue with order #12345',
          status: 'in_progress',
          lastUpdated: '2 hours ago',
          priority: 'high'
        },
        {
          id: '2',
          subject: 'Unable to track delivery',
          status: 'resolved',
          lastUpdated: '1 day ago',
          priority: 'medium'
        }
      ];
      setTickets(mockTickets);
    } catch (error) {
      console.error('Error loading tickets:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTickets();
    setRefreshing(false);
  };

  const categories = [
    { id: 'order', name: 'Order Issues', icon: 'receipt-outline' },
    { id: 'payment', name: 'Payment Problems', icon: 'card-outline' },
    { id: 'delivery', name: 'Delivery Issues', icon: 'car-outline' },
    { id: 'account', name: 'Account Issues', icon: 'person-outline' },
    { id: 'technical', name: 'Technical Support', icon: 'settings-outline' },
    { id: 'other', name: 'Other', icon: 'help-outline' }
  ];

  const faqs = [
    {
      question: "How do I place an order?",
      answer: "Browse products in our marketplace, add items to your cart, and complete the secure checkout process. You can track your order status in real-time.",
      category: "orders"
    },
    {
      question: "How can I track my order?",
      answer: "Go to 'My Orders' in your dashboard to view all orders. Each order shows real-time status updates, estimated delivery time, and driver location when applicable.",
      category: "orders"
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit/debit cards (Visa, MasterCard), bank transfers, Apple Pay, Google Pay, and digital wallet payments. All transactions are secured with 256-bit encryption.",
      category: "payment"
    },
    {
      question: "How do refunds work?",
      answer: "Refunds are processed within 3-5 business days to your original payment method. For order cancellations within 1 hour, refunds are instant.",
      category: "payment"
    },
    {
      question: "Can I modify my order after placing it?",
      answer: "Orders can be modified within 30 minutes of placement if the merchant hasn't started preparing it. Contact support for assistance.",
      category: "orders"
    },
    {
      question: "What if my delivery is late?",
      answer: "We provide real-time tracking and will notify you of any delays. If your order is significantly delayed, you may be eligible for compensation or free redelivery.",
      category: "delivery"
    },
    {
      question: "How do I contact customer support?",
      answer: "You can reach us through this support page, email support@brillprime.com, call +1-234-567-8900, or use our live chat feature available 24/7.",
      category: "general"
    },
    {
      question: "Is my personal information secure?",
      answer: "Yes, we use industry-standard security measures including end-to-end encryption, secure data storage, and regular security audits to protect your information.",
      category: "account"
    }
  ];

  const handleSubmitMessage = async () => {
    if (!subject.trim() || !message.trim() || !selectedCategory) {
      Alert.alert("Error", "Please fill in all fields including category selection");
      return;
    }

    try {
      // Save ticket locally (replace with API call)
      const newTicket: SupportTicket = {
        id: Date.now().toString(),
        subject: subject.trim(),
        status: 'open',
        lastUpdated: 'Just now',
        priority: 'medium'
      };

      const updatedTickets = [newTicket, ...tickets];
      setTickets(updatedTickets);
      await AsyncStorage.setItem('supportTickets', JSON.stringify(updatedTickets));

      Alert.alert(
        "Ticket Created",
        `Your support ticket #${newTicket.id} has been created. Our team will respond within 24 hours.`,
        [{ 
          text: "OK", 
          onPress: () => {
            setMessage('');
            setSubject('');
            setSelectedCategory('');
            setActiveTab('tickets');
          }
        }]
      );
    } catch (error) {
      console.error('Error submitting ticket:', error);
      Alert.alert("Error", "Failed to submit your request. Please try again.");
    }
  };

  const handlePhoneCall = () => {
    Alert.alert(
      "Call Support",
      "Would you like to call our support team?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Call Now", onPress: () => Linking.openURL('tel:+1234567890') }
      ]
    );
  };

  const handleEmail = () => {
    const emailSubject = encodeURIComponent('Support Request - BrillPrime App');
    const emailBody = encodeURIComponent('Please describe your issue here...');
    Linking.openURL(`mailto:support@brillprime.com?subject=${emailSubject}&body=${emailBody}`);
  };

  const handleLiveChat = () => {
    Alert.alert(
      "Live Chat",
      "Live chat feature will redirect you to our support portal.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Continue", onPress: () => Linking.openURL('https://support.brillprime.com/chat') }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#FF9800';
      case 'in_progress': return '#2196F3';
      case 'resolved': return '#4CAF50';
      case 'closed': return '#9E9E9E';
      default: return '#666';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#F44336';
      case 'high': return '#FF5722';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#666';
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'help':
        return (
          <View>
            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Get Immediate Help</Text>
              <View style={styles.quickActions}>
                <TouchableOpacity style={styles.actionButton} onPress={handlePhoneCall}>
                  <Ionicons name="call" size={24} color="#4CAF50" />
                  <Text style={styles.actionText}>Call Support</Text>
                  <Text style={styles.actionSubtext}>24/7 Available</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton} onPress={handleEmail}>
                  <Ionicons name="mail" size={24} color="#2196F3" />
                  <Text style={styles.actionText}>Email Us</Text>
                  <Text style={styles.actionSubtext}>Response in 4h</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton} onPress={handleLiveChat}>
                  <Ionicons name="chatbubbles" size={24} color="#FF9800" />
                  <Text style={styles.actionText}>Live Chat</Text>
                  <Text style={styles.actionSubtext}>Instant Response</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* FAQ Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
              {faqs.map((faq, index) => (
                <View key={index} style={styles.faqItem}>
                  <TouchableOpacity
                    style={styles.faqQuestion}
                    onPress={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                  >
                    <Text style={styles.questionText}>{faq.question}</Text>
                    <Ionicons 
                      name={expandedFAQ === index ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color="#666" 
                    />
                  </TouchableOpacity>
                  {expandedFAQ === index && (
                    <Text style={styles.answerText}>{faq.answer}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        );

      case 'contact':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Create Support Ticket</Text>
            
            {/* Category Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      selectedCategory === category.id && styles.selectedCategoryChip
                    ]}
                    onPress={() => setSelectedCategory(category.id)}
                  >
                    <Ionicons 
                      name={category.icon as any} 
                      size={16} 
                      color={selectedCategory === category.id ? '#fff' : '#666'} 
                    />
                    <Text style={[
                      styles.categoryText,
                      selectedCategory === category.id && styles.selectedCategoryText
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Subject Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Subject *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Brief description of your issue"
                value={subject}
                onChangeText={setSubject}
                maxLength={100}
              />
            </View>

            {/* Message Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Message *</Text>
              <TextInput
                style={[styles.textInput, styles.messageTextInput]}
                placeholder="Please provide detailed information about your issue..."
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={1000}
              />
              <Text style={styles.characterCount}>{message.length}/1000</Text>
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmitMessage}>
              <Ionicons name="send" size={20} color="#fff" style={styles.submitIcon} />
              <Text style={styles.submitButtonText}>Submit Ticket</Text>
            </TouchableOpacity>
          </View>
        );

      case 'tickets':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Support Tickets</Text>
            {tickets.length === 0 ? (
              <View style={styles.emptyTickets}>
                <Ionicons name="ticket-outline" size={64} color="#ccc" />
                <Text style={styles.emptyTitle}>No support tickets</Text>
                <Text style={styles.emptyDescription}>
                  Your support requests will appear here
                </Text>
              </View>
            ) : (
              tickets.map((ticket) => (
                <View key={ticket.id} style={styles.ticketItem}>
                  <View style={styles.ticketHeader}>
                    <View style={styles.ticketInfo}>
                      <Text style={styles.ticketId}>#{ticket.id}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
                        <Text style={styles.statusText}>{ticket.status.toUpperCase()}</Text>
                      </View>
                      <View style={[styles.priorityBadge, { borderColor: getPriorityColor(ticket.priority) }]}>
                        <Text style={[styles.priorityText, { color: getPriorityColor(ticket.priority) }]}>
                          {ticket.priority.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.ticketTime}>{ticket.lastUpdated}</Text>
                  </View>
                  <Text style={styles.ticketSubject}>{ticket.subject}</Text>
                  <TouchableOpacity 
                    style={styles.viewTicketButton}
                    onPress={() => Alert.alert('Coming Soon', 'Ticket details view will be available soon')}
                  >
                    <Text style={styles.viewTicketText}>View Details</Text>
                    <Ionicons name="chevron-forward" size={16} color="#4682B4" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        );

      default:
        return null;
    }
  };

  const responsivePadding = Math.max(20, screenDimensions.width * 0.05);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingHorizontal: responsivePadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#0c1a2a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support Center</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'help' && styles.activeTab]}
          onPress={() => setActiveTab('help')}
        >
          <Ionicons name="help-circle-outline" size={20} color={activeTab === 'help' ? '#4682B4' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'help' && styles.activeTabText]}>Help</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'contact' && styles.activeTab]}
          onPress={() => setActiveTab('contact')}
        >
          <Ionicons name="mail-outline" size={20} color={activeTab === 'contact' ? '#4682B4' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'contact' && styles.activeTabText]}>Contact</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'tickets' && styles.activeTab]}
          onPress={() => setActiveTab('tickets')}
        >
          <Ionicons name="ticket-outline" size={20} color={activeTab === 'tickets' ? '#4682B4' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'tickets' && styles.activeTabText]}>
            Tickets {tickets.length > 0 && `(${tickets.length})`}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={[styles.content, { paddingHorizontal: responsivePadding }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4682B4']}
            tintColor="#4682B4"
          />
        }
      >
        {renderTabContent()}
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0c1a2a',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginHorizontal: 5,
    gap: 5,
  },
  activeTab: {
    backgroundColor: '#f0f7ff',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4682B4',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0c1a2a',
    marginBottom: 20,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  actionSubtext: {
    marginTop: 4,
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  faqItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  answerText: {
    padding: 15,
    paddingTop: 0,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  categoriesContainer: {
    marginBottom: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3f4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    gap: 5,
  },
  selectedCategoryChip: {
    backgroundColor: '#4682B4',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  messageTextInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  submitButton: {
    backgroundColor: '#4682B4',
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  submitIcon: {
    marginRight: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyTickets: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  ticketItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ticketInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  ticketId: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  ticketTime: {
    fontSize: 12,
    color: '#666',
  },
  ticketSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  viewTicketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  viewTicketText: {
    fontSize: 14,
    color: '#4682B4',
    fontWeight: '500',
  },
});</new_str>
