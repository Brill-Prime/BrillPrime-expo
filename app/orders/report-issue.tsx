
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAlert } from '../../components/AlertProvider';
import AttachmentUploader, { Attachment } from '../../components/AttachmentUploader';

const ISSUE_CATEGORIES = [
  { id: 'wrong_item', title: 'Wrong Item Delivered', icon: 'swap-horizontal' },
  { id: 'missing_items', title: 'Missing Items', icon: 'remove-circle-outline' },
  { id: 'late_delivery', title: 'Late Delivery', icon: 'time-outline' },
  { id: 'poor_quality', title: 'Poor Quality', icon: 'star-outline' },
  { id: 'damaged_package', title: 'Damaged Package', icon: 'alert-circle-outline' },
  { id: 'driver_behavior', title: 'Driver Behavior', icon: 'person-outline' },
  { id: 'payment_issue', title: 'Payment Issue', icon: 'card-outline' },
  { id: 'other', title: 'Other', icon: 'ellipsis-horizontal' },
];

export default function ReportIssue() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams();
  const { showSuccess, showError, showWarning } = useAlert();
  
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    return () => subscription?.remove();
  }, []);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleSubmit = async () => {
    if (!selectedCategory) {
      showWarning('Category Required', 'Please select an issue category');
      return;
    }

    if (!description.trim()) {
      showWarning('Description Required', 'Please provide details about the issue');
      return;
    }

    if (description.trim().length < 10) {
      showWarning('Too Short', 'Please provide more details (at least 10 characters)');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Here you would call the API to submit the issue
      // await orderService.reportIssue(orderId, {
      //   category: selectedCategory,
      //   description: description.trim(),
      //   attachments: attachments.map(a => a.uri),
      // });

      showSuccess(
        'Issue Reported',
        'Your issue has been submitted. Our support team will contact you soon.'
      );

      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      console.error('Error reporting issue:', error);
      showError('Submission Failed', 'Failed to report issue. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = getResponsiveStyles(screenData);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#1C1B1F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Issue</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Info */}
        <View style={styles.orderInfo}>
          <Ionicons name="receipt-outline" size={24} color="#2f75c2" />
          <View style={styles.orderDetails}>
            <Text style={styles.orderLabel}>Order ID</Text>
            <Text style={styles.orderValue}>{orderId}</Text>
          </View>
        </View>

        {/* Issue Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's the issue?</Text>
          <Text style={styles.sectionSubtitle}>Select the category that best describes your issue</Text>
          
          <View style={styles.categoriesGrid}>
            {ISSUE_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  selectedCategory === category.id && styles.categoryCardSelected,
                ]}
                onPress={() => handleCategorySelect(category.id)}
              >
                <View style={[
                  styles.categoryIconContainer,
                  selectedCategory === category.id && styles.categoryIconContainerSelected,
                ]}>
                  <Ionicons
                    name={category.icon as any}
                    size={28}
                    color={selectedCategory === category.id ? '#fff' : '#2f75c2'}
                  />
                </View>
                <Text style={[
                  styles.categoryTitle,
                  selectedCategory === category.id && styles.categoryTitleSelected,
                ]}>
                  {category.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Describe the issue</Text>
          <Text style={styles.sectionSubtitle}>
            Please provide detailed information about what went wrong
          </Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textArea}
              placeholder="Example: The order arrived 2 hours late and the packaging was damaged..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
              maxLength={500}
            />
            <Text style={styles.charCounter}>
              {description.length}/500
            </Text>
          </View>
        </View>

        {/* Attachments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Evidence (Optional)</Text>
          <Text style={styles.sectionSubtitle}>
            Upload photos or documents to support your claim
          </Text>
          
          <AttachmentUploader
            attachments={attachments}
            onAttachmentsChange={setAttachments}
            maxAttachments={5}
            allowedTypes={['image', 'document']}
          />
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color="#2f75c2" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>What happens next?</Text>
            <Text style={styles.infoText}>
              Our support team will review your issue within 24 hours. You'll receive updates via email and in-app notifications.
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Text style={styles.submitButtonText}>Submitting...</Text>
          ) : (
            <>
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Submit Issue Report</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getResponsiveStyles = (screenData: any) => {
  const { width } = screenData;
  const isTablet = width >= 768;
  const isSmallScreen = width < 350;
  const padding = Math.max(20, width * 0.05);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: padding,
      paddingTop: 60,
      paddingBottom: 15,
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: isTablet ? 20 : 18,
      fontWeight: '600',
      color: '#1C1B1F',
      fontFamily: 'Montserrat-SemiBold',
    },
    placeholder: {
      width: 40,
    },
    content: {
      flex: 1,
    },
    orderInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f8f9fa',
      padding: 16,
      marginHorizontal: padding,
      marginTop: 20,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#e0e0e0',
    },
    orderDetails: {
      marginLeft: 12,
    },
    orderLabel: {
      fontSize: isTablet ? 13 : 12,
      color: '#666',
      fontFamily: 'Montserrat-Regular',
    },
    orderValue: {
      fontSize: isTablet ? 16 : 15,
      fontWeight: '600',
      color: '#1C1B1F',
      marginTop: 2,
      fontFamily: 'Montserrat-SemiBold',
    },
    section: {
      paddingHorizontal: padding,
      marginTop: 24,
    },
    sectionTitle: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: '600',
      color: '#1C1B1F',
      marginBottom: 8,
      fontFamily: 'Montserrat-SemiBold',
    },
    sectionSubtitle: {
      fontSize: isTablet ? 14 : 13,
      color: '#666',
      marginBottom: 16,
      fontFamily: 'Montserrat-Regular',
    },
    categoriesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -6,
    },
    categoryCard: {
      width: isSmallScreen ? '48%' : '31.33%',
      backgroundColor: '#f8f9fa',
      borderRadius: 12,
      padding: 16,
      margin: 6,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#e0e0e0',
    },
    categoryCardSelected: {
      backgroundColor: '#e8f4ff',
      borderColor: '#2f75c2',
    },
    categoryIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    categoryIconContainerSelected: {
      backgroundColor: '#2f75c2',
    },
    categoryTitle: {
      fontSize: isTablet ? 13 : 12,
      color: '#333',
      textAlign: 'center',
      fontFamily: 'Montserrat-Medium',
    },
    categoryTitleSelected: {
      color: '#2f75c2',
      fontWeight: '600',
      fontFamily: 'Montserrat-SemiBold',
    },
    inputContainer: {
      position: 'relative',
    },
    textArea: {
      backgroundColor: '#f8f9fa',
      borderRadius: 12,
      padding: 16,
      fontSize: isTablet ? 15 : 14,
      color: '#1C1B1F',
      minHeight: 150,
      borderWidth: 1,
      borderColor: '#e0e0e0',
      fontFamily: 'Montserrat-Regular',
    },
    charCounter: {
      position: 'absolute',
      bottom: 12,
      right: 12,
      fontSize: 12,
      color: '#999',
      fontFamily: 'Montserrat-Regular',
    },
    infoBox: {
      flexDirection: 'row',
      backgroundColor: '#e8f4ff',
      padding: 16,
      marginHorizontal: padding,
      marginTop: 24,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#2f75c2',
    },
    infoContent: {
      flex: 1,
      marginLeft: 12,
    },
    infoTitle: {
      fontSize: isTablet ? 15 : 14,
      fontWeight: '600',
      color: '#1C1B1F',
      marginBottom: 4,
      fontFamily: 'Montserrat-SemiBold',
    },
    infoText: {
      fontSize: isTablet ? 13 : 12,
      color: '#666',
      lineHeight: 18,
      fontFamily: 'Montserrat-Regular',
    },
    bottomSpacing: {
      height: 100,
    },
    footer: {
      padding: padding,
      backgroundColor: '#fff',
      borderTopWidth: 1,
      borderTopColor: '#f0f0f0',
      paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    },
    submitButton: {
      backgroundColor: '#2f75c2',
      borderRadius: 25,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    submitButtonDisabled: {
      backgroundColor: '#ccc',
    },
    submitButtonText: {
      color: '#fff',
      fontSize: isTablet ? 16 : 15,
      fontWeight: '600',
      fontFamily: 'Montserrat-SemiBold',
    },
  });
};
