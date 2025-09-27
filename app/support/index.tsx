
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

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  expanded: boolean;
}

export default function Support() {
  const router = useRouter();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [message, setMessage] = useState('');
  const [faqs, setFaqs] = useState<FAQItem[]>([
    {
      id: '1',
      question: 'How do I place an order?',
      answer: 'You can place an order by browsing products, adding items to your cart, and proceeding to checkout. Make sure to provide accurate delivery information.',
      expanded: false
    },
    {
      id: '2',
      question: 'What payment methods do you accept?',
      answer: 'We accept various payment methods including bank transfers, card payments, and mobile money. All transactions are secure and encrypted.',
      expanded: false
    },
    {
      id: '3',
      question: 'How can I track my order?',
      answer: 'You can track your order in real-time through the "My Orders" section. You\'ll receive notifications about order status updates.',
      expanded: false
    },
    {
      id: '4',
      question: 'What is your refund policy?',
      answer: 'We offer refunds for damaged or incorrect items. Contact support within 24 hours of delivery to initiate a refund request.',
      expanded: false
    },
    {
      id: '5',
      question: 'How do I become a merchant?',
      answer: 'You can register as a merchant by selecting the merchant role during signup and completing the KYC verification process.',
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
    setFaqs(prev => prev.map(faq => 
      faq.id === id ? { ...faq, expanded: !faq.expanded } : faq
    ));
  };

  const sendMessage = () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter your message');
      return;
    }

    Alert.alert(
      'Message Sent',
      'Thank you for contacting us! We will get back to you within 24 hours.',
      [
        {
          text: 'OK',
          onPress: () => setMessage('')
        }
      ]
    );
  };

  const callSupport = () => {
    const phoneNumber = '+2348012345678';
    Alert.alert(
      'Call Support',
      `Would you like to call our support team?\n${phoneNumber}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          onPress: () => {
            const phoneUrl = `tel:${phoneNumber}`;
            Linking.canOpenURL(phoneUrl).then((supported) => {
              if (supported) {
                Linking.openURL(phoneUrl);
              } else {
                Alert.alert('Error', 'Phone calling is not supported on this device');
              }
            });
          }
        }
      ]
    );
  };

  const emailSupport = () => {
    const email = 'support@brillprime.com';
    const emailUrl = `mailto:${email}?subject=Support Request&body=Hello, I need help with...`;
    
    Linking.canOpenURL(emailUrl).then((supported) => {
      if (supported) {
        Linking.openURL(emailUrl);
      } else {
        Alert.alert('Error', 'Email client is not available on this device');
      }
    });
  };

  const styles = getResponsiveStyles(screenData);

  return (
    <LinearGradient
      colors={['#0B1A51', '#1e3a8a']}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support & Help</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Get Help</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard} onPress={callSupport}>
            <View style={[styles.actionIcon, { backgroundColor: '#28a745' }]}>
              <Ionicons name="call" size={24} color="white" />
            </View>
            <Text style={styles.actionTitle}>Call Us</Text>
            <Text style={styles.actionSubtitle}>Talk to our support team</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={emailSupport}>
            <View style={[styles.actionIcon, { backgroundColor: '#007bff' }]}>
              <Ionicons name="mail" size={24} color="white" />
            </View>
            <Text style={styles.actionTitle}>Email Us</Text>
            <Text style={styles.actionSubtitle}>Send us an email</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard} 
            onPress={() => router.push('/chat')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#6f42c1' }]}>
              <Ionicons name="chatbubble" size={24} color="white" />
            </View>
            <Text style={styles.actionTitle}>Live Chat</Text>
            <Text style={styles.actionSubtitle}>Chat with support</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Form */}
        <Text style={styles.sectionTitle}>Send us a Message</Text>
        <View style={styles.messageContainer}>
          <TextInput
            style={styles.messageInput}
            value={message}
            onChangeText={setMessage}
            placeholder="Describe your issue or question..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Text style={styles.sendButtonText}>Send Message</Text>
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.faqContainer}>
          {faqs.map((faq) => (
            <View key={faq.id} style={styles.faqItem}>
              <TouchableOpacity
                style={styles.faqQuestion}
                onPress={() => toggleFAQ(faq.id)}
              >
                <Text style={styles.questionText}>{faq.question}</Text>
                <Ionicons
                  name={faq.expanded ? 'chevron-up' : 'chevron-down'}
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

        {/* Contact Info */}
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.contactInfo}>
          <View style={styles.contactItem}>
            <Ionicons name="call" size={20} color="#4682B4" />
            <Text style={styles.contactText}>+234 801 234 5678</Text>
          </View>
          <View style={styles.contactItem}>
            <Ionicons name="mail" size={20} color="#4682B4" />
            <Text style={styles.contactText}>support@brillprime.com</Text>
          </View>
          <View style={styles.contactItem}>
            <Ionicons name="time" size={20} color="#4682B4" />
            <Text style={styles.contactText}>Mon - Fri: 8:00 AM - 6:00 PM</Text>
          </View>
          <View style={styles.contactItem}>
            <Ionicons name="location" size={20} color="#4682B4" />
            <Text style={styles.contactText}>Abuja, Nigeria</Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const getResponsiveStyles = (screenData: any) => {
  const { width, height } = screenData;
  const isTablet = width >= 768;
  const isSmallScreen = width < 350;

  return StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: Math.max(16, width * 0.05),
      paddingTop: Math.max(50, height * 0.07),
    },
    backButton: {
      padding: Math.max(8, width * 0.02),
    },
    headerTitle: {
      fontSize: isTablet ? 24 : isSmallScreen ? 18 : 20,
      fontWeight: "bold",
      color: "white",
    },
    placeholder: {
      width: 40,
    },
    content: {
      flex: 1,
      backgroundColor: "white",
      borderTopLeftRadius: 35,
      borderTopRightRadius: 35,
      paddingHorizontal: Math.max(16, width * 0.05),
      paddingTop: Math.max(24, height * 0.03),
    },
    sectionTitle: {
      fontSize: isTablet ? 22 : isSmallScreen ? 16 : 18,
      fontWeight: "bold",
      color: "#2c3e50",
      marginBottom: Math.max(16, height * 0.025),
      marginTop: Math.max(8, height * 0.01),
    },
    quickActions: {
      flexDirection: 'row',
      gap: Math.max(12, width * 0.03),
      marginBottom: Math.max(24, height * 0.04),
    },
    actionCard: {
      flex: 1,
      backgroundColor: 'white',
      padding: Math.max(16, width * 0.04),
      borderRadius: 15,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#e9ecef',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    actionIcon: {
      width: 50,
      height: 50,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    actionTitle: {
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      fontWeight: '600',
      color: '#2c3e50',
      marginBottom: 4,
    },
    actionSubtitle: {
      fontSize: isTablet ? 12 : isSmallScreen ? 10 : 11,
      color: '#7f8c8d',
      textAlign: 'center',
    },
    messageContainer: {
      backgroundColor: 'white',
      borderRadius: 15,
      padding: Math.max(16, width * 0.04),
      marginBottom: Math.max(24, height * 0.04),
      borderWidth: 1,
      borderColor: '#e9ecef',
    },
    messageInput: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 10,
      padding: Math.max(12, width * 0.03),
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      color: '#333',
      marginBottom: 16,
      minHeight: 100,
    },
    sendButton: {
      backgroundColor: '#4682B4',
      paddingVertical: Math.max(12, height * 0.015),
      borderRadius: 10,
      alignItems: 'center',
    },
    sendButtonText: {
      color: 'white',
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      fontWeight: '600',
    },
    faqContainer: {
      backgroundColor: 'white',
      borderRadius: 15,
      marginBottom: Math.max(24, height * 0.04),
      borderWidth: 1,
      borderColor: '#e9ecef',
    },
    faqItem: {
      borderBottomWidth: 1,
      borderBottomColor: '#f8f9fa',
    },
    faqQuestion: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: Math.max(16, width * 0.04),
    },
    questionText: {
      flex: 1,
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      fontWeight: '600',
      color: '#2c3e50',
      marginRight: 12,
    },
    faqAnswer: {
      paddingHorizontal: Math.max(16, width * 0.04),
      paddingBottom: Math.max(16, height * 0.02),
    },
    answerText: {
      fontSize: isTablet ? 14 : isSmallScreen ? 12 : 13,
      color: '#7f8c8d',
      lineHeight: 20,
    },
    contactInfo: {
      backgroundColor: 'white',
      borderRadius: 15,
      padding: Math.max(16, width * 0.04),
      marginBottom: Math.max(24, height * 0.04),
      borderWidth: 1,
      borderColor: '#e9ecef',
    },
    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Math.max(12, height * 0.015),
      gap: 12,
    },
    contactText: {
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      color: '#2c3e50',
    },
  });
};
