import { withRoleAccess } from '../../components/withRoleAccess';

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../config/theme';
import { useAlert } from '../../components/AlertProvider';
import { orderService } from '../../services/orderService';

interface VehicleInfo {
  vehicleType: string;
  plateNumber: string;
}

function VehicleManagement() {
  const router = useRouter();
  const { showError } = useAlert();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo>({
    vehicleType: '',
    plateNumber: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    let active = true;
    let unsubscribe: (() => void) | undefined;
    const loadVehicle = async () => {
      setLoadError(null);
      const result = await orderService.getDriverProfile();
      if (!active) return null;
      if (!result.success || !result.data) {
        setLoadError(result.error || 'Unable to load vehicle profile.');
        return null;
      }

      setVehicleInfo(current => ({
        ...current,
        vehicleType: result.data.vehicle_type || '',
        plateNumber: result.data.vehicle_plate || '',
      }));
      return result.data.id;
    };

    void (async () => {
      try {
        const driverId = await loadVehicle();
        if (active && driverId) {
          unsubscribe = orderService.subscribeToDriverProfile(driverId, () => {
            void loadVehicle();
          });
        }
      } catch (error) {
        console.error('Error loading vehicle profile:', error);
        if (active) setLoadError('Unable to load vehicle profile.');
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
      subscription?.remove();
      unsubscribe?.();
    };
  }, []);

  const showUnavailableMessage = () => {
    showError('Unavailable', 'Vehicle updates and document uploads are not connected to secure storage yet.');
  };

  const retryLoadVehicle = async () => {
    setIsLoading(true);
    setLoadError(null);
    const result = await orderService.getDriverProfile();
    if (result.success && result.data) {
      setVehicleInfo({
        vehicleType: result.data.vehicle_type || '',
        plateNumber: result.data.vehicle_plate || '',
      });
    } else {
      setLoadError(result.error || 'Unable to load vehicle profile.');
    }
    setIsLoading(false);
  };

  const InputField = ({
    label,
    value,
    onChangeText,
    placeholder,
    editable = true,
    keyboardType = 'default',
  }: {
    label: string;
    value: string;
    onChangeText?: (text: string) => void;
    placeholder: string;
    editable?: boolean;
    keyboardType?: 'default' | 'numeric';
  }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, !editable && styles.inputDisabled]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        editable={editable}
        keyboardType={keyboardType}
      />
    </View>
  );

  const styles = getResponsiveStyles(screenData);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#1b1b1b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vehicle Management</Text>
        <TouchableOpacity
          onPress={showUnavailableMessage}
          style={styles.editButton}
          accessibilityLabel="Vehicle editing unavailable"
        >
          <Ionicons name="lock-closed-outline" size={22} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Vehicle Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Information</Text>

          <View style={styles.infoCard}>
            {isLoading ? (
              <Text style={styles.emptyDocuments}>Loading vehicle profile...</Text>
            ) : loadError ? (
              <View>
                <Text style={styles.emptyDocuments}>{loadError}</Text>
                <TouchableOpacity onPress={() => void retryLoadVehicle()}>
                  <Text style={styles.label}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <InputField
                  label="Vehicle Type"
                  value={vehicleInfo.vehicleType}
                  placeholder="Not provided"
                  editable={false}
                />
                <InputField
                  label="Plate Number"
                  value={vehicleInfo.plateNumber}
                  placeholder="Not provided"
                  editable={false}
                />
              </>
            )}
          </View>
        </View>

        {/* Documents Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Documents</Text>

          <Text style={styles.emptyDocuments}>
            Vehicle registration and insurance documents are not stored by the current backend.
          </Text>
        </View>

        {/* Availability notice */}
        <View style={styles.infoSection}>
          <View style={styles.infoNotice}>
            <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Important Notice</Text>
              <Text style={styles.infoText}>
                Vehicle type and plate are read from your driver profile. Registration, insurance, and document verification are unavailable because the backend does not store those records.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const getResponsiveStyles = (screenData: any) => {
  const { width } = screenData;
  const responsivePadding = Math.max(20, width * 0.05);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: responsivePadding,
      paddingTop: 60,
      paddingBottom: 15,
      backgroundColor: '#f5f5f5',
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#1b1b1b',
      flex: 1,
      textAlign: 'center',
    },
    editButton: {
      padding: 8,
    },
    content: {
      flex: 1,
    },
    section: {
      paddingHorizontal: responsivePadding,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#1b1b1b',
      marginBottom: 15,
    },
    infoCard: {
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 20,
      boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
      elevation: 5,
    },
    inputContainer: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: '#374151',
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: '#D1D5DB',
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: '#111827',
      backgroundColor: '#fff',
    },
    inputDisabled: {
      backgroundColor: '#f9fafb',
      color: '#6b7280',
    },
    row: {
      flexDirection: 'row',
      gap: 12,
    },
    halfWidth: {
      flex: 1,
    },
    documentCard: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      elevation: 3,
    },
    emptyDocuments: {
      backgroundColor: '#fff',
      borderRadius: 8,
      padding: 16,
      color: '#666',
    },
    documentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    documentLeft: {
      flexDirection: 'row',
      flex: 1,
    },
    documentInfo: {
      marginLeft: 12,
      flex: 1,
    },
    documentTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#111827',
      marginBottom: 4,
    },
    documentDate: {
      fontSize: 12,
      color: '#6b7280',
      marginBottom: 2,
    },
    documentExpiry: {
      fontSize: 12,
      color: '#6b7280',
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 10,
      fontWeight: '600',
      color: 'white',
    },
    documentActions: {
      flexDirection: 'row',
      gap: 12,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: '#f3f4f6',
      gap: 6,
    },
    actionButtonText: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.colors.primary,
    },
    infoSection: {
      paddingHorizontal: responsivePadding,
      marginBottom: 20,
    },
    infoNotice: {
      backgroundColor: '#f8f9ff',
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    infoContent: {
      flex: 1,
      marginLeft: 12,
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#1b1b1b',
      marginBottom: 6,
    },
    infoText: {
      fontSize: 14,
      color: '#666',
      lineHeight: 20,
    },
    bottomSpacing: {
      height: 30,
    },
  });
};

export default withRoleAccess(VehicleManagement, {
  requiredRole: 'driver',
  fallbackRoute: '/home/consumer',
  showUnauthorizedMessage: true,
});
