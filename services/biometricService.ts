
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Conditionally import expo-local-authentication only on native platforms
let LocalAuthentication: any = null;
if (Platform.OS !== 'web') {
  try {
    LocalAuthentication = require('expo-local-authentication');
  } catch (error) {
    console.warn('expo-local-authentication not available:', error);
  }
}

class BiometricService {
  async isBiometricAvailable(): Promise<boolean> {
    if (Platform.OS === 'web' || !LocalAuthentication) {
      console.log('Biometric not available on web platform or LocalAuthentication not loaded');
      return false;
    }

    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return compatible && enrolled;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return false;
    }
  }

  async getBiometricType(): Promise<string> {
    if (Platform.OS === 'web' || !LocalAuthentication) {
      return 'Not Available';
    }

    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        return 'Iris Recognition';
      }
      
      return 'Biometric';
    } catch (error) {
      console.error('Error getting biometric type:', error);
      return 'Not Available';
    }
  }

  async authenticate(reason: string = 'Authenticate to continue'): Promise<boolean> {
    if (Platform.OS === 'web' || !LocalAuthentication) {
      console.log('Biometric authentication skipped on web platform or LocalAuthentication not available');
      return true;
    }

    try {
      const isAvailable = await this.isBiometricAvailable();
      if (!isAvailable) {
        console.log('Biometric authentication not available');
        return false;
      }

      const isEnabled = await this.isBiometricEnabled();
      if (!isEnabled) {
        console.log('Biometric authentication not enabled by user');
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Password',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (error) {
      console.error('Error during biometric authentication:', error);
      return false;
    }
  }

  async isBiometricEnabled(): Promise<boolean> {
    if (Platform.OS === 'web' || !LocalAuthentication) {
      return false;
    }

    try {
      const enabled = await AsyncStorage.getItem('biometricEnabled');
      return enabled === 'true';
    } catch (error) {
      console.error('Error checking biometric enabled status:', error);
      return false;
    }
  }

  async enableBiometric(): Promise<void> {
    if (Platform.OS === 'web' || !LocalAuthentication) {
      console.log('Cannot enable biometric on web platform or LocalAuthentication not available');
      return;
    }

    try {
      const isAvailable = await this.isBiometricAvailable();
      if (!isAvailable) {
        throw new Error('Biometric authentication is not available on this device');
      }

      // Test authentication before enabling
      const authenticated = await this.authenticate('Verify to enable biometric authentication');
      if (!authenticated) {
        throw new Error('Authentication failed');
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

  async testBiometric(): Promise<{ 
    available: boolean; 
    type: string; 
    enabled: boolean;
    hardware: boolean;
    enrolled: boolean;
    error?: string;
  }> {
    try {
      if (Platform.OS === 'web' || !LocalAuthentication) {
        return {
          available: false,
          type: 'Not Available',
          enabled: false,
          hardware: false,
          enrolled: false,
          error: 'Biometric authentication is not supported on web browsers or LocalAuthentication module is not available',
        };
      }

      const hardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const available = hardware && enrolled;
      const type = await this.getBiometricType();
      const enabled = await this.isBiometricEnabled();

      console.log('Biometric Test Results:', { 
        available, 
        type, 
        enabled, 
        hardware, 
        enrolled 
      });
      
      return { available, type, enabled, hardware, enrolled };
    } catch (error) {
      console.error('Error testing biometric:', error);
      return {
        available: false,
        type: 'Error',
        enabled: false,
        hardware: false,
        enrolled: false,
        error: String(error),
      };
    }
  }
}

export const biometricService = new BiometricService();
