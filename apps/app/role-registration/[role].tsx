import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { roleManagementService } from '../../services/roleManagementService';
import { RoleRegistrationRequest } from '../../services/types';
import { theme } from '../../config/theme';

export default function RoleRegistrationScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  
  const [merchantData, setMerchantData] = useState({
    businessName: '',
    businessType: '',
    businessAddress: '',
    licenseNumber: '',
  });

  const [driverData, setDriverData] = useState({
    licenseNumber: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    licensePlate: '',
    insurance: '',
  });

  const validateMerchantForm = () => {
    if (!merchantData.businessName.trim()) {
      Alert.alert('Validation Error', 'Business name is required');
      return false;
    }
    if (!merchantData.businessType.trim()) {
      Alert.alert('Validation Error', 'Business type is required');
      return false;
    }
    if (!merchantData.businessAddress.trim()) {
      Alert.alert('Validation Error', 'Business address is required');
      return false;
    }
    return true;
  };

  const validateDriverForm = () => {
    if (!driverData.licenseNumber.trim()) {
      Alert.alert('Validation Error', 'License number is required');
      return false;
    }
    if (!driverData.vehicleMake.trim() || !driverData.vehicleModel.trim()) {
      Alert.alert('Validation Error', 'Vehicle make and model are required');
      return false;
    }
    if (!driverData.licensePlate.trim()) {
      Alert.alert('Validation Error', 'License plate is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (role !== 'merchant' && role !== 'driver') {
      Alert.alert('Error', 'Invalid role');
      return;
    }

    let isValid = false;
    if (role === 'merchant') {
      isValid = validateMerchantForm();
    } else {
      isValid = validateDriverForm();
    }

    if (!isValid) return;

    setIsLoading(true);
    try {
      const request: RoleRegistrationRequest = {
        role: role as 'merchant' | 'driver',
        ...(role === 'merchant' && {
          businessName: merchantData.businessName,
          businessType: merchantData.businessType,
          businessAddress: merchantData.businessAddress,
          licenseNumber: merchantData.licenseNumber,
        }),
        ...(role === 'driver' && {
          licenseNumber: driverData.licenseNumber,
          vehicleInfo: {
            make: driverData.vehicleMake,
            model: driverData.vehicleModel,
            year: driverData.vehicleYear,
            licensePlate: driverData.licensePlate,
            insurance: driverData.insurance,
          },
        }),
      };

      const response = await roleManagementService.registerForRole(request);

      if (response.success) {
        Alert.alert(
          'Registration Submitted',
          `Your ${role} registration has been submitted for verification. You'll receive a notification once it's approved.`,
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Registration Failed', response.error || 'Failed to submit registration');
      }
    } catch (error) {
      console.error('Error submitting registration:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderMerchantForm = () => (
    <>
      <Text style={styles.label}>Business Name *</Text>
      <TextInput
        style={styles.input}
        value={merchantData.businessName}
        onChangeText={(text) => setMerchantData({ ...merchantData, businessName: text })}
        placeholder="Enter your business name"
        placeholderTextColor="#999"
      />

      <Text style={styles.label}>Business Type *</Text>
      <TextInput
        style={styles.input}
        value={merchantData.businessType}
        onChangeText={(text) => setMerchantData({ ...merchantData, businessType: text })}
        placeholder="e.g., Restaurant, Retail Store, etc."
        placeholderTextColor="#999"
      />

      <Text style={styles.label}>Business Address *</Text>
      <TextInput
        style={styles.input}
        value={merchantData.businessAddress}
        onChangeText={(text) => setMerchantData({ ...merchantData, businessAddress: text })}
        placeholder="Enter your business address"
        placeholderTextColor="#999"
        multiline
        numberOfLines={3}
      />

      <Text style={styles.label}>Business License Number (Optional)</Text>
      <TextInput
        style={styles.input}
        value={merchantData.licenseNumber}
        onChangeText={(text) => setMerchantData({ ...merchantData, licenseNumber: text })}
        placeholder="Enter license number if applicable"
        placeholderTextColor="#999"
      />
    </>
  );

  const renderDriverForm = () => (
    <>
      <Text style={styles.label}>Driver's License Number *</Text>
      <TextInput
        style={styles.input}
        value={driverData.licenseNumber}
        onChangeText={(text) => setDriverData({ ...driverData, licenseNumber: text })}
        placeholder="Enter your driver's license number"
        placeholderTextColor="#999"
      />

      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Vehicle Make *</Text>
          <TextInput
            style={styles.input}
            value={driverData.vehicleMake}
            onChangeText={(text) => setDriverData({ ...driverData, vehicleMake: text })}
            placeholder="e.g., Toyota"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.halfWidth}>
          <Text style={styles.label}>Vehicle Model *</Text>
          <TextInput
            style={styles.input}
            value={driverData.vehicleModel}
            onChangeText={(text) => setDriverData({ ...driverData, vehicleModel: text })}
            placeholder="e.g., Camry"
            placeholderTextColor="#999"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Year</Text>
          <TextInput
            style={styles.input}
            value={driverData.vehicleYear}
            onChangeText={(text) => setDriverData({ ...driverData, vehicleYear: text })}
            placeholder="2024"
            placeholderTextColor="#999"
            keyboardType="numeric"
            maxLength={4}
          />
        </View>

        <View style={styles.halfWidth}>
          <Text style={styles.label}>License Plate *</Text>
          <TextInput
            style={styles.input}
            value={driverData.licensePlate}
            onChangeText={(text) => setDriverData({ ...driverData, licensePlate: text })}
            placeholder="ABC-1234"
            placeholderTextColor="#999"
            autoCapitalize="characters"
          />
        </View>
      </View>

      <Text style={styles.label}>Insurance Policy Number</Text>
      <TextInput
        style={styles.input}
        value={driverData.insurance}
        onChangeText={(text) => setDriverData({ ...driverData, insurance: text })}
        placeholder="Enter your insurance policy number"
        placeholderTextColor="#999"
      />
    </>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Register as {role?.toString().charAt(0).toUpperCase() + role?.toString().slice(1)}
        </Text>
        <Text style={styles.subtitle}>
          Fill in the required information to start the verification process
        </Text>
      </View>

      <View style={styles.form}>
        {role === 'merchant' ? renderMerchantForm() : renderDriverForm()}

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            ℹ️ Your registration will be reviewed by our team. This typically takes 1-2 business days.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Submit for Verification</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  contentContainer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing['3xl'],
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: 'bold',
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.fontSize.md * theme.typography.lineHeight.normal,
  },
  form: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.base,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.base,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  infoBox: {
    backgroundColor: theme.colors.primaryLight + '20',
    padding: theme.spacing.base,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.xl,
  },
  infoText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.primary,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.normal,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.base,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.xl,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  cancelButton: {
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.regular,
  },
});
