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

interface VehicleInfo {
  make: string;
  model: string;
  year: string;
  color: string;
  plateNumber: string;
  registrationNumber: string;
  insuranceNumber: string;
  insuranceExpiry: string;
  registrationExpiry: string;
}

interface VehicleDocument {
  type: 'registration' | 'insurance' | 'roadworthiness';
  imageUrl: string;
  uploadDate: string;
  expiryDate?: string;
  status: 'valid' | 'expiring' | 'expired';
}

function VehicleManagement() {
  const router = useRouter();
  const { showError } = useAlert();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));

  const vehicleInfo: VehicleInfo = {
    make: '',
    model: '',
    year: '',
    color: '',
    plateNumber: '',
    registrationNumber: '',
    insuranceNumber: '',
    insuranceExpiry: '',
    registrationExpiry: '',
  };

  const documents: VehicleDocument[] = [];

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, []);

  const showUnavailableMessage = () => {
    showError('Unavailable', 'Vehicle updates and document uploads are not connected to secure storage yet.');
  };

  const getDocumentLabel = (type: string) => {
    switch (type) {
      case 'registration':
        return 'Vehicle Registration';
      case 'insurance':
        return 'Insurance Certificate';
      case 'roadworthiness':
        return 'Roadworthiness Certificate';
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return '#10b981';
      case 'expiring':
        return '#f59e0b';
      case 'expired':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
            <InputField
              label="Make *"
              value={vehicleInfo.make}
              placeholder="e.g., Toyota"
              editable={false}
            />

            <InputField
              label="Model *"
              value={vehicleInfo.model}
              placeholder="e.g., Camry"
              editable={false}
            />

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <InputField
                  label="Year *"
                  value={vehicleInfo.year}
                  placeholder="2020"
                  editable={false}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.halfWidth}>
                <InputField
                  label="Color"
                  value={vehicleInfo.color}
                  placeholder="Silver"
                  editable={false}
                />
              </View>
            </View>

            <InputField
              label="Plate Number *"
              value={vehicleInfo.plateNumber}
              placeholder="ABC-123-XY"
              editable={false}
            />

            <InputField
              label="Registration Number *"
              value={vehicleInfo.registrationNumber}
              placeholder="REG-2020-12345"
              editable={false}
            />

            <InputField
              label="Insurance Number"
              value={vehicleInfo.insuranceNumber}
              placeholder="INS-2024-67890"
              editable={false}
            />

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <InputField
                  label="Insurance Expiry (YYYY-MM-DD)"
                  value={vehicleInfo.insuranceExpiry}
                  placeholder="2025-12-31"
                  editable={false}
                />
              </View>

              <View style={styles.halfWidth}>
                <InputField
                  label="Registration Expiry (YYYY-MM-DD)"
                  value={vehicleInfo.registrationExpiry}
                  placeholder="2025-06-30"
                  editable={false}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Documents Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Documents</Text>

          {documents.length === 0 && (
            <Text style={styles.emptyDocuments}>No vehicle documents are available.</Text>
          )}

          {documents.map((document, index) => (
            <View key={index} style={styles.documentCard}>
              <View style={styles.documentHeader}>
                <View style={styles.documentLeft}>
                  <Ionicons name="document-text-outline" size={24} color={theme.colors.primary} />
                  <View style={styles.documentInfo}>
                    <Text style={styles.documentTitle}>{getDocumentLabel(document.type)}</Text>
                    <Text style={styles.documentDate}>
                      Uploaded: {formatDate(document.uploadDate)}
                    </Text>
                    {document.expiryDate && (
                      <Text style={styles.documentExpiry}>
                        Expires: {formatDate(document.expiryDate)}
                      </Text>
                    )}
                  </View>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(document.status) },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                  </Text>
                </View>
              </View>

              <View style={styles.documentActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={showUnavailableMessage}
                >
                  <Ionicons name="cloud-upload-outline" size={18} color={theme.colors.primary} />
                  <Text style={styles.actionButtonText}>Re-upload</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="eye-outline" size={18} color={theme.colors.primary} />
                  <Text style={styles.actionButtonText}>View</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Availability notice */}
        <View style={styles.infoSection}>
          <View style={styles.infoNotice}>
            <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Important Notice</Text>
              <Text style={styles.infoText}>
                Vehicle details and documents are not connected to secure storage yet. No verification or expiry status is being reported.
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
