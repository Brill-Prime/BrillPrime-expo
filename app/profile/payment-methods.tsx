
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
    if (method?.isDefault && paymentMethods.length > 1) {
      Alert.alert(
        'Cannot Remove',
        'You cannot remove your default payment method. Please set another method as default first.'
      );
      return;
    }

    Alert.alert(
      'Remove Payment Method',
      'Are you sure you want to remove this payment method?',
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
            } catch (error) {
              console.error('Error removing payment method:', error);
            }
          }
        }
      ]
    );
  };

  const handleAddPaymentMethod = () => {
    Alert.alert(
      'Add Payment Method',
      'This feature will be available soon. You can configure payment methods in the app settings.',
      [{ text: 'OK' }]
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
