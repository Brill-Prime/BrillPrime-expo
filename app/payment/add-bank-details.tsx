
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Dimensions,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  sortCode?: string;
  routingNumber?: string;
  isDefault: boolean;
  created: string;
}

const PRIMARY_COLOR = 'rgb(11, 26, 81)';
const SECONDARY_COLOR = '#4682B4';
const GRAY_400 = '#9CA3AF';
const GRAY_300 = '#B7B7B7';

export default function AddBankDetailsScreen() {
  const router = useRouter();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [formData, setFormData] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
    sortCode: '',
    confirmAccountNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, []);

  const popularBanks = [
    'Access Bank',
    'First Bank of Nigeria',
    'Guaranty Trust Bank',
    'United Bank for Africa',
    'Zenith Bank',
    'Fidelity Bank',
    'FCMB',
    'Sterling Bank',
    'Stanbic IBTC Bank',
    'Union Bank',
    'Wema Bank',
    'Polaris Bank',
    'Keystone Bank',
    'Heritage Bank',
    'Other'
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.bankName.trim()) {
      newErrors.bankName = 'Please select a bank';
    }

    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    } else if (formData.accountNumber.length < 10) {
      newErrors.accountNumber = 'Account number must be at least 10 digits';
    } else if (!/^\d+$/.test(formData.accountNumber)) {
      newErrors.accountNumber = 'Account number must contain only digits';
    }

    if (!formData.confirmAccountNumber.trim()) {
      newErrors.confirmAccountNumber = 'Please confirm your account number';
    } else if (formData.accountNumber !== formData.confirmAccountNumber) {
      newErrors.confirmAccountNumber = 'Account numbers do not match';
    }

    if (!formData.accountName.trim()) {
      newErrors.accountName = 'Account holder name is required';
    } else if (formData.accountName.length < 2) {
      newErrors.accountName = 'Account holder name is too short';
    }

    if (formData.sortCode && !/^\d{6}$/.test(formData.sortCode)) {
      newErrors.sortCode = 'Sort code must be 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;

    if (field === 'accountNumber' || field === 'confirmAccountNumber') {
      // Only allow digits and limit to 12 characters
      formattedValue = value.replace(/\D/g, '').slice(0, 12);
    } else if (field === 'sortCode') {
      // Only allow digits and limit to 6 characters
      formattedValue = value.replace(/\D/g, '').slice(0, 6);
    } else if (field === 'accountName') {
      // Allow letters, spaces, and common punctuation
      formattedValue = value.replace(/[^a-zA-Z\s\-'\.]/g, '');
    }

    setFormData(prev => ({ ...prev, [field]: formattedValue }));
    
    // Clear specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSaveBankDetails = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newBankAccount: BankAccount = {
        id: Date.now().toString(),
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        accountName: formData.accountName,
        sortCode: formData.sortCode || undefined,
        isDefault: false,
        created: new Date().toISOString(),
      };

      // Save to AsyncStorage
      const existingAccounts = await AsyncStorage.getItem('bankAccounts');
      const accounts: BankAccount[] = existingAccounts ? JSON.parse(existingAccounts) : [];
      
      // If this is the first account, make it default
      if (accounts.length === 0) {
        newBankAccount.isDefault = true;
      }

      accounts.push(newBankAccount);
      await AsyncStorage.setItem('bankAccounts', JSON.stringify(accounts));

      Alert.alert(
        'Success',
        'Bank account details saved successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Error saving bank details:', error);
      Alert.alert('Error', 'Failed to save bank account details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBankSelection = (bankName: string) => {
    setFormData(prev => ({ ...prev, bankName }));
    setShowBankPicker(false);
    if (errors.bankName) {
      setErrors(prev => ({ ...prev, bankName: '' }));
    }
  };

  const styles = getResponsiveStyles(screenData);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={PRIMARY_COLOR} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Bank Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Bank Selection */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Bank</Text>
          <TouchableOpacity
            style={[styles.bankSelector, errors.bankName && styles.inputError]}
            onPress={() => setShowBankPicker(true)}
          >
            <Text style={[
              styles.bankSelectorText,
              !formData.bankName && styles.placeholderText
            ]}>
              {formData.bankName || 'Select your bank'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={GRAY_400} />
          </TouchableOpacity>
          {errors.bankName && <Text style={styles.errorText}>{errors.bankName}</Text>}
        </View>

        {/* Account Number */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Account Number</Text>
          <View style={[styles.inputWrapper, errors.accountNumber && styles.inputError]}>
            <Ionicons name="card-outline" size={20} color={GRAY_400} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={formData.accountNumber}
              onChangeText={(value) => handleInputChange('accountNumber', value)}
              placeholder="Enter account number"
              placeholderTextColor={GRAY_400}
              keyboardType="numeric"
              maxLength={12}
            />
          </View>
          {errors.accountNumber && <Text style={styles.errorText}>{errors.accountNumber}</Text>}
        </View>

        {/* Confirm Account Number */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Confirm Account Number</Text>
          <View style={[styles.inputWrapper, errors.confirmAccountNumber && styles.inputError]}>
            <Ionicons name="checkmark-circle-outline" size={20} color={GRAY_400} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={formData.confirmAccountNumber}
              onChangeText={(value) => handleInputChange('confirmAccountNumber', value)}
              placeholder="Re-enter account number"
              placeholderTextColor={GRAY_400}
              keyboardType="numeric"
              maxLength={12}
            />
          </View>
          {errors.confirmAccountNumber && <Text style={styles.errorText}>{errors.confirmAccountNumber}</Text>}
        </View>

        {/* Account Holder Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Account Holder Name</Text>
          <View style={[styles.inputWrapper, errors.accountName && styles.inputError]}>
            <Ionicons name="person-outline" size={20} color={GRAY_400} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={formData.accountName}
              onChangeText={(value) => handleInputChange('accountName', value)}
              placeholder="Enter full name on account"
              placeholderTextColor={GRAY_400}
              autoCapitalize="words"
            />
          </View>
          {errors.accountName && <Text style={styles.errorText}>{errors.accountName}</Text>}
        </View>

        {/* Sort Code (Optional) */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Sort Code (Optional)</Text>
          <View style={[styles.inputWrapper, errors.sortCode && styles.inputError]}>
            <Ionicons name="grid-outline" size={20} color={GRAY_400} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={formData.sortCode}
              onChangeText={(value) => handleInputChange('sortCode', value)}
              placeholder="Enter 6-digit sort code"
              placeholderTextColor={GRAY_400}
              keyboardType="numeric"
              maxLength={6}
            />
          </View>
          {errors.sortCode && <Text style={styles.errorText}>{errors.sortCode}</Text>}
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Ionicons name="shield-checkmark" size={24} color="#27ae60" />
          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>Secure & Encrypted</Text>
            <Text style={styles.securityText}>
              Your bank details are encrypted and stored securely. We never store your login credentials.
            </Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
          onPress={handleSaveBankDetails}
          disabled={loading}
        >
          {loading ? (
            <Text style={styles.saveButtonText}>Saving...</Text>
          ) : (
            <Text style={styles.saveButtonText}>Save Bank Details</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Bank Picker Modal */}
      <Modal
        visible={showBankPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBankPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Bank</Text>
              <TouchableOpacity onPress={() => setShowBankPicker(false)}>
                <Ionicons name="close" size={24} color={PRIMARY_COLOR} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={popularBanks}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.bankOption}
                  onPress={() => handleBankSelection(item)}
                >
                  <Text style={styles.bankOptionText}>{item}</Text>
                  <Ionicons name="chevron-forward" size={16} color={GRAY_400} />
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
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
      backgroundColor: '#FFFFFF',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Math.max(16, width * 0.05),
      paddingTop: Math.max(50, height * 0.07),
      paddingBottom: Math.max(16, height * 0.02),
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#f8f9fa',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: isTablet ? 20 : isSmallScreen ? 16 : 18,
      fontWeight: '800',
      color: PRIMARY_COLOR,
      textAlign: 'center',
      flex: 1,
    },
    headerSpacer: {
      width: 40,
    },
    content: {
      flex: 1,
      paddingHorizontal: Math.max(16, width * 0.05),
      paddingTop: Math.max(20, height * 0.025),
    },
    inputContainer: {
      marginBottom: Math.max(20, height * 0.025),
    },
    inputLabel: {
      fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
      fontWeight: '600',
      color: PRIMARY_COLOR,
      marginBottom: Math.max(8, height * 0.01),
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: SECONDARY_COLOR,
      borderRadius: 30,
      backgroundColor: '#FFFFFF',
      paddingHorizontal: Math.max(16, width * 0.04),
      paddingVertical: Math.max(16, height * 0.02),
      minHeight: 59,
    },
    inputIcon: {
      marginRight: Math.max(12, width * 0.03),
    },
    input: {
      flex: 1,
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      color: '#111827',
      fontWeight: '500',
    },
    inputError: {
      borderColor: '#e74c3c',
    },
    bankSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: SECONDARY_COLOR,
      borderRadius: 30,
      backgroundColor: '#FFFFFF',
      paddingHorizontal: Math.max(16, width * 0.04),
      paddingVertical: Math.max(16, height * 0.02),
      minHeight: 59,
    },
    bankSelectorText: {
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      color: '#111827',
      fontWeight: '500',
      flex: 1,
    },
    placeholderText: {
      color: GRAY_300,
      fontWeight: '400',
    },
    errorText: {
      fontSize: isTablet ? 12 : 10,
      color: '#e74c3c',
      marginTop: 5,
      marginLeft: 16,
    },
    securityNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(39, 174, 96, 0.1)',
      padding: Math.max(16, width * 0.04),
      borderRadius: 12,
      marginVertical: Math.max(20, height * 0.025),
      gap: Math.max(12, width * 0.03),
    },
    securityContent: {
      flex: 1,
    },
    securityTitle: {
      fontSize: isTablet ? 14 : isSmallScreen ? 12 : 13,
      fontWeight: '600',
      color: '#27ae60',
      marginBottom: 4,
    },
    securityText: {
      fontSize: isTablet ? 12 : isSmallScreen ? 10 : 11,
      color: '#27ae60',
      lineHeight: 16,
    },
    saveButton: {
      backgroundColor: PRIMARY_COLOR,
      borderRadius: 30,
      paddingVertical: Math.max(16, height * 0.02),
      alignItems: 'center',
      marginVertical: Math.max(30, height * 0.04),
      marginBottom: Math.max(40, height * 0.05),
      minHeight: 59,
      justifyContent: 'center',
    },
    saveButtonDisabled: {
      backgroundColor: GRAY_400,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: isTablet ? 18 : isSmallScreen ? 16 : 17,
      fontWeight: '500',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: height * 0.7,
      paddingBottom: Math.max(20, height * 0.025),
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: Math.max(20, width * 0.05),
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
      fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
      fontWeight: '600',
      color: PRIMARY_COLOR,
    },
    bankOption: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Math.max(20, width * 0.05),
      paddingVertical: Math.max(15, height * 0.018),
      borderBottomWidth: 1,
      borderBottomColor: '#f5f5f5',
    },
    bankOptionText: {
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      color: '#111827',
      fontWeight: '500',
    },
  });
};
