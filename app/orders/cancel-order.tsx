
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../config/theme';

interface CancellationReason {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export default function CancelOrderScreen() {
  const router = useRouter();
  const { orderId, orderTotal } = useLocalSearchParams();
  const [selectedReasonId, setSelectedReasonId] = useState<string | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  const cancellationReasons: CancellationReason[] = [
    {
      id: '1',
      title: 'Changed my mind',
      description: 'No longer need this order',
      icon: 'refresh-outline',
    },
    {
      id: '2',
      title: 'Found a better price',
      description: 'Got a better deal elsewhere',
      icon: 'pricetag-outline',
    },
    {
      id: '3',
      title: 'Delivery taking too long',
      description: 'Expected delivery time is too long',
      icon: 'time-outline',
    },
    {
      id: '4',
      title: 'Ordered by mistake',
      description: 'This was an accidental order',
      icon: 'alert-circle-outline',
    },
    {
      id: '5',
      title: 'Wrong delivery address',
      description: 'Need to change delivery location',
      icon: 'location-outline',
    },
    {
      id: '6',
      title: 'Payment issues',
      description: 'Having problems with payment',
      icon: 'card-outline',
    },
    {
      id: '7',
      title: 'Other reason',
      description: 'Will provide details below',
      icon: 'ellipsis-horizontal-outline',
    },
  ];

  const handleCancelOrder = async () => {
    if (!selectedReasonId) {
      Alert.alert('Error', 'Please select a cancellation reason');
      return;
    }

    const selectedReason = cancellationReasons.find(r => r.id === selectedReasonId);
    
    if (selectedReasonId === '7' && !additionalNotes.trim()) {
      Alert.alert('Error', 'Please provide additional details for cancellation');
      return;
    }

    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? This action cannot be undone.',
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // Here you would call the API to cancel the order
              // await orderService.cancelOrder(orderId, selectedReason.title, additionalNotes);
              
              // Simulate API call
              await new Promise(resolve => setTimeout(resolve, 1500));

              Alert.alert(
                'Order Cancelled',
                'Your order has been cancelled successfully. Refund will be processed within 3-5 business days.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      router.replace('/orders/consumer-orders');
                    },
                  },
                ]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel order. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const isSmallScreen = screenDimensions.width < 400;
  const responsivePadding = Math.max(20, screenDimensions.width * 0.05);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: responsivePadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cancel Order</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: responsivePadding }}>
          {/* Order Info */}
          <View style={styles.orderInfoCard}>
            <View style={styles.orderInfoHeader}>
              <Ionicons name="receipt-outline" size={24} color={theme.colors.primary} />
              <View style={styles.orderInfoText}>
                <Text style={styles.orderIdText}>Order #{orderId}</Text>
                <Text style={styles.orderTotalText}>
                  Total: ₦{parseInt(orderTotal as string || '0').toLocaleString()}
                </Text>
              </View>
            </View>
          </View>

          {/* Cancellation Reasons */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select a reason for cancellation</Text>
            {cancellationReasons.map((reason) => (
              <TouchableOpacity
                key={reason.id}
                style={[
                  styles.reasonCard,
                  selectedReasonId === reason.id && styles.selectedReasonCard,
                ]}
                onPress={() => setSelectedReasonId(reason.id)}
              >
                <View style={styles.reasonIconContainer}>
                  <Ionicons
                    name={reason.icon as any}
                    size={24}
                    color={
                      selectedReasonId === reason.id
                        ? theme.colors.primary
                        : theme.colors.textSecondary
                    }
                  />
                </View>
                <View style={styles.reasonContent}>
                  <Text
                    style={[
                      styles.reasonTitle,
                      selectedReasonId === reason.id && styles.selectedReasonTitle,
                    ]}
                  >
                    {reason.title}
                  </Text>
                  <Text style={styles.reasonDescription}>{reason.description}</Text>
                </View>
                {selectedReasonId === reason.id && (
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Additional Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Additional Notes {selectedReasonId === '7' && <Text style={styles.required}>*</Text>}
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="Provide more details (optional)..."
              value={additionalNotes}
              onChangeText={setAdditionalNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor={theme.colors.textLight}
            />
          </View>

          {/* Refund Info */}
          <View style={styles.refundCard}>
            <Ionicons name="information-circle-outline" size={24} color={theme.colors.info} />
            <View style={styles.refundTextContainer}>
              <Text style={styles.refundTitle}>Refund Information</Text>
              <Text style={styles.refundText}>
                Your refund will be processed to your original payment method within 3-5 business days.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.footer, { paddingHorizontal: responsivePadding }]}>
        <TouchableOpacity
          style={styles.keepOrderButton}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.keepOrderButtonText}>Keep Order</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.cancelButton, loading && styles.cancelButtonDisabled]}
          onPress={handleCancelOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <Text style={styles.cancelButtonText}>Cancel Order</Text>
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
  content: {
    flex: 1,
  },
  orderInfoCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: theme.borderRadius.md,
    padding: 15,
    marginTop: 15,
  },
  orderInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderInfoText: {
    flex: 1,
  },
  orderIdText: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
  },
  orderTotalText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
    marginBottom: 12,
  },
  required: {
    color: theme.colors.error,
  },
  reasonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    padding: 15,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedReasonCard: {
    borderColor: theme.colors.success,
    backgroundColor: '#F0FDF4',
  },
  reasonIconContainer: {
    marginRight: 12,
  },
  reasonContent: {
    flex: 1,
  },
  reasonTitle: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  selectedReasonTitle: {
    color: theme.colors.primary,
  },
  reasonDescription: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: 15,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
    minHeight: 100,
  },
  refundCard: {
    flexDirection: 'row',
    backgroundColor: '#DBEAFE',
    borderRadius: theme.borderRadius.md,
    padding: 15,
    marginTop: 20,
    marginBottom: 20,
    gap: 12,
  },
  refundTextContainer: {
    flex: 1,
  },
  refundTitle: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  refundText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    backgroundColor: theme.colors.background,
  },
  keepOrderButton: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  keepOrderButtonText: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 15,
    alignItems: 'center',
    ...theme.shadows.base,
  },
  cancelButtonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.semiBold,
  },
});
