
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SupportTicket {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function SupportScreen() {
  const router = useRouter();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [formData, setFormData] = useState<SupportTicket>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    loadUserData();

    return () => subscription?.remove();
  }, []);

  const loadUserData = async () => {
    try {
      const email = await AsyncStorage.getItem('userEmail');
      if (email) {
        setFormData(prev => ({ ...prev, email }));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleInputChange = (field: keyof SupportTicket, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Please enter your name');
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }
    if (!formData.subject.trim()) {
      Alert.alert('Validation Error', 'Please enter a subject');
      return false;
    }
    if (!formData.message.trim()) {
      Alert.alert('Validation Error', 'Please enter your message');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Support Ticket Submitted',
        'Your support request has been submitted successfully. Our team will review your ticket and respond within 24 hours.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setFormData({
                name: '',
                email: formData.email, // Keep email
                subject: '',
                message: '',
              });
              router.back();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Submission Failed', 'Failed to submit your support ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = getResponsiveStyles(screenData);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Form Fields */}
        <View style={styles.formContainer}>
          {/* Name Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholder="Enter your name"
                placeholderTextColor="#B7B7B7"
              />
            </View>
          </View>

          {/* Email Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Email</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder="Enter your email"
                placeholderTextColor="#B7B7B7"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Subject Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Subject</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={formData.subject}
                onChangeText={(value) => handleInputChange('subject', value)}
                placeholder="Enter subject"
                placeholderTextColor="#B7B7B7"
              />
            </View>
          </View>

          {/* Message Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Message</Text>
            <View style={[styles.inputContainer, styles.messageContainer]}>
              <TextInput
                style={[styles.textInput, styles.messageInput]}
                value={formData.message}
                onChangeText={(value) => handleInputChange('message', value)}
                placeholder="Describe your issue or question..."
                placeholderTextColor="#B7B7B7"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Text>
          </TouchableOpacity>

          {/* Quick Help Options */}
          <View style={styles.quickHelpContainer}>
            <Text style={styles.quickHelpTitle}>Need quick help?</Text>
            <View style={styles.quickHelpOptions}>
              <TouchableOpacity style={styles.quickHelpOption}>
                <Ionicons name="help-circle-outline" size={20} color="#667eea" />
                <Text style={styles.quickHelpText}>FAQ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickHelpOption}>
                <Ionicons name="chatbubble-outline" size={20} color="#667eea" />
                <Text style={styles.quickHelpText}>Live Chat</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickHelpOption}>
                <Ionicons name="call-outline" size={20} color="#667eea" />
                <Text style={styles.quickHelpText}>Call Us</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getResponsiveStyles = (screenData: any) => {
  const { width, height } = screenData;
  const isTablet = width >= 768;
  const isSmallScreen = width < 350;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
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
    content: {
      flex: 1,
    },
    formContainer: {
      padding: Math.max(20, width * 0.05),
    },
    fieldContainer: {
      marginBottom: 24,
    },
    fieldLabel: {
      fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
      fontWeight: '600',
      color: '#000',
      textAlign: 'center',
      marginBottom: 8,
      fontFamily: 'Montserrat',
    },
    inputContainer: {
      borderWidth: 1,
      borderColor: '#4682B4',
      borderRadius: 30,
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    messageContainer: {
      height: 120,
    },
    textInput: {
      fontSize: isTablet ? 16 : isSmallScreen ? 14 : 15,
      color: '#000',
      fontFamily: 'Montserrat',
      fontWeight: '500',
    },
    messageInput: {
      height: 88,
      textAlignVertical: 'top',
    },
    submitButton: {
      backgroundColor: '#4682B4',
      borderRadius: 30,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 30,
    },
    submitButtonDisabled: {
      backgroundColor: '#ccc',
    },
    submitButtonText: {
      fontSize: isTablet ? 20 : isSmallScreen ? 16 : 18,
      fontWeight: '600',
      color: '#fff',
      fontFamily: 'Montserrat',
    },
    quickHelpContainer: {
      marginTop: 20,
      padding: 20,
      backgroundColor: '#f8f9fa',
      borderRadius: 12,
    },
    quickHelpTitle: {
      fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
      fontWeight: '600',
      color: '#333',
      textAlign: 'center',
      marginBottom: 16,
    },
    quickHelpOptions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    quickHelpOption: {
      alignItems: 'center',
      padding: 12,
    },
    quickHelpText: {
      fontSize: isTablet ? 14 : isSmallScreen ? 12 : 13,
      color: '#667eea',
      marginTop: 4,
      fontWeight: '500',
    },
  });
};
