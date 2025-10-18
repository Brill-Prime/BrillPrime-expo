import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { paymentService } from '../../services/paymentService';

type PaymentMethodType = 'card' | 'bank';

export default function AddPaymentMethodScreen() {
  const router = useRouter();
  const [screenData] = useState(Dimensions.get('window'));
  const [methodType, setMethodType] = useState<PaymentMethodType>('card');
  const [loading, setLoading] = useState(false);

  // Card details
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  // Bank details
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 19); // Max 16 digits + 3 spaces
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const validateCardDetails = () => {
    const cleanedCardNumber = cardNumber.replace(/\s/g, '');

    if (!cardName.trim()) {
      Alert.alert('Error', 'Please enter cardholder name');
      return false;
    }

    if (cleanedCardNumber.length !== 16) {
      Alert.alert('Error', 'Please enter a valid 16-digit card number');
      return false;
    }

    if (!expiryDate.match(/^\d{2}\/\d{2}$/)) {
      Alert.alert('Error', 'Please enter expiry date in MM/YY format');
      return false;
    }

    const [month, year] = expiryDate.split('/').map(Number);
    if (month < 1 || month > 12) {
      Alert.alert('Error', 'Invalid expiry month');
      return false;
    }

    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      Alert.alert('Error', 'Card has expired');
      return false;
    }

    if (cvv.length !== 3) {
      Alert.alert('Error', 'Please enter a valid 3-digit CVV');
      return false;
    }

    return true;
  };

  const validateBankDetails = () => {
    if (!bankName.trim()) {
      Alert.alert('Error', 'Please select a bank');
      return false;
    }

    if (accountNumber.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit account number');
      return false;
    }

    if (!accountName.trim()) {
      Alert.alert('Error', 'Please enter account name');
      return false;
    }

    return true;
  };

  const handleAddPaymentMethod = async () => {
    if (methodType === 'card' && !validateCardDetails()) return;
    if (methodType === 'bank' && !validateBankDetails()) return;

    setLoading(true);

    try {
      const result = await paymentService.addPaymentMethod({
        type: methodType,
        ...(methodType === 'card' ? {
          cardNumber: cardNumber.replace(/\s/g, ''),
          cardholderName: cardName,
          expiryDate,
          cvv,
        } : {
          bankName,
          accountNumber,
          accountName,
        }),
      });

      if (result.success) {
        Alert.alert('Success', 'Payment method added successfully', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to add payment method');
      }
    } catch (error) {
      console.error('Add payment method error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const isTablet = screenData.width >= 768;
  const isSmallScreen = screenData.width < 350;
  const styles = getResponsiveStyles(screenData);

  return (
    <LinearGradient
      colors={['rgb(11, 26, 81)', '#1e3a8a']}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Payment Method</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Method Type Selector */}
        <View style={styles.methodTypeContainer}>
          <TouchableOpacity
            style={[
              styles.methodTypeButton,
              methodType === 'card' && styles.methodTypeButtonActive
            ]}
            onPress={() => setMethodType('card')}
          >
            <Ionicons 
              name="card" 
              size={24} 
              color={methodType === 'card' ? 'white' : 'rgb(11, 26, 81)'} 
            />
            <Text style={[
              styles.methodTypeText,
              methodType === 'card' && styles.methodTypeTextActive
            ]}>
              Card
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.methodTypeButton,
              methodType === 'bank' && styles.methodTypeButtonActive
            ]}
            onPress={() => setMethodType('bank')}
          >
            <Ionicons 
              name="business" 
              size={24} 
              color={methodType === 'bank' ? 'white' : 'rgb(11, 26, 81)'} 
            />
            <Text style={[
              styles.methodTypeText,
              methodType === 'bank' && styles.methodTypeTextActive
            ]}>
              Bank Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* Card Form */}
        {methodType === 'card' && (
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cardholder Name</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                value={cardName}
                onChangeText={setCardName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Card Number</Text>
              <TextInput
                style={styles.input}
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                keyboardType="numeric"
                maxLength={19}
              />
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.label}>Expiry Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="MM/YY"
                  value={expiryDate}
                  onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>CVV</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123"
                  value={cvv}
                  onChangeText={(text) => setCvv(text.replace(/\D/g, ''))}
                  keyboardType="numeric"
                  maxLength={3}
                  secureTextEntry
                />
              </View>
            </View>
          </View>
        )}

        {/* Bank Form */}
        {methodType === 'bank' && (
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bank Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Select Bank"
                value={bankName}
                onChangeText={setBankName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Account Number</Text>
              <TextInput
                style={styles.input}
                placeholder="0123456789"
                value={accountNumber}
                onChangeText={(text) => setAccountNumber(text.replace(/\D/g, ''))}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Account Name</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                value={accountName}
                onChangeText={setAccountName}
                autoCapitalize="words"
              />
            </View>
          </View>
        )}

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Ionicons name="shield-checkmark" size={20} color="#10b981" />
          <Text style={styles.securityText}>
            Your payment information is encrypted and secure
          </Text>
        </View>

        {/* Add Button */}
        <TouchableOpacity
          style={[styles.addButton, loading && styles.addButtonDisabled]}
          onPress={handleAddPaymentMethod}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.addButtonText}>Add Payment Method</Text>
          )}
        </TouchableOpacity>
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
      fontSize: isTablet ? 20 : isSmallScreen ? 16 : 18,
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
      paddingTop: Math.max(24, height * 0.03),
      paddingHorizontal: Math.max(16, width * 0.05),
    },
    methodTypeContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 24,
    },
    methodTypeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 16,
      borderRadius: 12,
      backgroundColor: '#f3f4f6',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    methodTypeButtonActive: {
      backgroundColor: 'rgb(11, 26, 81)',
      borderColor: 'rgb(11, 26, 81)',
    },
    methodTypeText: {
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      fontWeight: '600',
      color: 'rgb(11, 26, 81)',
    },
    methodTypeTextActive: {
      color: 'white',
    },
    formContainer: {
      marginBottom: 24,
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: isTablet ? 14 : isSmallScreen ? 12 : 13,
      fontWeight: '600',
      color: '#374151',
      marginBottom: 8,
    },
    input: {
      backgroundColor: '#f9fafb',
      borderWidth: 1,
      borderColor: '#e5e7eb',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      color: '#111827',
    },
    rowInputs: {
      flexDirection: 'row',
    },
    securityNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: '#f0fdf4',
      padding: 12,
      borderRadius: 12,
      marginBottom: 24,
    },
    securityText: {
      flex: 1,
      fontSize: isTablet ? 13 : isSmallScreen ? 11 : 12,
      color: '#166534',
    },
    addButton: {
      backgroundColor: 'rgb(11, 26, 81)',
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: Math.max(32, height * 0.04),
    },
    addButtonDisabled: {
      opacity: 0.6,
    },
    addButtonText: {
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      fontWeight: '600',
      color: 'white',
    },
  });
};