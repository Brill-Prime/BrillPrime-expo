import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { paymentService } from '../../services/paymentService';
import { validateCardNumber, validateCVV, validateExpiryDate } from '../../utils/validation';
import { theme } from '../../config/theme';
import { useAlert } from '../../components/AlertProvider';

type PaymentType = 'CARD' | 'BANK_TRANSFER';

export default function AddPaymentMethodScreen() {
  const router = useRouter();
  const { showSuccess, showError } = useAlert();
  const [loading, setLoading] = useState(false);
  const [paymentType, setPaymentType] = useState<PaymentType>('CARD');
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  
  // Card details
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  
  // Bank details
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [bankName, setBankName] = useState('');
  
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [errors, setErrors] = useState<any>({});

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted;
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const formatAccountNumber = (text: string) => {
    return text.replace(/\D/g, '').slice(0, 10);
  };

  const validateCardForm = () => {
    const newErrors: any = {};

    if (!validateCardNumber(cardNumber.replace(/\s/g, ''))) {
      newErrors.cardNumber = 'Invalid card number';
    }

    if (!cardHolder.trim()) {
      newErrors.cardHolder = 'Card holder name is required';
    }

    if (!validateExpiryDate(expiryDate)) {
      newErrors.expiryDate = 'Invalid expiry date (MM/YY)';
    }

    if (!validateCVV(cvv)) {
      newErrors.cvv = 'Invalid CVV';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateBankForm = () => {
    const newErrors: any = {};

    if (!accountNumber || accountNumber.length !== 10) {
      newErrors.accountNumber = 'Invalid account number (10 digits required)';
    }

    if (!accountName.trim()) {
      newErrors.accountName = 'Account name is required';
    }

    if (!bankCode.trim()) {
      newErrors.bankCode = 'Bank code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddPaymentMethod = async () => {
    if (paymentType === 'CARD' && !validateCardForm()) {
      return;
    }

    if (paymentType === 'BANK_TRANSFER' && !validateBankForm()) {
      return;
    }

    setLoading(true);
    try {
      const data = paymentType === 'CARD'
        ? {
            type: 'CARD' as const,
            cardNumber: cardNumber.replace(/\s/g, ''),
            cardHolder,
            expiryDate,
            cvv,
            isDefault: setAsDefault,
          }
        : {
            type: 'BANK_TRANSFER' as const,
            accountNumber,
            accountName,
            bankCode,
            isDefault: setAsDefault,
          };

      const response = await paymentService.addPaymentMethod(data);

      if (response.success) {
        showSuccess('Success', 'Payment method added successfully');
        router.back();
      } else {
        showError('Error', response.error || 'Failed to add payment method');
      }
    } catch (error) {
      console.error('Error adding payment method:', error);
      showError('Error', 'Failed to add payment method. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const NIGERIAN_BANKS = [
    { code: '044', name: 'Access Bank' },
    { code: '063', name: 'Access Bank (Diamond)' },
    { code: '050', name: 'Ecobank Nigeria' },
    { code: '070', name: 'Fidelity Bank' },
    { code: '011', name: 'First Bank of Nigeria' },
    { code: '214', name: 'First City Monument Bank' },
    { code: '058', name: 'Guaranty Trust Bank' },
    { code: '030', name: 'Heritage Bank' },
    { code: '301', name: 'Jaiz Bank' },
    { code: '082', name: 'Keystone Bank' },
    { code: '526', name: 'Parallex Bank' },
    { code: '076', name: 'Polaris Bank' },
    { code: '101', name: 'Providus Bank' },
    { code: '221', name: 'Stanbic IBTC Bank' },
    { code: '068', name: 'Standard Chartered Bank' },
    { code: '232', name: 'Sterling Bank' },
    { code: '100', name: 'Suntrust Bank' },
    { code: '032', name: 'Union Bank of Nigeria' },
    { code: '033', name: 'United Bank For Africa' },
    { code: '215', name: 'Unity Bank' },
    { code: '035', name: 'Wema Bank' },
    { code: '057', name: 'Zenith Bank' },
  ];

  const responsivePadding = Math.max(20, screenDimensions.width * 0.05);
  const isTablet = screenDimensions.width >= theme.breakpoints.tablet;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingHorizontal: responsivePadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Payment Method</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tab Selector */}
      <View style={[styles.tabContainer, { paddingHorizontal: responsivePadding }]}>
        <TouchableOpacity
          style={[styles.tab, paymentType === 'CARD' && styles.activeTab]}
          onPress={() => setPaymentType('CARD')}
        >
          <Ionicons 
            name="card" 
            size={20} 
            color={paymentType === 'CARD' ? theme.colors.white : theme.colors.textSecondary} 
          />
          <Text style={[styles.tabText, paymentType === 'CARD' && styles.activeTabText]}>
            Card
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, paymentType === 'BANK_TRANSFER' && styles.activeTab]}
          onPress={() => setPaymentType('BANK_TRANSFER')}
        >
          <Ionicons 
            name="business" 
            size={20} 
            color={paymentType === 'BANK_TRANSFER' ? theme.colors.white : theme.colors.textSecondary} 
          />
          <Text style={[styles.tabText, paymentType === 'BANK_TRANSFER' && styles.activeTabText]}>
            Bank Account
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.form, { paddingHorizontal: responsivePadding }]}>
          {paymentType === 'CARD' ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Card Number</Text>
                <TextInput
                  style={[styles.input, errors.cardNumber && styles.inputError]}
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor={theme.colors.textLight}
                  value={cardNumber}
                  onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                  keyboardType="numeric"
                  maxLength={19}
                />
                {errors.cardNumber && (
                  <Text style={styles.errorText}>{errors.cardNumber}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Card Holder Name</Text>
                <TextInput
                  style={[styles.input, errors.cardHolder && styles.inputError]}
                  placeholder="John Doe"
                  placeholderTextColor={theme.colors.textLight}
                  value={cardHolder}
                  onChangeText={setCardHolder}
                  autoCapitalize="words"
                />
                {errors.cardHolder && (
                  <Text style={styles.errorText}>{errors.cardHolder}</Text>
                )}
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Expiry Date</Text>
                  <TextInput
                    style={[styles.input, errors.expiryDate && styles.inputError]}
                    placeholder="MM/YY"
                    placeholderTextColor={theme.colors.textLight}
                    value={expiryDate}
                    onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                  {errors.expiryDate && (
                    <Text style={styles.errorText}>{errors.expiryDate}</Text>
                  )}
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>CVV</Text>
                  <TextInput
                    style={[styles.input, errors.cvv && styles.inputError]}
                    placeholder="123"
                    placeholderTextColor={theme.colors.textLight}
                    value={cvv}
                    onChangeText={setCvv}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                  />
                  {errors.cvv && (
                    <Text style={styles.errorText}>{errors.cvv}</Text>
                  )}
                </View>
              </View>
            </>
          ) : (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Select Bank</Text>
                <View style={styles.bankSelector}>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.bankList}
                  >
                    {NIGERIAN_BANKS.map((bank) => (
                      <TouchableOpacity
                        key={bank.code}
                        style={[
                          styles.bankChip,
                          bankCode === bank.code && styles.bankChipSelected
                        ]}
                        onPress={() => {
                          setBankCode(bank.code);
                          setBankName(bank.name);
                        }}
                      >
                        <Text style={[
                          styles.bankChipText,
                          bankCode === bank.code && styles.bankChipTextSelected
                        ]}>
                          {bank.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                {errors.bankCode && (
                  <Text style={styles.errorText}>{errors.bankCode}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Account Number</Text>
                <TextInput
                  style={[styles.input, errors.accountNumber && styles.inputError]}
                  placeholder="0123456789"
                  placeholderTextColor={theme.colors.textLight}
                  value={accountNumber}
                  onChangeText={(text) => setAccountNumber(formatAccountNumber(text))}
                  keyboardType="numeric"
                  maxLength={10}
                />
                {errors.accountNumber && (
                  <Text style={styles.errorText}>{errors.accountNumber}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Account Name</Text>
                <TextInput
                  style={[styles.input, errors.accountName && styles.inputError]}
                  placeholder="John Doe"
                  placeholderTextColor={theme.colors.textLight}
                  value={accountName}
                  onChangeText={setAccountName}
                  autoCapitalize="words"
                />
                {errors.accountName && (
                  <Text style={styles.errorText}>{errors.accountName}</Text>
                )}
              </View>
            </>
          )}

          {/* Set as Default Toggle */}
          <TouchableOpacity 
            style={styles.defaultToggle}
            onPress={() => setSetAsDefault(!setAsDefault)}
          >
            <View style={styles.defaultToggleLeft}>
              <Ionicons 
                name={setAsDefault ? "checkbox" : "square-outline"} 
                size={24} 
                color={setAsDefault ? theme.colors.primary : theme.colors.textSecondary} 
              />
              <Text style={styles.defaultToggleText}>Set as default payment method</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.securityNote}>
            <Ionicons name="shield-checkmark" size={20} color={theme.colors.success} />
            <Text style={styles.securityText}>
              Your payment information is encrypted and secure
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingHorizontal: responsivePadding }]}>
        <TouchableOpacity
          style={[styles.addButton, loading && styles.addButtonDisabled]}
          onPress={handleAddPaymentMethod}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <Text style={styles.addButtonText}>
              Add {paymentType === 'CARD' ? 'Card' : 'Bank Account'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 15,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.base,
    gap: theme.spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.base,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.backgroundSecondary,
    gap: theme.spacing.sm,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
  },
  activeTabText: {
    color: theme.colors.white,
  },
  content: {
    flex: 1,
  },
  form: {
    paddingVertical: theme.spacing.lg,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    marginTop: theme.spacing.xs,
  },
  row: {
    flexDirection: 'row',
  },
  bankSelector: {
    marginBottom: theme.spacing.sm,
  },
  bankList: {
    flexGrow: 0,
  },
  bankChip: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.base,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.backgroundSecondary,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bankChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  bankChipText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
  },
  bankChipTextSelected: {
    color: theme.colors.white,
  },
  defaultToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.base,
  },
  defaultToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  defaultToggleText: {
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.base,
  },
  securityText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  footer: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    backgroundColor: theme.colors.background,
  },
  addButton: {
    backgroundColor: theme.colors.primaryDark,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.base,
    alignItems: 'center',
    ...theme.shadows.base,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.semiBold,
  },
});
