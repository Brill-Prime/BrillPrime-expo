
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Dimensions,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface SupportCategory {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

export default function SupportScreen() {
  const router = useRouter();
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories: SupportCategory[] = [
    { id: 'all', title: 'All Topics', icon: 'apps', description: 'Browse all help topics' },
    { id: 'orders', title: 'Orders', icon: 'cube', description: 'Help with your orders' },
    { id: 'payments', title: 'Payments', icon: 'card', description: 'Payment related queries' },
    { id: 'account', title: 'Account', icon: 'person', description: 'Account management' },
    { id: 'delivery', title: 'Delivery', icon: 'car', description: 'Delivery tracking & issues' },
  ];

  const faqs: FAQ[] = [
    {
      id: '1',
      category: 'orders',
      question: 'How do I track my order?',
      answer: 'You can track your order in real-time from the "My Orders" section. Click on any active order to see its current status and location on the map.',
    },
    {
      id: '2',
      category: 'orders',
      question: 'Can I cancel my order?',
      answer: 'Yes, you can cancel your order before it\'s picked up by the driver. Go to "My Orders", select the order, and tap "Cancel Order".',
    },
    {
      id: '3',
      category: 'payments',
      question: 'What payment methods are accepted?',
      answer: 'We accept Credit/Debit Cards, Bank Transfers, and Cash on Delivery for most orders.',
    },
    {
      id: '4',
      category: 'payments',
      question: 'How do refunds work?',
      answer: 'Refunds are processed within 5-7 business days to your original payment method. You can request a refund from the order details page.',
    },
    {
      id: '5',
      category: 'account',
      question: 'How do I update my profile?',
      answer: 'Go to Settings > Profile to update your personal information, contact details, and preferences.',
    },
    {
      id: '6',
      category: 'delivery',
      question: 'What is the delivery time?',
      answer: 'Standard delivery takes 30-45 minutes. You can track your delivery in real-time once a driver is assigned.',
    },
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleContactSupport = (method: 'email' | 'phone' | 'chat') => {
    switch (method) {
      case 'email':
        Linking.openURL('mailto:support@brillprime.com');
        break;
      case 'phone':
        Linking.openURL('tel:+2348012345678');
        break;
      case 'chat':
        router.push('/messages');
        break;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0B1A51', '#1e3a8a']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for help..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>

        {/* Quick Contact Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Contact</Text>
          <View style={styles.contactOptions}>
            <TouchableOpacity 
              style={styles.contactCard}
              onPress={() => handleContactSupport('phone')}
            >
              <View style={styles.contactIconContainer}>
                <Ionicons name="call" size={24} color="#4682B4" />
              </View>
              <Text style={styles.contactLabel}>Call Us</Text>
              <Text style={styles.contactSubtext}>Available 24/7</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.contactCard}
              onPress={() => handleContactSupport('email')}
            >
              <View style={styles.contactIconContainer}>
                <Ionicons name="mail" size={24} color="#4682B4" />
              </View>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactSubtext}>Response in 24hrs</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.contactCard}
              onPress={() => handleContactSupport('chat')}
            >
              <View style={styles.contactIconContainer}>
                <Ionicons name="chatbubbles" size={24} color="#4682B4" />
              </View>
              <Text style={styles.contactLabel}>Live Chat</Text>
              <Text style={styles.contactSubtext}>Chat with us</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoriesRow}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category.id && styles.categoryChipActive,
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Ionicons
                    name={category.icon}
                    size={20}
                    color={selectedCategory === category.id ? '#fff' : '#4682B4'}
                  />
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategory === category.id && styles.categoryChipTextActive,
                    ]}
                  >
                    {category.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* FAQs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq) => (
              <TouchableOpacity
                key={faq.id}
                style={styles.faqCard}
                onPress={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <Ionicons
                    name={expandedFAQ === faq.id ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#666"
                  />
                </View>
                {expandedFAQ === faq.id && (
                  <Text style={styles.faqAnswer}>{faq.answer}</Text>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="help-circle-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No FAQs found</Text>
              <Text style={styles.emptySubtext}>Try a different search or category</Text>
            </View>
          )}
        </View>

        {/* Still Need Help Section */}
        <View style={styles.section}>
          <View style={styles.helpCard}>
            <Ionicons name="headset" size={32} color="#4682B4" />
            <Text style={styles.helpCardTitle}>Still need help?</Text>
            <Text style={styles.helpCardText}>
              Our support team is here to assist you 24/7
            </Text>
            <TouchableOpacity 
              style={styles.helpButton}
              onPress={() => handleContactSupport('chat')}
            >
              <Text style={styles.helpButtonText}>Contact Support</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 20,
    marginBottom: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  contactOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  contactCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  contactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  contactSubtext: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#4682B4',
  },
  categoryChipActive: {
    backgroundColor: '#4682B4',
    borderColor: '#4682B4',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4682B4',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  faqCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 4,
  },
  helpCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  helpCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
  helpCardText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  helpButton: {
    backgroundColor: '#4682B4',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
  },
  helpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
