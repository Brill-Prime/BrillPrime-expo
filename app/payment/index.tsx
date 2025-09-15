
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
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

  const paymentMethods: PaymentMethod[] = [
    {
      id: '1',
      type: 'mastercard',
      cardNumber: '**** **** **** 1234',
      expiry: '02/26'
    },
    {
      id: '2',
      type: 'visa',
      cardNumber: '**** **** **** 1234',
      expiry: '02/26'
    },
    {
      id: '3',
      type: 'apple-pay',
      cardNumber: '**** **** **** 1234',
      expiry: '02/26'
    },
    {
      id: '4',
      type: 'google-pay',
      cardNumber: '**** **** **** 1234',
      expiry: '02/26'
    },
    {
      id: '5',
      type: 'paypal',
      name: 'Anthony Godfrey'
    }
  ];

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
    // TODO: Navigate to add payment method screen
    console.log('Add payment method');
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
          {/* Payment Methods */}
          {paymentMethods.map((method) => (
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
          ))}

          {/* Add Payment Method */}
          <TouchableOpacity style={styles.addPayment} onPress={handleAddPaymentMethod}>
            <Ionicons name="add" size={24} color="#666" />
            <Text style={styles.addPaymentText}>Add Payment Method...</Text>
          </TouchableOpacity>
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
});
