
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'wallet';
  title: string;
  subtitle: string;
  icon: string;
  isDefault: boolean;
  created: string;
}

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    loadPaymentMethods();
    
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      const savedMethods = await AsyncStorage.getItem('paymentMethods');
      if (savedMethods) {
        setPaymentMethods(JSON.parse(savedMethods));
      } else {
        // Default payment methods
        const defaultMethods: PaymentMethod[] = [
          {
            id: '1',
            type: 'card',
            title: 'Credit/Debit Card',
            subtitle: 'Add your card for secure payments',
            icon: 'card-outline',
            isDefault: true,
            created: new Date().toISOString()
          },
          {
            id: '2',
            type: 'bank',
            title: 'Bank Transfer',
            subtitle: 'Direct bank account transfer',
            icon: 'business-outline',
            isDefault: false,
            created: new Date().toISOString()
          },
          {
            id: '3',
            type: 'wallet',
            title: 'Digital Wallet',
            subtitle: 'Use mobile money or e-wallet',
            icon: 'wallet-outline',
            isDefault: false,
            created: new Date().toISOString()
          }
        ];
        setPaymentMethods(defaultMethods);
        await AsyncStorage.setItem('paymentMethods', JSON.stringify(defaultMethods));
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  const handleSetDefault = async (methodId: string) => {
    const updatedMethods = paymentMethods.map(method => ({
      ...method,
      isDefault: method.id === methodId
    }));

    try {
      await AsyncStorage.setItem('paymentMethods', JSON.stringify(updatedMethods));
      setPaymentMethods(updatedMethods);
    } catch (error) {
      console.error('Error updating payment methods:', error);
    }
  };

  const handleRemoveMethod = (methodId: string) => {
    const method = paymentMethods.find(m => m.id === methodId);
    
    if (paymentMethods.length === 1) {
      Alert.alert(
        'Cannot Remove',
        'You must have at least one payment method. Please add another method before removing this one.'
      );
      return;
    }

    if (method?.isDefault && paymentMethods.length > 1) {
      Alert.alert(
        'Cannot Remove Default',
        'You cannot remove your default payment method. Please set another method as default first.'
      );
      return;
    }

    Alert.alert(
      'Remove Payment Method',
      `Are you sure you want to remove "${method?.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const updatedMethods = paymentMethods.filter(m => m.id !== methodId);
            // If removed method was default and there are remaining methods, make first one default
            if (method?.isDefault && updatedMethods.length > 0) {
              updatedMethods[0].isDefault = true;
            }
            
            try {
              await AsyncStorage.setItem('paymentMethods', JSON.stringify(updatedMethods));
              setPaymentMethods(updatedMethods);
              Alert.alert('Success', 'Payment method removed successfully');
            } catch (error) {
              console.error('Error removing payment method:', error);
              Alert.alert('Error', 'Failed to remove payment method');
            }
          }
        }
      ]
    );
  };

  const handleAddPaymentMethod = () => {
    Alert.alert(
      'Add Payment Method',
      'Choose a payment method type',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Credit/Debit Card', onPress: () => addCardMethod() },
        { text: 'Bank Account', onPress: () => addBankMethod() },
        { text: 'Digital Wallet', onPress: () => addWalletMethod() },
      ]
    );
  };

  const addCardMethod = () => {
    Alert.prompt(
      'Add Card',
      'Enter card details (Demo)',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Add', 
          onPress: (cardNumber) => {
            if (cardNumber && cardNumber.length >= 4) {
              const newMethod: PaymentMethod = {
                id: Date.now().toString(),
                type: 'card',
                title: 'Credit/Debit Card',
                subtitle: `•••• •••• •••• ${cardNumber.slice(-4)}`,
                icon: 'card-outline',
                isDefault: paymentMethods.length === 0,
                created: new Date().toISOString()
              };
              const updatedMethods = [...paymentMethods, newMethod];
              AsyncStorage.setItem('paymentMethods', JSON.stringify(updatedMethods));
              setPaymentMethods(updatedMethods);
              Alert.alert('Success', 'Card added successfully');
            } else {
              Alert.alert('Error', 'Please enter a valid card number');
            }
          }
        }
      ],
      'plain-text',
      '1234567890123456'
    );
  };

  const addBankMethod = () => {
    Alert.prompt(
      'Add Bank Account',
      'Enter bank account details (Demo)',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Add', 
          onPress: (accountNumber) => {
            if (accountNumber && accountNumber.length >= 4) {
              const newMethod: PaymentMethod = {
                id: Date.now().toString(),
                type: 'bank',
                title: 'Bank Account',
                subtitle: `Account ending in ${accountNumber.slice(-4)}`,
                icon: 'business-outline',
                isDefault: paymentMethods.length === 0,
                created: new Date().toISOString()
              };
              const updatedMethods = [...paymentMethods, newMethod];
              AsyncStorage.setItem('paymentMethods', JSON.stringify(updatedMethods));
              setPaymentMethods(updatedMethods);
              Alert.alert('Success', 'Bank account added successfully');
            } else {
              Alert.alert('Error', 'Please enter a valid account number');
            }
          }
        }
      ],
      'plain-text',
      '1234567890'
    );
  };

  const addWalletMethod = () => {
    Alert.alert(
      'Add Digital Wallet',
      'Choose wallet type',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Add Wallet', 
          onPress: () => {
            const newMethod: PaymentMethod = {
              id: Date.now().toString(),
              type: 'wallet',
              title: 'Digital Wallet',
              subtitle: 'Mobile money wallet',
              icon: 'wallet-outline',
              isDefault: paymentMethods.length === 0,
              created: new Date().toISOString()
            };
            const updatedMethods = [...paymentMethods, newMethod];
            AsyncStorage.setItem('paymentMethods', JSON.stringify(updatedMethods));
            setPaymentMethods(updatedMethods);
            Alert.alert('Success', 'Digital wallet added successfully');
          }
        }
      ]
    );
  };

  const getMethodColor = (type: string) => {
    switch (type) {
      case 'card': return '#2f75c2';
      case 'bank': return '#27ae60';
      case 'wallet': return '#f39c12';
      default: return '#95a5a6';
    }
  };

  const responsivePadding = Math.max(20, screenDimensions.width * 0.05);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: responsivePadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#1b1b1b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddPaymentMethod}
        >
          <Ionicons name="add" size={24} color="#2f75c2" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: responsivePadding }}>
          {/* Info Card */}
          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark" size={24} color="#27ae60" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Secure Payments</Text>
              <Text style={styles.infoText}>
                Your payment information is encrypted and stored securely
              </Text>
            </View>
          </View>

          {/* Payment Methods */}
          {paymentMethods.map((method) => (
            <View key={method.id} style={styles.methodCard}>
              <View style={styles.methodHeader}>
                <View style={styles.methodInfo}>
                  <View style={[
                    styles.methodIcon, 
                    { backgroundColor: `${getMethodColor(method.type)}15` }
                  ]}>
                    <Ionicons 
                      name={method.icon as any} 
                      size={24} 
                      color={getMethodColor(method.type)} 
                    />
                  </View>
                  <View style={styles.methodDetails}>
                    <View style={styles.methodTitleRow}>
                      <Text style={styles.methodTitle}>{method.title}</Text>
                      {method.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultText}>Default</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.methodSubtitle}>{method.subtitle}</Text>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={styles.moreButton}
                  onPress={() => {
                    Alert.alert(
                      method.title,
                      'Choose an action',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        ...(!method.isDefault ? [
                          {
                            text: 'Set as Default',
                            onPress: () => handleSetDefault(method.id)
                          }
                        ] : []),
                        {
                          text: 'Remove',
                          style: 'destructive',
                          onPress: () => handleRemoveMethod(method.id)
                        }
                      ]
                    );
                  }}
                >
                  <Ionicons name="ellipsis-vertical" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              {method.type === 'card' && (
                <View style={styles.cardPreview}>
                  <Text style={styles.cardNumber}>•••• •••• •••• 1234</Text>
                  <View style={styles.cardRow}>
                    <Text style={styles.cardInfo}>Valid Thru 12/26</Text>
                    <Text style={styles.cardInfo}>VISA</Text>
                  </View>
                </View>
              )}

              {!method.isDefault && (
                <TouchableOpacity
                  style={styles.setDefaultButton}
                  onPress={() => handleSetDefault(method.id)}
                >
                  <Text style={styles.setDefaultText}>Set as Default</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          {/* Add New Method */}
          <TouchableOpacity style={styles.addMethodCard} onPress={handleAddPaymentMethod}>
            <Ionicons name="add-circle-outline" size={32} color="#2f75c2" />
            <Text style={styles.addMethodText}>Add New Payment Method</Text>
            <Text style={styles.addMethodSubtext}>
              Add cards, bank accounts, or digital wallets
            </Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 15,
    backgroundColor: '#f5f5f5',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1b1b1b',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingTop: 10,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  infoContent: {
    marginLeft: 15,
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1b1b1b',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  methodCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  methodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  methodDetails: {
    flex: 1,
  },
  methodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1b1b1b',
    marginRight: 10,
  },
  defaultBadge: {
    backgroundColor: '#2f75c2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  defaultText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  methodSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  moreButton: {
    padding: 5,
  },
  cardPreview: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    marginTop: 15,
    marginBottom: 10,
  },
  cardNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1b1b1b',
    marginBottom: 10,
    letterSpacing: 2,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardInfo: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  setDefaultButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#2f75c2',
    marginTop: 10,
  },
  setDefaultText: {
    fontSize: 12,
    color: '#2f75c2',
    fontWeight: '600',
  },
  addMethodCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  addMethodText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2f75c2',
    marginTop: 10,
    marginBottom: 5,
  },
  addMethodSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 30,
  },
});
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'wallet';
  title: string;
  subtitle: string;
  isDefault: boolean;
}

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    loadPaymentMethods();
    
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      const savedMethods = await AsyncStorage.getItem('paymentMethods');
      if (savedMethods) {
        setPaymentMethods(JSON.parse(savedMethods));
      } else {
        // Set default payment methods
        const defaultMethods: PaymentMethod[] = [
          {
            id: '1',
            type: 'wallet',
            title: 'Brill Prime Wallet',
            subtitle: '₦0.00',
            isDefault: true,
          }
        ];
        setPaymentMethods(defaultMethods);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  const handleAddPaymentMethod = () => {
    router.push('/payment/add-payment-method');
  };

  const handleEditPaymentMethod = (method: PaymentMethod) => {
    Alert.alert('Edit Payment Method', `Editing "${method.title}" - Feature coming soon!`);
  };

  const handleDeletePaymentMethod = (methodId: string) => {
    Alert.alert(
      'Remove Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedMethods = paymentMethods.filter(method => method.id !== methodId);
            setPaymentMethods(updatedMethods);
            AsyncStorage.setItem('paymentMethods', JSON.stringify(updatedMethods));
          }
        }
      ]
    );
  };

  const getPaymentIcon = (type: string) => {
    switch (type) {
      case 'card':
        return 'card-outline';
      case 'bank':
        return 'business-outline';
      case 'wallet':
        return 'wallet-outline';
      default:
        return 'card-outline';
    }
  };

  const PaymentMethodItem = ({ method }: { method: PaymentMethod }) => (
    <View style={styles.paymentItem}>
      <View style={styles.paymentIcon}>
        <Ionicons name={getPaymentIcon(method.type) as any} size={24} color="#4682B4" />
      </View>
      <View style={styles.paymentContent}>
        <View style={styles.paymentHeader}>
          <Text style={styles.paymentTitle}>{method.title}</Text>
          {method.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Default</Text>
            </View>
          )}
        </View>
        <Text style={styles.paymentSubtitle}>{method.subtitle}</Text>
      </View>
      <View style={styles.paymentActions}>
        <TouchableOpacity 
          onPress={() => handleEditPaymentMethod(method)}
          style={styles.actionButton}
        >
          <Ionicons name="pencil" size={18} color="#4682B4" />
        </TouchableOpacity>
        {!method.isDefault && (
          <TouchableOpacity 
            onPress={() => handleDeletePaymentMethod(method.id)}
            style={styles.actionButton}
          >
            <Ionicons name="trash" size={18} color="#e74c3c" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const responsivePadding = Math.max(20, screenDimensions.width * 0.05);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: responsivePadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#1b1b1b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <TouchableOpacity onPress={handleAddPaymentMethod} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#4682B4" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: responsivePadding }}>
          {paymentMethods.length > 0 ? (
            <View style={styles.paymentList}>
              {paymentMethods.map((method) => (
                <PaymentMethodItem key={method.id} method={method} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="card-outline" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>No Payment Methods</Text>
              <Text style={styles.emptySubtitle}>
                Add a payment method to make purchases easier
              </Text>
              <TouchableOpacity style={styles.addFirstButton} onPress={handleAddPaymentMethod}>
                <Text style={styles.addFirstButtonText}>Add Payment Method</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 15,
    backgroundColor: '#f5f5f5',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1b1b1b',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  paymentList: {
    paddingVertical: 10,
  },
  paymentItem: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  paymentIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#f8f9ff',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  paymentContent: {
    flex: 1,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1b1b1b',
    marginRight: 10,
  },
  defaultBadge: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  defaultText: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '500',
  },
  paymentSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  paymentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1b1b1b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  addFirstButton: {
    backgroundColor: '#4682B4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  addFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
