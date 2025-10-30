import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert, // Import Alert for the previous placeholder
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface PaymentMethod {
  id: string;
  type: 'mastercard' | 'visa' | 'apple-pay' | 'google-pay' | 'paypal';
  cardNumber?: string;
  expiry?: string;
  name?: string;
}

export default function PaymentMethodScreen() {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentMethods();

    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const { paymentService } = await import('../../services/paymentService');

      const response = await paymentService.getPaymentMethods();

      if (response.success && response.data) {
        const transformedMethods: PaymentMethod[] = response.data.map(method => ({
          id: method.id,
          type: method.type === 'card' ? (method.brand?.toLowerCase() as any) || 'visa' : method.type as any,
          cardNumber: method.last4 ? `**** **** **** ${method.last4}` : undefined,
          expiry: method.expiryMonth && method.expiryYear ? 
            `${method.expiryMonth.toString().padStart(2, '0')}/${method.expiryYear.toString().slice(-2)}` : undefined,
          name: method.type !== 'card' ? 'Account Holder' : undefined
        }));

        setPaymentMethods(transformedMethods);
      } else {
        setPaymentMethods([]);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
      setPaymentMethods([]);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentIcon = (type: string) => {
    switch (type) {
      case 'mastercard': return 'card';
      case 'visa': return 'card';
      case 'apple-pay': return 'logo-apple';
      case 'google-pay': return 'logo-google';
      case 'paypal': return 'logo-paypal';
      default: return 'card';
    }
  };

  const getPaymentColor = (type: string) => {
    switch (type) {
      case 'mastercard': return '#eb001b';
      case 'visa': return '#1a1f71';
      case 'apple-pay': return '#000';
      case 'google-pay': return '#4285f4';
      case 'paypal': return '#003087';
      default: return '#666';
    }
  };

  const handleSelectMethod = (methodId: string) => {
    setSelectedMethod(methodId);
    // Navigate back to cart with selected payment method
    router.back();
  };

  const handleAddPaymentMethod = () => {
    router.push('/payment/add-payment-method');
  };

  const handleManageMethods = () => {
    router.push('/payment/manage-methods');
  };

  const responsivePadding = Math.max(20, screenDimensions.width * 0.05);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: responsivePadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Payment Method</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: responsivePadding }}>
          {loading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ color: '#666', marginBottom: 10 }}>Loading payment methods...</Text>
            </View>
          ) : paymentMethods.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Ionicons name="card-outline" size={48} color="#ccc" />
              <Text style={{ color: '#666', marginTop: 16, textAlign: 'center' }}>No payment methods found</Text>
              <Text style={{ color: '#999', marginTop: 8, textAlign: 'center' }}>Add a payment method to get started</Text>
            </View>
          ) : (
            paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentMethod,
                selectedMethod === method.id && styles.selectedPaymentMethod
              ]}
              onPress={() => handleSelectMethod(method.id)}
            >
              <View style={[styles.paymentIcon, { backgroundColor: getPaymentColor(method.type) }]}>
                <Ionicons 
                  name={getPaymentIcon(method.type)} 
                  size={20} 
                  color="white" 
                />
              </View>

              <View style={styles.paymentInfo}>
                {method.cardNumber && (
                  <Text style={styles.cardNumber}>{method.cardNumber}</Text>
                )}
                {method.expiry && (
                  <Text style={styles.expiry}>{method.expiry}</Text>
                )}
                {method.name && (
                  <Text style={styles.cardNumber}>{method.name}</Text>
                )}
              </View>

              {selectedMethod === method.id && (
                <Ionicons name="checkmark-circle" size={24} color="#4285f4" />
              )}
            </TouchableOpacity>
            ))
          )}

          {/* Add Payment Method */}
          <ScrollView style={styles.methodsList}>
            <TouchableOpacity 
              style={styles.methodOption}
              onPress={() => router.push('/payment/add-payment-method')}
            >
              <Ionicons name="card-outline" size={24} color="#007AFF" />
              <View style={styles.methodInfo}>
                <Text style={styles.methodTitle}>Add Card</Text>
                <Text style={styles.methodDescription}>Debit or Credit Card</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.methodOption}
              onPress={() => router.push('/payment/add-bank-details')}
            >
              <Ionicons name="business-outline" size={24} color="#007AFF" />
              <View style={styles.methodInfo}>
                <Text style={styles.methodTitle}>Add Bank Account</Text>
                <Text style={styles.methodDescription}>For direct transfers</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.methodOption}
              onPress={() => {
                Alert.alert(
                  'Mobile Money',
                  'Mobile money integration coming soon!',
                  [{ text: 'OK' }]
                );
              }}
            >
              <Ionicons name="phone-portrait-outline" size={24} color="#007AFF" />
              <View style={styles.methodInfo}>
                <Text style={styles.methodTitle}>Mobile Money</Text>
                <Text style={styles.methodDescription}>Coming Soon</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          </ScrollView>
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
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
  },
  selectedPaymentMethod: {
    borderColor: '#4285f4',
    backgroundColor: '#f8f9ff',
  },
  paymentIcon: {
    width: 40,
    height: 25,
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentInfo: {
    flex: 1,
  },
  cardNumber: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
    fontWeight: '500',
  },
  expiry: {
    fontSize: 12,
    color: '#666',
  },
  addPayment: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    marginTop: 10,
    backgroundColor: '#fff',
  },
  addPaymentText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  methodsList: {
    flex: 1,
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  methodInfo: {
    flex: 1,
    marginLeft: 12,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 14,
    color: '#666',
  },
});