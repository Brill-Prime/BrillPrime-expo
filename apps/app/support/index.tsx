
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { communicationService } from '../../services/communicationService';
import { authService } from '../../services/authService';
import { supabaseService } from '../../services/supabaseService';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved';
  createdAt: string;
  userId: string;
}

export default function SupportScreen() {
  const router = useRouter();
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [supportConversationId, setSupportConversationId] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
    loadFAQs();
    initializeSupportChat();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await authService.getStoredUser();
      setUser(userData);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadFAQs = async () => {
    setLoading(true);
    try {
      if (supabaseService) {
        const { data, error } = await supabaseService.find<FAQ>('faqs', {
          is_active: true
        });

        if (!error && data) {
          setFaqs(data);
        } else {
          // Fallback to static FAQs
          setFaqs(getStaticFAQs());
        }
      } else {
        setFaqs(getStaticFAQs());
      }
    } catch (error) {
      console.error('Error loading FAQs:', error);
      setFaqs(getStaticFAQs());
    } finally {
      setLoading(false);
    }
  };

  const getStaticFAQs = (): FAQ[] => [
    {
      id: '1',
      question: "How do I place an order?",
      answer: "You can place an order by browsing products, adding them to your cart, and completing the checkout process. Make sure you have a valid delivery address set up.",
      category: 'orders'
    },
    {
      id: '2',
      question: "How can I track my order?",
      answer: "Go to 'My Orders' in your dashboard to track all your orders in real-time. You'll receive live updates on your order status and driver location.",
      category: 'orders'
    },
    {
      id: '3',
      question: "What payment methods do you accept?",
      answer: "We accept credit/debit cards, bank transfers, and digital wallets. All payments are processed securely through our payment gateway.",
      category: 'payments'
    },
    {
      id: '4',
      question: "How do I contact customer support?",
      answer: "You can contact us through this support page via live chat, email, or phone during business hours (9AM - 6PM daily).",
      category: 'support'
    },
    {
      id: '5',
      question: "What is your refund policy?",
      answer: "We offer full refunds within 24 hours of order placement if the order hasn't been dispatched. For delivered orders, refunds are processed based on our return policy.",
      category: 'payments'
    }
  ];

  const initializeSupportChat = async () => {
    try {
      await communicationService.initializeConnection();

      // Get or create support conversation
      const conversations = await communicationService.getConversations();
      if (conversations.success && conversations.data) {
        const supportConv = conversations.data.find(
          conv => conv.participants.some(p => p.role === 'support')
        );
        if (supportConv) {
          setSupportConversationId(supportConv.id);
        }
      }
    } catch (error) {
      console.error('Error initializing support chat:', error);
    }
  };

  const handleSubmitMessage = async () => {
    if (!message.trim() || !subject.trim()) {
      Alert.alert("Error", "Please enter both subject and message");
      return;
    }

    setSubmitting(true);
    try {
      // Create support ticket in Supabase
      if (supabaseService && user) {
        const ticketData: Partial<SupportTicket> = {
          subject: subject.trim(),
          message: message.trim(),
          status: 'pending',
          userId: user.id,
          createdAt: new Date().toISOString()
        };

        const { data, error } = await supabaseService.create('support_tickets', ticketData);

        if (error) {
          throw new Error(error.message || 'Failed to create support ticket');
        }

        // Send email notification to support team
        await sendSupportEmail(subject, message);

        Alert.alert(
          "Message Sent",
          "Your message has been sent to our support team. We'll get back to you within 24 hours via email or in-app chat.",
          [{ 
            text: "OK", 
            onPress: () => {
              setMessage('');
              setSubject('');
            }
          }]
        );
      }
    } catch (error: any) {
      console.error('Error submitting message:', error);
      Alert.alert("Error", error.message || "Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const sendSupportEmail = async (subject: string, message: string) => {
    try {
      // This would integrate with your email service (SendGrid, AWS SES, etc.)
      // For now, we'll use a simple mailto link as fallback
      const emailBody = `
User: ${user?.email || 'Unknown'}
Subject: ${subject}

Message:
${message}
      `;

      // In production, this should be handled by a backend API
      console.log('Support ticket created:', { subject, message, user: user?.email });
    } catch (error) {
      console.error('Error sending support email:', error);
    }
  };

  const handlePhoneCall = () => {
    const phoneNumber = '+2348012345678'; // Replace with actual support number
    Alert.alert(
      'Call Support',
      `Call our support team at ${phoneNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            Linking.openURL(`tel:${phoneNumber.replace(/[^0-9+]/g, '')}`);
          }
        }
      ]
    );
  };

  const handleEmail = () => {
    const email = 'support@brillprime.com';
    const subject = 'Support Request';
    const body = user ? `User: ${user.email}\n\n` : '';
    
    Linking.openURL(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const handleLiveChat = async () => {
    try {
      if (!user) {
        Alert.alert('Authentication Required', 'Please sign in to use live chat');
        return;
      }

      // Create or get support conversation
      let conversationId = supportConversationId;

      if (!conversationId) {
        // Create a new support conversation
        if (supabaseService) {
          const { data, error } = await supabaseService.create('conversations', {
            user_id: user.id,
            type: 'support',
            status: 'active',
            created_at: new Date().toISOString()
          });

          if (!error && data) {
            conversationId = data.id;
            setSupportConversationId(conversationId);
          }
        }
      }

      if (conversationId) {
        router.push(`/chat/${conversationId}`);
      } else {
        Alert.alert('Error', 'Unable to start live chat. Please try again.');
      }
    } catch (error) {
      console.error('Error starting live chat:', error);
      Alert.alert('Error', 'Failed to start live chat. Please try email or phone support.');
    }
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
              <Text style={styles.actionSubtext}>9AM - 6PM</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleEmail}>
              <Ionicons name="mail" size={24} color="#2196F3" />
              <Text style={styles.actionText}>Email Us</Text>
              <Text style={styles.actionSubtext}>24/7</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleLiveChat}>
              <Ionicons name="chatbubbles" size={24} color="#FF9800" />
              <Text style={styles.actionText}>Live Chat</Text>
              <Text style={styles.actionSubtext}>Online Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#4682B4" style={styles.loader} />
          ) : (
            faqs.map((faq, index) => (
              <View key={faq.id} style={styles.faqItem}>
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
            ))
          )}
        </View>

        {/* Contact Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send us a message</Text>
          <View style={styles.messageContainer}>
            <TextInput
              style={styles.subjectInput}
              placeholder="Subject"
              value={subject}
              onChangeText={setSubject}
              editable={!submitting}
            />
            <TextInput
              style={styles.messageInput}
              placeholder="Describe your issue or question..."
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!submitting}
            />
            <TouchableOpacity 
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]} 
              onPress={handleSubmitMessage}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Send Message</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Support Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support Hours</Text>
          <View style={styles.hoursContainer}>
            <View style={styles.hourRow}>
              <Text style={styles.dayText}>Monday - Friday</Text>
              <Text style={styles.timeText}>9:00 AM - 6:00 PM</Text>
            </View>
            <View style={styles.hourRow}>
              <Text style={styles.dayText}>Saturday</Text>
              <Text style={styles.timeText}>10:00 AM - 4:00 PM</Text>
            </View>
            <View style={styles.hourRow}>
              <Text style={styles.dayText}>Sunday</Text>
              <Text style={styles.timeText}>Closed</Text>
            </View>
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
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  actionSubtext: {
    marginTop: 4,
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  loader: {
    marginVertical: 20,
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
  subjectInput: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
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
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  hoursContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dayText: {
    fontSize: 14,
    color: '#333',
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});
