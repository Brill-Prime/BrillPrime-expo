
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { kycService, PersonalInfoRequest } from '../../services/kycService';
import { useAlert } from '../../components/AlertProvider';

export default function PersonalInfoScreen() {
  const router = useRouter();
  const { showError, showSuccess } = useAlert();
  const [formData, setFormData] = useState<PersonalInfoRequest>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    nationality: 'Nigeria',
    occupation: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: 'Nigeria',
      postalCode: '',
    },
  });
  const [loading, setLoading] = useState(false);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parentField, childField] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parentField]: {
          ...prev[parentField as keyof PersonalInfoRequest],
          [childField]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      showError('Error', 'First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      showError('Error', 'Last name is required');
      return false;
    }
    if (!formData.dateOfBirth) {
      showError('Error', 'Date of birth is required');
      return false;
    }
    if (!formData.address.street.trim()) {
      showError('Error', 'Street address is required');
      return false;
    }
    if (!formData.address.city.trim()) {
      showError('Error', 'City is required');
      return false;
    }
    if (!formData.address.state.trim()) {
      showError('Error', 'State is required');
      return false;
    }

    // Validate date of birth format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(formData.dateOfBirth)) {
      showError('Error', 'Please enter date in YYYY-MM-DD format');
      return false;
    }

    // Check if user is at least 18 years old
    const birthDate = new Date(formData.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (age < 18 || (age === 18 && monthDiff < 0) || (age === 18 && monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      showError('Error', 'You must be at least 18 years old');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await kycService.updatePersonalInfo(formData);
      
      if (response.success) {
        showSuccess('Success', 'Personal information saved successfully');
        router.back();
      } else {
        showError('Error', response.error || 'Failed to save personal information');
      }
    } catch (error) {
      console.error('Error saving personal info:', error);
      showError('Error', 'Failed to save personal information');
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ 
    label, 
    value, 
    onChangeText, 
    placeholder, 
    keyboardType = 'default',
    multiline = false,
    numberOfLines = 1,
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    multiline?: boolean;
    numberOfLines?: number;
  }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
      />
    </View>
  );

  const responsivePadding = Math.max(20, screenDimensions.width * 0.05);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: responsivePadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#1b1b1b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Information</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: responsivePadding }}>
          {/* Personal Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Details</Text>
            
            <InputField
              label="First Name *"
              value={formData.firstName}
              onChangeText={(value) => handleInputChange('firstName', value)}
              placeholder="Enter your first name"
            />

            <InputField
              label="Last Name *"
              value={formData.lastName}
              onChangeText={(value) => handleInputChange('lastName', value)}
              placeholder="Enter your last name"
            />

            <InputField
              label="Date of Birth * (YYYY-MM-DD)"
              value={formData.dateOfBirth}
              onChangeText={(value) => handleInputChange('dateOfBirth', value)}
              placeholder="1990-01-01"
            />

            <InputField
              label="Nationality"
              value={formData.nationality}
              onChangeText={(value) => handleInputChange('nationality', value)}
              placeholder="Nigeria"
            />

            <InputField
              label="Occupation"
              value={formData.occupation}
              onChangeText={(value) => handleInputChange('occupation', value)}
              placeholder="Enter your occupation"
            />
          </View>

          {/* Address Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address Information</Text>
            
            <InputField
              label="Street Address *"
              value={formData.address.street}
              onChangeText={(value) => handleInputChange('address.street', value)}
              placeholder="Enter your street address"
              multiline
              numberOfLines={2}
            />

            <InputField
              label="City *"
              value={formData.address.city}
              onChangeText={(value) => handleInputChange('address.city', value)}
              placeholder="Enter your city"
            />

            <InputField
              label="State *"
              value={formData.address.state}
              onChangeText={(value) => handleInputChange('address.state', value)}
              placeholder="Enter your state"
            />

            <InputField
              label="Country"
              value={formData.address.country}
              onChangeText={(value) => handleInputChange('address.country', value)}
              placeholder="Nigeria"
            />

            <InputField
              label="Postal Code"
              value={formData.address.postalCode}
              onChangeText={(value) => handleInputChange('address.postalCode', value)}
              placeholder="Enter postal code"
              keyboardType="numeric"
            />
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color="#4682B4" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Important Notice</Text>
              <Text style={styles.infoText}>
                Please ensure all information is accurate and matches your official documents. 
                This information will be used for identity verification.
              </Text>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity 
            style={[styles.saveButton, loading && styles.disabledButton]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save Information'}
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
    fontSize: 20,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  infoCard: {
    backgroundColor: '#f8f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
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
  saveButton: {
    backgroundColor: '#4682B4',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 30,
  },
});
