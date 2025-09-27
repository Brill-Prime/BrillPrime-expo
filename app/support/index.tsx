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

// Assume useAlert is a custom hook for showing alerts, similar to Toast or Snackbar
// For this example, we'll mock it with Alert
const useAlert = () => ({
  showSuccess: (title: string, message: string) => Alert.alert(title, message),
  showError: (title: string, message: string) => Alert.alert(title, message),
});

export default function SupportScreen() {
  const router = useRouter();
  const { showSuccess, showError } = useAlert();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [selectedCategory, setSelectedCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [urgency, setUrgency] = useState('medium');
  const [contactMethod, setContactMethod] = useState('email');

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    return () => subscription?.remove();
  }, []);

  const supportCategories = [
    { id: 'account', title: 'Account & Profile', icon: 'person-circle' },
    { id: 'orders', title: 'Orders & Delivery', icon: 'cube' },
    { id: 'payments', title: 'Payments & Billing', icon: 'card' },
    { id: 'technical', title: 'Technical Issues', icon: 'bug' },
    { id: 'merchants', title: 'Merchant Support', icon: 'storefront' },
    { id: 'other', title: 'Other', icon: 'help-circle' }
  ];

  const handleCallSupport = async () => {
    try {
      const phoneNumber = '+234-800-BRILL-PRIME';
      const supported = await Linking.canOpenURL(`tel:${phoneNumber}`);
      if (supported) {
        await Linking.openURL(`tel:${phoneNumber}`);
      } else {
        Alert.alert('Error', 'Phone calls are not supported on this device');
      }
    } catch (error) {
      console.error('Error calling support:', error);
      showError('Error', 'Failed to initiate call');
    }
  };

  const handleEmailSupport = async () => {
    try {
      const email = 'support@brillprime.com';
      const subject = 'Support Request';
      const body = 'Please describe your issue here...';
      const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Email is not configured on this device');
      }
    } catch (error) {
      console.error('Error opening email:', error);
      showError('Error', 'Failed to open email');
    }
  };

  const handleSubmitTicket = async () => {
    if (!selectedCategory) {
      showError('Validation Error', 'Please select a category');
      return;
    }
    if (!subject.trim()) {
      showError('Validation Error', 'Please enter a subject');
      return;
    }
    if (!message.trim()) {
      showError('Validation Error', 'Please describe your issue');
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      showSuccess('Success', 'Your support ticket has been submitted. We will get back to you within 24 hours.');

      // Reset form
      setSelectedCategory('');
      setSubject('');
      setMessage('');
      setUrgency('medium');
      setContactMethod('email');
    } catch (error) {
      console.error('Error submitting ticket:', error);
      showError('Error', 'Failed to submit support ticket. Please try again.');
    }
  };

  const styles = getResponsiveStyles(screenData);

  return (
    <LinearGradient colors={['#0B1A51', '#1e3a8a']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Contact Options */}
        <View style={styles.quickContactSection}>
          <Text style={styles.sectionTitle}>Quick Contact</Text>
          <View style={styles.quickContactButtons}>
            <TouchableOpacity style={styles.quickContactButton} onPress={handleCallSupport}>
              <Ionicons name="call" size={24} color="#4682B4" />
              <Text style={styles.quickContactText}>Call Us</Text>
              <Text style={styles.quickContactSubtext}>+234-800-BRILL</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickContactButton} onPress={handleEmailSupport}>
              <Ionicons name="mail" size={24} color="#4682B4" />
              <Text style={styles.quickContactText}>Email Us</Text>
              <Text style={styles.quickContactSubtext}>support@brillprime.com</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Support Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Select Category</Text>
          <View style={styles.categoriesGrid}>
            {supportCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  selectedCategory === category.id && styles.selectedCategory
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Ionicons 
                  name={category.icon as any} 
                  size={32} 
                  color={selectedCategory === category.id ? '#0B1A51' : '#4682B4'} 
                />
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.selectedCategoryText
                ]}>
                  {category.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Support Form */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Describe Your Issue</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Subject</Text>
            <TextInput
              style={styles.textInput}
              value={subject}
              onChangeText={setSubject}
              placeholder="Brief description of your issue"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Message</Text>
            <TextInput
              style={[styles.textInput, styles.messageInput]}
              value={message}
              onChangeText={setMessage}
              placeholder="Please provide detailed information about your issue..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Urgency Level</Text>
            <View style={styles.urgencyButtons}>
              {['low', 'medium', 'high'].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.urgencyButton,
                    urgency === level && styles.selectedUrgency
                  ]}
                  onPress={() => setUrgency(level)}
                >
                  <Text style={[
                    styles.urgencyText,
                    urgency === level && styles.selectedUrgencyText
                  ]}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmitTicket}>
            <Text style={styles.submitButtonText}>Submit Support Ticket</Text>
            <Ionicons name="send" size={20} color="white" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

          <TouchableOpacity style={styles.faqItem}>
            <Text style={styles.faqQuestion}>How do I track my order?</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.faqItem}>
            <Text style={styles.faqQuestion}>How do I cancel an order?</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Payment issues and refunds</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Account security</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Math.max(16, width * 0.05),
      paddingTop: Math.max(50, height * 0.07),
      paddingBottom: 16,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: isTablet ? 24 : isSmallScreen ? 18 : 20,
      fontWeight: 'bold',
      color: 'white',
    },
    placeholder: {
      width: 40,
    },
    content: {
      flex: 1,
      backgroundColor: 'white',
      borderTopLeftRadius: 35,
      borderTopRightRadius: 35,
      paddingTop: 24,
    },
    quickContactSection: {
      paddingHorizontal: Math.max(16, width * 0.05),
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: isTablet ? 20 : isSmallScreen ? 16 : 18,
      fontWeight: 'bold',
      color: '#0B1A51',
      marginBottom: 16,
    },
    quickContactButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    quickContactButton: {
      flex: 1,
      backgroundColor: '#f8f9fa',
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#4682B4',
    },
    quickContactText: {
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      fontWeight: '600',
      color: '#0B1A51',
      marginTop: 8,
    },
    quickContactSubtext: {
      fontSize: isTablet ? 12 : isSmallScreen ? 10 : 11,
      color: '#666',
      marginTop: 4,
    },
    categoriesSection: {
      paddingHorizontal: Math.max(16, width * 0.05),
      marginBottom: 24,
    },
    categoriesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    categoryCard: {
      width: isTablet ? '31%' : '47%',
      backgroundColor: '#f8f9fa',
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    selectedCategory: {
      borderColor: '#4682B4',
      backgroundColor: 'rgba(70, 130, 180, 0.1)',
    },
    categoryText: {
      fontSize: isTablet ? 12 : isSmallScreen ? 10 : 11,
      fontWeight: '500',
      color: '#666',
      marginTop: 8,
      textAlign: 'center',
    },
    selectedCategoryText: {
      color: '#0B1A51',
      fontWeight: '600',
    },
    formSection: {
      paddingHorizontal: Math.max(16, width * 0.05),
      marginBottom: 24,
    },
    inputContainer: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      fontWeight: '600',
      color: '#0B1A51',
      marginBottom: 8,
    },
    textInput: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      backgroundColor: 'white',
    },
    messageInput: {
      height: 120,
      textAlignVertical: 'top',
    },
    urgencyButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    urgencyButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#ddd',
      alignItems: 'center',
    },
    selectedUrgency: {
      backgroundColor: '#4682B4',
      borderColor: '#4682B4',
    },
    urgencyText: {
      fontSize: isTablet ? 14 : isSmallScreen ? 11 : 12,
      fontWeight: '500',
      color: '#666',
    },
    selectedUrgencyText: {
      color: 'white',
    },
    submitButton: {
      backgroundColor: '#0B1A51',
      paddingVertical: 16,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    submitButtonText: {
      color: 'white',
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      fontWeight: '600',
    },
    faqSection: {
      paddingHorizontal: Math.max(16, width * 0.05),
      marginBottom: 32,
    },
    faqItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: '#f8f9fa',
      borderRadius: 12,
      marginBottom: 8,
    },
    faqQuestion: {
      fontSize: isTablet ? 15 : isSmallScreen ? 12 : 13,
      fontWeight: '500',
      color: '#0B1A51',
      flex: 1,
    },
  });
};