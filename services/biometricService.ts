
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

class BiometricService {
  async isBiometricAvailable(): Promise<boolean> {
    try {
      // Web doesn't support biometric authentication
      if (Platform.OS === 'web') {
        console.log('Biometric not available on web platform');
        return false;
      }

      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      
      console.log('Biometric hardware compatible:', compatible);
      console.log('Biometric enrolled:', enrolled);
      
      return compatible && enrolled;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return false;
    }
  }

  async getBiometricType(): Promise<string> {
    try {
      if (Platform.OS === 'web') {
        return 'Not Available';
      }

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return 'Face ID';
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return 'Touch ID';
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        return 'Iris';
      }
      
      return 'Biometric';
    } catch (error) {
      console.error('Error getting biometric type:', error);
      return 'Biometric';
    }
  }

  async authenticate(reason: string = 'Authenticate to continue'): Promise<boolean> {
    try {
      // Skip biometric on web
      if (Platform.OS === 'web') {
        console.log('Biometric authentication skipped on web platform');
        return true; // Allow fallback to password
      }

      const available = await this.isBiometricAvailable();
      if (!available) {
        console.log('Biometric not available, skipping authentication');
        return true; // Allow fallback to password
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      console.log('Biometric authentication result:', result.success);
      return result.success;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  }

  async isBiometricEnabled(): Promise<boolean> {
    try {
      // Always disabled on web
      if (Platform.OS === 'web') {
        return false;
      }

      const enabled = await AsyncStorage.getItem('biometricEnabled');
      return enabled === 'true';
    } catch (error) {
      console.error('Error checking if biometric is enabled:', error);
      return false;
    }
  }

  async enableBiometric(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        console.log('Cannot enable biometric on web platform');
        return;
      }

      const available = await this.isBiometricAvailable();
      if (!available) {
        throw new Error('Biometric authentication is not available on this device');
      }

      await AsyncStorage.setItem('biometricEnabled', 'true');
      console.log('Biometric authentication enabled');
    } catch (error) {
      console.error('Error enabling biometric:', error);
      throw error;
    }
  }

  async disableBiometric(): Promise<void> {
    try {
      await AsyncStorage.setItem('biometricEnabled', 'false');
      console.log('Biometric authentication disabled');
    } catch (error) {
      console.error('Error disabling biometric:', error);
      throw error;
    }
  }

  // Test biometric functionality
  async testBiometric(): Promise<{ available: boolean; type: string; enabled: boolean }> {
    const available = await this.isBiometricAvailable();
    const type = await this.getBiometricType();
    const enabled = await this.isBiometricEnabled();

    console.log('Biometric Test Results:', { available, type, enabled });
    
    return { available, type, enabled };
  }
}

export const biometricService = new BiometricService();
