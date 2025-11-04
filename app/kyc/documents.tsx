import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  SafeAreaView,
  Dimensions,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { kycService, DocumentUploadRequest, KYCDocument } from '../../services/kycService';
import { useAlert } from '../../components/AlertProvider';

export default function DocumentsScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: string }>();
  const { showError, showSuccess, showConfirmDialog } = useAlert();

  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [documentNumber, setDocumentNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));

  const documentType = type as KYCDocument['type'];

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const getDocumentInfo = () => {
    switch (documentType) {
      case 'identity':
        return {
          title: 'Identity Document',
          description: 'Upload a government-issued ID (National ID, Passport, or Driver\'s License)',
          requiresBack: true,
          requiresNumber: true,
          requiresExpiry: true,
          examples: ['National ID Card', 'International Passport', 'Driver\'s License']
        };
      case 'address':
        return {
          title: 'Proof of Address',
          description: 'Upload a document showing your current address (not older than 3 months)',
          requiresBack: false,
          requiresNumber: false,
          requiresExpiry: false,
          examples: ['Utility Bill', 'Bank Statement', 'Government Correspondence']
        };
      case 'business':
        return {
          title: 'Business Documents',
          description: 'Upload your business registration certificate and tax documents',
          requiresBack: false,
          requiresNumber: true,
          requiresExpiry: false,
          examples: ['CAC Certificate', 'Tax Identification Number', 'Business License']
        };
      case 'driver_license':
        return {
          title: 'Driver\'s License',
          description: 'Upload your valid driver\'s license',
          requiresBack: true,
          requiresNumber: true,
          requiresExpiry: true,
          examples: ['Valid Driver\'s License']
        };
      case 'vehicle_registration':
        return {
          title: 'Vehicle Registration',
          description: 'Upload your vehicle registration and insurance documents',
          requiresBack: false,
          requiresNumber: true,
          requiresExpiry: false,
          examples: ['Vehicle Registration Certificate', 'Insurance Certificate']
        };
      default:
        return {
          title: 'Document Upload',
          description: 'Upload required documents',
          requiresBack: false,
          requiresNumber: false,
          requiresExpiry: false,
          examples: []
        };
    }
  };

  const documentInfo = getDocumentInfo();

  const pickImage = async (isFront: boolean = true) => {
    showConfirmDialog(
      'Select Image Source',
      'Choose how you want to upload the image',
      async () => {
        // Camera option
        const cameraResult = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

        if (!cameraResult.canceled && cameraResult.assets[0]) {
          if (isFront) {
            setFrontImage(cameraResult.assets[0].uri);
          } else {
            setBackImage(cameraResult.assets[0].uri);
          }
        }
      },
      'Camera',
      async () => {
        // Gallery option
        const galleryResult = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

        if (!galleryResult.canceled && galleryResult.assets[0]) {
          if (isFront) {
            setFrontImage(galleryResult.assets[0].uri);
          } else {
            setBackImage(galleryResult.assets[0].uri);
          }
        }
      },
      'Gallery'
    );
  };

  const pickDocument = async (isFront: boolean = true) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        if (isFront) {
          setFrontImage(result.assets[0].uri);
        } else {
          setBackImage(result.assets[0].uri);
        }
      }
    } catch (error) {
      showError('Error', 'Failed to pick document');
    }
  };

  const validateForm = (): boolean => {
    if (!frontImage) {
      showError('Error', 'Please upload the required document');
      return false;
    }

    if (documentInfo.requiresBack && !backImage) {
      showError('Error', 'Please upload the back side of the document');
      return false;
    }

    if (documentInfo.requiresNumber && !documentNumber.trim()) {
      showError('Error', 'Please enter the document number');
      return false;
    }

    if (documentInfo.requiresExpiry && !expiryDate) {
      showError('Error', 'Please enter the expiry date');
      return false;
    }

    if (documentInfo.requiresExpiry && expiryDate) {
      // Validate expiry date format and ensure it's in the future
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(expiryDate)) {
        showError('Error', 'Please enter expiry date in YYYY-MM-DD format');
        return false;
      }

      const expiryDateObj = new Date(expiryDate);
      const today = new Date();
      if (expiryDateObj <= today) {
        showError('Error', 'Document expiry date must be in the future');
        return false;
      }
    }

    return true;
  };

  const handleUpload = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const uploadData: DocumentUploadRequest = {
        type: documentType,
        frontImage: frontImage!,
        backImage: backImage || undefined,
        documentNumber: documentNumber || undefined,
        expiryDate: expiryDate || undefined,
      };

      const response = await kycService.uploadDocument(uploadData);

      if (response.success) {
        showSuccess('Success', 'Document uploaded successfully');
        router.back();
      } else {
        showError('Error', response.error || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      showError('Error', 'Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  const ImageUploadCard = ({ 
    title, 
    image, 
    onPress,
    isRequired = true 
  }: { 
    title: string; 
    image: string | null; 
    onPress: () => void;
    isRequired?: boolean;
  }) => (
    <TouchableOpacity style={styles.uploadCard} onPress={onPress}>
      {image ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.uploadedImage} resizeMode="cover" />
          <TouchableOpacity style={styles.removeButton} onPress={() => {
            if (title.includes('Front')) {
              setFrontImage(null);
            } else {
              setBackImage(null);
            }
          }}>
            <Image 
              source={require('../../assets/images/delete_icon_white.png')}
              style={{ width: 16, height: 16 }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.uploadPlaceholder}>
          <Image 
            source={require('../../assets/images/camera_icon.png')}
            style={{ width: 32, height: 32 }}
            resizeMode="contain"
          />
          <Text style={styles.uploadText}>{title}</Text>
          {isRequired && <Text style={styles.requiredText}>*Required</Text>}
        </View>
      )}
    </TouchableOpacity>
  );

  const responsivePadding = Math.max(20, screenDimensions.width * 0.05);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: responsivePadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#1b1b1b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{documentInfo.title}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: responsivePadding }}>
          {/* Description */}
          <View style={styles.descriptionCard}>
            <Text style={styles.description}>{documentInfo.description}</Text>

            {documentInfo.examples.length > 0 && (
              <View style={styles.examplesContainer}>
                <Text style={styles.examplesTitle}>Accepted Documents:</Text>
                {documentInfo.examples.map((example, index) => (
                  <Text key={index} style={styles.exampleItem}>• {example}</Text>
                ))}
              </View>
            )}
          </View>

          {/* Upload Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upload Documents</Text>

            <View style={styles.uploadGrid}>
              <ImageUploadCard
                title="Front Side"
                image={frontImage}
                onPress={() => pickImage(true)}
                isRequired={true}
              />

              {documentInfo.requiresBack && (
                <ImageUploadCard
                  title="Back Side"
                  image={backImage}
                  onPress={() => pickImage(false)}
                  isRequired={true}
                />
              )}
            </View>

            {/* Document Number */}
            {documentInfo.requiresNumber && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Document Number *</Text>
                <TextInput
                  style={styles.input}
                  value={documentNumber}
                  onChangeText={setDocumentNumber}
                  placeholder="Enter document number"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            )}

            {/* Expiry Date */}
            {documentInfo.requiresExpiry && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Expiry Date * (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  value={expiryDate}
                  onChangeText={setExpiryDate}
                  placeholder="2025-12-31"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            )}
          </View>

          {/* Guidelines */}
          <View style={styles.guidelinesCard}>
            <Ionicons name="information-circle" size={24} color="#4682B4" />
            <View style={styles.guidelinesContent}>
              <Text style={styles.guidelinesTitle}>Upload Guidelines</Text>
              <Text style={styles.guidelinesText}>
                • Ensure all text is clearly visible{'\n'}
                • No glare or shadows on the document{'\n'}
                • Image should be in focus{'\n'}
                • File size should be less than 5MB{'\n'}
                • Supported formats: JPEG, PNG, PDF
              </Text>
            </View>
          </View>

          {/* Upload Button */}
          <TouchableOpacity 
            style={[styles.uploadButton, loading && styles.disabledButton]}
            onPress={handleUpload}
            disabled={loading}
          >
            <Text style={styles.uploadButtonText}>
              {loading ? 'Uploading...' : 'Upload Document'}
            </Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>
    </SafeAreaView>
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1b1b1b',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  descriptionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 15,
  },
  examplesContainer: {
    marginTop: 10,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1b1b1b',
    marginBottom: 8,
  },
  exampleItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1b1b1b',
    marginBottom: 20,
  },
  uploadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  uploadCard: {
    flex: 1,
    minWidth: 150,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  uploadText: {
    fontSize: 14,
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
  },
  requiredText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
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
  guidelinesCard: {
    backgroundColor: '#f8f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  guidelinesContent: {
    flex: 1,
    marginLeft: 12,
  },
  guidelinesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1b1b1b',
    marginBottom: 6,
  },
  guidelinesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  uploadButton: {
    backgroundColor: '#4682B4',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 30,
  },
});