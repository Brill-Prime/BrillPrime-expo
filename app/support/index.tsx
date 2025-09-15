
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  expanded: boolean;
}

export default function Support() {
  const router = useRouter();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [activeTab, setActiveTab] = useState<'faq' | 'contact' | 'help'>('faq');
  const [searchQuery, setSearchQuery] = useState('');
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [faqs, setFaqs] = useState<FAQItem[]>([
    {
      id: '1',
      question: 'How do I track my order?',
      answer: 'You can track your order by going to "Order History" in the menu and selecting your order. You\'ll see real-time updates on your delivery status.',
      expanded: false
    },
    {
      id: '2',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, debit cards, digital wallets like Apple Pay and Google Pay, and cash on delivery for select areas.',
      expanded: false
    },
    {
      id: '3',
      question: 'How can I cancel or modify my order?',
      answer: 'Orders can be cancelled within 5 minutes of placement. After that, please contact our support team. Modifications depend on the order status.',
      expanded: false
    },
    {
      id: '4',
      question: 'What is your return policy?',
      answer: 'We offer a 30-day return policy for most items. Products must be unused and in original packaging. Some items like perishables cannot be returned.',
      expanded: false
    },
    {
      id: '5',
      question: 'How do I get a refund?',
      answer: 'Refunds are processed within 5-7 business days after we receive your return. The amount will be credited to your original payment method.',
      expanded: false
    },
    {
      id: '6',
      question: 'Do you deliver to my area?',
      answer: 'We deliver to most major cities and towns. Enter your postal code during checkout to check if delivery is available in your area.',
      expanded: false
    }
  ]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    return () => subscription?.remove();
  }, []);

  const toggleFAQ = (id: string) => {
    setFaqs(prev =>
      prev.map(faq =>
        faq.id === id ? { ...faq, expanded: !faq.expanded } : faq
      )
    );
  };

  const handleContactSubmit = () => {
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    Alert.alert(
      'Message Sent',
      'Thank you for contacting us. We\'ll get back to you within 24 hours.',
      [{ text: 'OK', onPress: () => setContactForm({ name: '', email: '', subject: '', message: '' }) }]
    );
  };

  const openExternalLink = (url: string) => {
    Linking.openURL(url);
  };

  const callSupport = () => {
    Linking.openURL('tel:+1234567890');
  };

  const emailSupport = () => {
    Linking.openURL('mailto:support@brillprime.com');
  };

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const styles = getResponsiveStyles(screenData);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'faq' && styles.activeTab]}
          onPress={() => setActiveTab('faq')}
        >
          <Text style={[styles.tabText, activeTab === 'faq' && styles.activeTabText]}>FAQ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'contact' && styles.activeTab]}
          onPress={() => setActiveTab('contact')}
        >
          <Text style={[styles.tabText, activeTab === 'contact' && styles.activeTabText]}>Contact</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'help' && styles.activeTab]}
          onPress={() => setActiveTab('help')}
        >
          <Text style={[styles.tabText, activeTab === 'help' && styles.activeTabText]}>Help</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'faq' && (
          <View>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search FAQs..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* FAQ List */}
            {filteredFAQs.map((faq) => (
              <View key={faq.id} style={styles.faqCard}>
                <TouchableOpacity
                  style={styles.faqQuestion}
                  onPress={() => toggleFAQ(faq.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.questionText}>{faq.question}</Text>
                  <Ionicons
                    name={faq.expanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
                
                {faq.expanded && (
                  <View style={styles.faqAnswer}>
                    <Text style={styles.answerText}>{faq.answer}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {activeTab === 'contact' && (
          <View>
            <View style={styles.quickContactContainer}>
              <Text style={styles.sectionTitle}>Quick Contact</Text>
              <View style={styles.quickContactRow}>
                <TouchableOpacity style={styles.quickContactButton} onPress={callSupport}>
                  <Ionicons name="call" size={24} color="#667eea" />
                  <Text style={styles.quickContactText}>Call Us</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.quickContactButton} onPress={emailSupport}>
                  <Ionicons name="mail" size={24} color="#667eea" />
                  <Text style={styles.quickContactText}>Email Us</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.contactFormContainer}>
              <Text style={styles.sectionTitle}>Send us a message</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Your Name *"
                value={contactForm.name}
                onChangeText={(text) => setContactForm(prev => ({ ...prev, name: text }))}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Your Email *"
                value={contactForm.email}
                onChangeText={(text) => setContactForm(prev => ({ ...prev, email: text }))}
                keyboardType="email-address"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Subject"
                value={contactForm.subject}
                onChangeText={(text) => setContactForm(prev => ({ ...prev, subject: text }))}
              />
              
              <TextInput
                style={[styles.input, styles.messageInput]}
                placeholder="Your Message *"
                value={contactForm.message}
                onChangeText={(text) => setContactForm(prev => ({ ...prev, message: text }))}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
              
              <TouchableOpacity style={styles.submitButton} onPress={handleContactSubmit}>
                <Text style={styles.submitButtonText}>Send Message</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'help' && (
          <View>
            <View style={styles.helpSection}>
              <Text style={styles.sectionTitle}>Help Topics</Text>
              
              <TouchableOpacity style={styles.helpItem}>
                <Ionicons name="bag" size={24} color="#667eea" />
                <Text style={styles.helpItemText}>Order Issues</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.helpItem}>
                <Ionicons name="card" size={24} color="#667eea" />
                <Text style={styles.helpItemText}>Payment Problems</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.helpItem}>
                <Ionicons name="return-up-back" size={24} color="#667eea" />
                <Text style={styles.helpItemText}>Returns & Refunds</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.helpItem}>
                <Ionicons name="person" size={24} color="#667eea" />
                <Text style={styles.helpItemText}>Account Settings</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.helpItem}>
                <Ionicons name="shield-checkmark" size={24} color="#667eea" />
                <Text style={styles.helpItemText}>Privacy & Security</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            </View>

            <View style={styles.resourcesSection}>
              <Text style={styles.sectionTitle}>Resources</Text>
              
              <TouchableOpacity
                style={styles.resourceButton}
                onPress={() => openExternalLink('https://brillprime.com/terms')}
              >
                <Text style={styles.resourceButtonText}>Terms of Service</Text>
                <Ionicons name="open" size={16} color="#667eea" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.resourceButton}
                onPress={() => openExternalLink('https://brillprime.com/privacy')}
              >
                <Text style={styles.resourceButtonText}>Privacy Policy</Text>
                <Ionicons name="open" size={16} color="#667eea" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.resourceButton}
                onPress={() => openExternalLink('https://brillprime.com/community')}
              >
                <Text style={styles.resourceButtonText}>Community Guidelines</Text>
                <Ionicons name="open" size={16} color="#667eea" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
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
      paddingBottom: Math.max(16, height * 0.02),
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
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: 'white',
      paddingHorizontal: Math.max(16, width * 0.04),
    },
    tab: {
      flex: 1,
      paddingVertical: 16,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    activeTab: {
      borderBottomColor: '#667eea',
    },
    tabText: {
      fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
      color: '#666',
      fontWeight: '500',
    },
    activeTabText: {
      color: '#667eea',
      fontWeight: '600',
    },
    content: {
      flex: 1,
      paddingHorizontal: Math.max(16, width * 0.04),
      paddingTop: 16,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'white',
      borderRadius: 12,
      paddingHorizontal: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: '#e9ecef',
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      paddingLeft: 8,
      fontSize: isTablet ? 16 : isSmallScreen ? 14 : 15,
    },
    faqCard: {
      backgroundColor: 'white',
      borderRadius: 12,
      marginBottom: 8,
      overflow: 'hidden',
    },
    faqQuestion: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Math.max(16, width * 0.04),
    },
    questionText: {
      flex: 1,
      fontSize: isTablet ? 16 : isSmallScreen ? 14 : 15,
      fontWeight: '600',
      color: '#333',
      marginRight: 8,
    },
    faqAnswer: {
      paddingHorizontal: Math.max(16, width * 0.04),
      paddingBottom: Math.max(16, width * 0.04),
      borderTopWidth: 1,
      borderTopColor: '#f0f0f0',
    },
    answerText: {
      fontSize: isTablet ? 15 : isSmallScreen ? 13 : 14,
      color: '#666',
      lineHeight: 20,
    },
    sectionTitle: {
      fontSize: isTablet ? 20 : isSmallScreen ? 16 : 18,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 16,
    },
    quickContactContainer: {
      backgroundColor: 'white',
      borderRadius: 12,
      padding: Math.max(16, width * 0.04),
      marginBottom: 16,
    },
    quickContactRow: {
      flexDirection: 'row',
      gap: 12,
    },
    quickContactButton: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 16,
      backgroundColor: '#f8f9fa',
      borderRadius: 8,
    },
    quickContactText: {
      marginTop: 8,
      fontSize: isTablet ? 14 : isSmallScreen ? 10 : 12,
      color: '#667eea',
      fontWeight: '600',
    },
    contactFormContainer: {
      backgroundColor: 'white',
      borderRadius: 12,
      padding: Math.max(16, width * 0.04),
    },
    input: {
      borderWidth: 1,
      borderColor: '#e9ecef',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      marginBottom: 12,
      fontSize: isTablet ? 16 : isSmallScreen ? 14 : 15,
    },
    messageInput: {
      height: isTablet ? 120 : 100,
    },
    submitButton: {
      backgroundColor: '#667eea',
      borderRadius: 8,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 8,
    },
    submitButtonText: {
      color: 'white',
      fontSize: isTablet ? 16 : isSmallScreen ? 14 : 15,
      fontWeight: '600',
    },
    helpSection: {
      backgroundColor: 'white',
      borderRadius: 12,
      padding: Math.max(16, width * 0.04),
      marginBottom: 16,
    },
    helpItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    helpItemText: {
      flex: 1,
      marginLeft: 12,
      fontSize: isTablet ? 16 : isSmallScreen ? 14 : 15,
      color: '#333',
    },
    resourcesSection: {
      backgroundColor: 'white',
      borderRadius: 12,
      padding: Math.max(16, width * 0.04),
    },
    resourceButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    resourceButtonText: {
      fontSize: isTablet ? 16 : isSmallScreen ? 14 : 15,
      color: '#667eea',
      fontWeight: '500',
    },
  });
};
