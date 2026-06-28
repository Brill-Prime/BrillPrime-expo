
import React, { useState, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../config/theme';
import { validateAddress } from '../../utils/validation';

interface SavedAddress {
  id: string;
  label: string;
  address: string;
  city: string;
  state: string;
  isDefault: boolean;
}

export default function ChangeAddressScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams();
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [customAddress, setCustomAddress] = useState('');
  const [useCustomAddress, setUseCustomAddress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    loadSavedAddresses();

    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const loadSavedAddresses = async () => {
    try {
      const addressesData = await AsyncStorage.getItem('savedAddresses');
      if (addressesData) {
        setSavedAddresses(JSON.parse(addressesData));
      } else {
        // Mock addresses for demonstration
        const mockAddresses: SavedAddress[] = [
          {
            id: '1',
            label: 'Home',
            address: '123 Main Street',
            city: 'Lagos',
            state: 'Lagos State',
            isDefault: true,
          },
          {
            id: '2',
            label: 'Office',
            address: '456 Business Avenue',
            city: 'Abuja',
            state: 'FCT',
            isDefault: false,
          },
        ];
        setSavedAddresses(mockAddresses);
        setSelectedAddressId(mockAddresses[0].id);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
    }
  };

  const handleConfirmChange = async () => {
    if (!useCustomAddress && !selectedAddressId) {
      Alert.alert('Error', 'Please select a delivery address');
      return;
    }

    if (useCustomAddress) {
      const validation = validateAddress(customAddress);
      if (!validation.isValid) {
        Alert.alert('Error', validation.error || 'Please enter a valid address');
        return;
      }
    }

    Alert.alert(
      'Change Delivery Address',
      'Are you sure you want to change the delivery address for this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setLoading(true);
            try {
              // Here you would call the API to update the order address
              // await orderService.updateOrderAddress(orderId, newAddress);
              
              // Simulate API call
              await new Promise(resolve => setTimeout(resolve, 1500));

              Alert.alert(
                'Success',
                'Delivery address updated successfully',
                [
                  {
                    text: 'OK',
                    onPress: () => router.back(),
                  },
                ]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to update delivery address');
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
        <Text style={styles.headerTitle}>Change Delivery Address</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: responsivePadding }}>
          {/* Order Info */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={24} color={theme.colors.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Order #{orderId}</Text>
              <Text style={styles.infoText}>
                Update the delivery address for this order. The driver will be notified of the change.
              </Text>
            </View>
          </View>

          {/* Saved Addresses */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Saved Addresses</Text>
            {savedAddresses.map((address) => (
              <TouchableOpacity
                key={address.id}
                style={[
                  styles.addressCard,
                  selectedAddressId === address.id && !useCustomAddress && styles.selectedAddress,
                ]}
                onPress={() => {
                  setSelectedAddressId(address.id);
                  setUseCustomAddress(false);
                }}
              >
                <View style={styles.addressHeader}>
                  <View style={styles.addressLabelContainer}>
                    <Ionicons
                      name={address.isDefault ? 'home' : 'location'}
                      size={20}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.addressLabel}>{address.label}</Text>
                    {address.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                  </View>
                  {selectedAddressId === address.id && !useCustomAddress && (
                    <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
                  )}
                </View>
                <Text style={styles.addressText}>{address.address}</Text>
                <Text style={styles.addressSubtext}>
                  {address.city}, {address.state}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Address */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.customAddressToggle,
                useCustomAddress && styles.customAddressToggleActive,
              ]}
              onPress={() => setUseCustomAddress(!useCustomAddress)}
            >
              <Ionicons
                name={useCustomAddress ? 'checkbox' : 'square-outline'}
                size={24}
                color={useCustomAddress ? theme.colors.primary : theme.colors.textSecondary}
              />
              <Text style={styles.customAddressToggleText}>Use a different address</Text>
            </TouchableOpacity>

            {useCustomAddress && (
              <View style={styles.customAddressInput}>
                <Text style={styles.inputLabel}>Enter New Address</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter full delivery address..."
                  value={customAddress}
                  onChangeText={setCustomAddress}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholderTextColor={theme.colors.textLight}
                />
              </View>
            )}
          </View>

          {/* Warning */}
          <View style={styles.warningCard}>
            <Ionicons name="warning-outline" size={24} color={theme.colors.warning} />
            <Text style={styles.warningText}>
              Changing the delivery address may affect delivery time and fees.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Confirm Button */}
      <View style={[styles.footer, { paddingHorizontal: responsivePadding }]}>
        <TouchableOpacity
          style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
          onPress={handleConfirmChange}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <Text style={styles.confirmButtonText}>Confirm Change</Text>
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
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: theme.borderRadius.md,
    padding: 15,
    marginTop: 15,
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    lineHeight: 20,
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
  addressCard: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    padding: 15,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedAddress: {
    borderColor: theme.colors.success,
    backgroundColor: '#F0FDF4',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressLabel: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
  },
  defaultBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  defaultBadgeText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.medium,
  },
  addressText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
    marginBottom: 4,
  },
  addressSubtext: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  customAddressToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 15,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    marginBottom: 15,
  },
  customAddressToggleActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  customAddressToggleText: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
  },
  customAddressInput: {
    marginTop: 5,
  },
  inputLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
    marginBottom: 8,
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
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderRadius: theme.borderRadius.md,
    padding: 15,
    marginTop: 20,
    marginBottom: 20,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
  },
  warningText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: '#92400E',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    backgroundColor: theme.colors.background,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 15,
    alignItems: 'center',
    ...theme.shadows.base,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.semiBold,
  },
});
