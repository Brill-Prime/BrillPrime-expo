
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { paymentService } from '../../services/paymentService';
import { useAlert } from '../../components/AlertProvider';
import { theme } from '../../config/theme';

export default function ManagePaymentMethods() {
  const router = useRouter();
  const { showSuccess, showError, showConfirmDialog } = useAlert();
  const [loading, setLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getPaymentMethods();
      if (response.success && response.data) {
        setPaymentMethods(response.data);
      }
    } catch (error) {
      showError('Error', 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = () => {
    router.push('/payment/add-payment-method');
  };

  const handleDeleteMethod = (methodId: string) => {
    showConfirmDialog(
      'Delete Payment Method',
      'Are you sure you want to remove this payment method?',
      async () => {
        try {
          const response = await paymentService.removePaymentMethod(methodId);
          if (response.success) {
            showSuccess('Success', 'Payment method removed');
            loadPaymentMethods();
          }
        } catch (error) {
          showError('Error', 'Failed to remove payment method');
        }
      }
    );
  };

  const handleSetDefault = async (methodId: string) => {
    try {
      const response = await paymentService.setDefaultPaymentMethod(methodId);
      if (response.success) {
        showSuccess('Success', 'Default payment method updated');
        loadPaymentMethods();
      }
    } catch (error) {
      showError('Error', 'Failed to update default method');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {paymentMethods.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="card-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No payment methods added</Text>
          </View>
        ) : (
          paymentMethods.map((method) => (
            <View key={method.id} style={styles.methodCard}>
              <View style={styles.methodInfo}>
                <Ionicons 
                  name={method.type === 'CARD' ? 'card' : 'business'} 
                  size={24} 
                  color={theme.colors.primary} 
                />
                <View style={styles.methodDetails}>
                  <Text style={styles.methodType}>
                    {method.type === 'CARD' ? 'Card' : 'Bank Transfer'}
                  </Text>
                  {method.last4 && (
                    <Text style={styles.methodNumber}>•••• {method.last4}</Text>
                  )}
                  {method.accountNumber && (
                    <Text style={styles.methodNumber}>{method.accountNumber}</Text>
                  )}
                </View>
              </View>
              
              <View style={styles.methodActions}>
                {!method.isDefault && (
                  <TouchableOpacity 
                    onPress={() => handleSetDefault(method.id)}
                    style={styles.actionButton}
                  >
                    <Text style={styles.actionText}>Set Default</Text>
                  </TouchableOpacity>
                )}
                {method.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Default</Text>
                  </View>
                )}
                <TouchableOpacity 
                  onPress={() => handleDeleteMethod(method.id)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash" size={20} color="#f44336" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.addButton} onPress={handleAddPaymentMethod}>
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Add Payment Method</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  methodCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodDetails: {
    marginLeft: 12,
  },
  methodType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  methodNumber: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  methodActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  actionText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  defaultBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  defaultText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 6,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    marginHorizontal: 20,
    marginBottom: 30,
    paddingVertical: 16,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
