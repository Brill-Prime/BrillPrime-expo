
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  SafeAreaView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

export default function VehicleManagement() {
  const router = useRouter();
  const { showError, showSuccess, showConfirmDialog } = useAlert();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo>({
    make: 'Toyota',
    model: 'Camry',
    year: '2020',
    color: 'Silver',
    plateNumber: 'ABC-123-XY',
    registrationNumber: 'REG-2020-12345',
    insuranceNumber: 'INS-2024-67890',
    insuranceExpiry: '2025-12-31',
    registrationExpiry: '2025-06-30',
  });

  const [documents, setDocuments] = useState<VehicleDocument[]>([
    {
      type: 'registration',
      imageUrl: 'https://example.com/registration.jpg',
      uploadDate: '2024-01-15',
      expiryDate: '2025-06-30',
      status: 'valid',
    },
    {
      type: 'insurance',
      imageUrl: 'https://example.com/insurance.jpg',
      uploadDate: '2024-01-15',
      expiryDate: '2025-12-31',
      status: 'valid',
    },
    {
      type: 'roadworthiness',
      imageUrl: 'https://example.com/roadworthy.jpg',
      uploadDate: '2024-01-15',
      expiryDate: '2025-03-15',
      status: 'expiring',
    },
  ]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    loadVehicleData();

    return () => subscription?.remove();
  }, []);

  const loadVehicleData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      // TODO: Implement API call to fetch vehicle data
      // const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/driver/vehicle`, {
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });
    } catch (error) {
      console.error('Error loading vehicle data:', error);
    }
  };

  const handleInputChange = (field: keyof VehicleInfo, value: string) => {
    setVehicleInfo(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!vehicleInfo.make.trim()) {
      showError('Error', 'Vehicle make is required');
      return false;
    }
    if (!vehicleInfo.model.trim()) {
      showError('Error', 'Vehicle model is required');
      return false;
    }
    if (!vehicleInfo.year.trim()) {
      showError('Error', 'Vehicle year is required');
      return false;
    }
    if (!vehicleInfo.plateNumber.trim()) {
      showError('Error', 'Plate number is required');
      return false;
    }
    if (!vehicleInfo.registrationNumber.trim()) {
      showError('Error', 'Registration number is required');
      return false;
    }

    const yearNum = parseInt(vehicleInfo.year);
    const currentYear = new Date().getFullYear();
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear + 1) {
      showError('Error', 'Please enter a valid vehicle year');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      // TODO: Implement API call to update vehicle info
      // const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/driver/vehicle`, {
      //   method: 'PUT',
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(vehicleInfo),
      // });

      showSuccess('Success', 'Vehicle information updated successfully');
      setEditMode(false);
    } catch (error) {
      console.error('Error updating vehicle info:', error);
      showError('Error', 'Failed to update vehicle information');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async (documentType: VehicleDocument['type']) => {
    showConfirmDialog(
      'Upload Document',
      'Choose how you want to upload the document',
      async () => {
        // Camera option
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          await uploadDocumentImage(documentType, result.assets[0].uri);
        }
      },
      'Camera',
      async () => {
        // Gallery option
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          await uploadDocumentImage(documentType, result.assets[0].uri);
        }
      },
      'Gallery'
    );
  };

  const uploadDocumentImage = async (documentType: VehicleDocument['type'], imageUri: string) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      // TODO: Implement API call to upload document
      // const formData = new FormData();
      // formData.append('type', documentType);
      // formData.append('image', { uri: imageUri, type: 'image/jpeg', name: 'document.jpg' });
      
      showSuccess('Success', 'Document uploaded successfully');
      loadVehicleData();
    } catch (error) {
      console.error('Error uploading document:', error);
      showError('Error', 'Failed to upload document');
    } finally {
      setLoading(false);
    }
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
    onChangeText: (text: string) => void;
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
          onPress={() => {
            if (editMode) {
              handleSave();
            } else {
              setEditMode(true);
            }
          }}
          style={styles.editButton}
        >
          <Ionicons
            name={editMode ? 'checkmark' : 'create-outline'}
            size={24}
            color={theme.colors.primary}
          />
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
              onChangeText={(value) => handleInputChange('make', value)}
              placeholder="e.g., Toyota"
              editable={editMode}
            />

            <InputField
              label="Model *"
              value={vehicleInfo.model}
              onChangeText={(value) => handleInputChange('model', value)}
              placeholder="e.g., Camry"
              editable={editMode}
            />

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <InputField
                  label="Year *"
                  value={vehicleInfo.year}
                  onChangeText={(value) => handleInputChange('year', value)}
                  placeholder="2020"
                  editable={editMode}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.halfWidth}>
                <InputField
                  label="Color"
                  value={vehicleInfo.color}
                  onChangeText={(value) => handleInputChange('color', value)}
                  placeholder="Silver"
                  editable={editMode}
                />
              </View>
            </View>

            <InputField
              label="Plate Number *"
              value={vehicleInfo.plateNumber}
              onChangeText={(value) => handleInputChange('plateNumber', value)}
              placeholder="ABC-123-XY"
              editable={editMode}
            />

            <InputField
              label="Registration Number *"
              value={vehicleInfo.registrationNumber}
              onChangeText={(value) => handleInputChange('registrationNumber', value)}
              placeholder="REG-2020-12345"
              editable={editMode}
            />

            <InputField
              label="Insurance Number"
              value={vehicleInfo.insuranceNumber}
              onChangeText={(value) => handleInputChange('insuranceNumber', value)}
              placeholder="INS-2024-67890"
              editable={editMode}
            />

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <InputField
                  label="Insurance Expiry (YYYY-MM-DD)"
                  value={vehicleInfo.insuranceExpiry}
                  onChangeText={(value) => handleInputChange('insuranceExpiry', value)}
                  placeholder="2025-12-31"
                  editable={editMode}
                />
              </View>

              <View style={styles.halfWidth}>
                <InputField
                  label="Registration Expiry (YYYY-MM-DD)"
                  value={vehicleInfo.registrationExpiry}
                  onChangeText={(value) => handleInputChange('registrationExpiry', value)}
                  placeholder="2025-06-30"
                  editable={editMode}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Documents Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Documents</Text>

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
                  onPress={() => handleUploadDocument(document.type)}
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

        {/* Info Card */}
        <View style={styles.infoSection}>
          <View style={styles.infoNotice}>
            <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Important Notice</Text>
              <Text style={styles.infoText}>
                Keep your vehicle documents up to date to avoid delivery restrictions. You'll be notified when documents are expiring.
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
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
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
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
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
