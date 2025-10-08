import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function Support() {
  const router = useRouter();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [selectedCategory, setSelectedCategory] = useState('');
  const [message, setMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    return () => subscription?.remove();
  }, []);

  const supportCategories = [
    { id: 'account', title: 'Account Issues', icon: 'person-outline' },
    { id: 'payment', title: 'Payment Problems', icon: 'card-outline' },
    { id: 'orders', title: 'Order Support', icon: 'receipt-outline' },
    { id: 'technical', title: 'Technical Issues', icon: 'bug-outline' },
    { id: 'general', title: 'General Inquiry', icon: 'help-outline' },
  ];

  const contactMethods = [
    {
      title: 'Call Us',
      subtitle: '+234 800 123 4567',
      icon: 'call',
      action: () => Linking.openURL('tel:+2348001234567'),
    },
    {
      title: 'Email Support',
      subtitle: 'support@brillprime.com',
      icon: 'mail',
      action: () => Linking.openURL('mailto:support@brillprime.com'),
    },
    {
      title: 'Live Chat',
      subtitle: 'Available 24/7',
      icon: 'chatbubble',
      action: () => router.push('/chat'),
    },
  ];

  const handleSubmitTicket = () => {
    if (!selectedCategory || !message.trim()) {
      Alert.alert('Error', 'Please select a category and enter your message.');
      return;
    }

    Alert.alert(
      'Ticket Submitted',
      'Your support ticket has been submitted. We will get back to you within 24 hours.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const styles = getResponsiveStyles(screenData);

  return (
    <LinearGradient colors={['#0B1A51', '#1e3a8a']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Contact Methods */}
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <View style={styles.contactGrid}>
          {contactMethods.map((method, index) => (
            <TouchableOpacity
              key={index}
              style={styles.contactCard}
              onPress={method.action}
            >
              <Ionicons name={method.icon as any} size={24} color="#4682B4" />
              <Text style={styles.contactTitle}>{method.title}</Text>
              <Text style={styles.contactSubtitle}>{method.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Support Categories */}
        <Text style={styles.sectionTitle}>What can we help you with?</Text>
        <View style={styles.categoriesGrid}>
          {supportCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryCard,
                selectedCategory === category.id && styles.selectedCategory,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Ionicons
                name={category.icon as any}
                size={20}
                color={selectedCategory === category.id ? 'white' : '#4682B4'}
              />
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.selectedCategoryText,
                ]}
              >
                {category.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Message Input */}
        <Text style={styles.sectionTitle}>Describe your issue</Text>
        <TextInput
          style={styles.messageInput}
          placeholder="Please describe your issue in detail..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={5}
          value={message}
          onChangeText={setMessage}
          textAlignVertical="top"
        />

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmitTicket}>
          <Text style={styles.submitButtonText}>Submit Support Ticket</Text>
        </TouchableOpacity>

        {/* FAQ Section */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.faqContainer}>
          {[
            {
              question: 'How do I reset my password?',
              answer: 'Go to Sign In > Forgot Password and follow the instructions.',
            },
            {
              question: 'How can I track my order?',
              answer: 'Visit the Orders section in your dashboard to see real-time updates.',
            },
            {
              question: 'What payment methods are accepted?',
              answer: 'We accept cards, bank transfers, and mobile money payments.',
            },
          ].map((faq, index) => (
            <View key={index} style={styles.faqItem}>
              <Text style={styles.faqQuestion}>{faq.question}</Text>
              <Text style={styles.faqAnswer}>{faq.answer}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const getResponsiveStyles = (screenData: any) => {
  const { width, height } = screenData;
  const isTablet = width >= 768;

  return StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: Math.max(50, height * 0.07),
      paddingBottom: 20,
      paddingHorizontal: 20,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: isTablet ? 24 : 20,
      fontWeight: 'bold',
      color: 'white',
    },
    placeholder: {
      width: 40,
    },
    content: {
      flex: 1,
      backgroundColor: 'white',
      borderTopLeftRadius: 25,
      borderTopRightRadius: 25,
      paddingHorizontal: 20,
      paddingTop: 30,
    },
    sectionTitle: {
      fontSize: isTablet ? 20 : 18,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 15,
      marginTop: 20,
    },
    contactGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 15,
      marginBottom: 20,
    },
    contactCard: {
      flex: 1,
      minWidth: width > 600 ? '30%' : '45%',
      backgroundColor: '#f8f9fa',
      padding: 15,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#e9ecef',
    },
    contactTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#333',
      marginTop: 8,
    },
    contactSubtitle: {
      fontSize: 12,
      color: '#666',
      marginTop: 4,
      textAlign: 'center',
    },
    categoriesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 20,
    },
    categoryCard: {
      flex: 1,
      minWidth: width > 600 ? '30%' : '45%',
      backgroundColor: 'white',
      padding: 15,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#4682B4',
    },
    selectedCategory: {
      backgroundColor: '#4682B4',
    },
    categoryText: {
      fontSize: 12,
      color: '#4682B4',
      marginTop: 8,
      textAlign: 'center',
      fontWeight: '500',
    },
    selectedCategoryText: {
      color: 'white',
    },
    messageInput: {
      backgroundColor: '#f8f9fa',
      borderRadius: 12,
      padding: 15,
      fontSize: 16,
      borderWidth: 1,
      borderColor: '#e9ecef',
      minHeight: 120,
      marginBottom: 20,
    },
    submitButton: {
      backgroundColor: '#4682B4',
      borderRadius: 25,
      paddingVertical: 15,
      alignItems: 'center',
      marginBottom: 30,
    },
    submitButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    faqContainer: {
      marginBottom: 30,
    },
    faqItem: {
      backgroundColor: '#f8f9fa',
      padding: 15,
      borderRadius: 12,
      marginBottom: 10,
    },
    faqQuestion: {
      fontSize: 14,
      fontWeight: '600',
      color: '#333',
      marginBottom: 8,
    },
    faqAnswer: {
      fontSize: 13,
      color: '#666',
      lineHeight: 18,
    },
  });
};