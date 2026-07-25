
import AsyncStorage from '@react-native-async-storage/async-storage';

class BiometricService {
  async isBiometricAvailable(): Promise<boolean> {
    return false;
  }

  async getBiometricType(): Promise<string> {
    return 'Not Available';
  }

  async authenticate(_reason: string = 'Authenticate to continue'): Promise<boolean> {
    return true;
  }

  async isBiometricEnabled(): Promise<boolean> {
    return false;
  }

  async enableBiometric(): Promise<void> {
    console.log('Biometric authentication is not supported on web');
  }

  async disableBiometric(): Promise<void> {
    try {
      await AsyncStorage.setItem('biometricEnabled', 'false');
    } catch (error) {
      console.error('Error disabling biometric:', error);
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
    return {
      available: false,
      type: 'Not Available',
      enabled: false,
      hardware: false,
      enrolled: false,
      error: 'Biometric authentication is not supported on web browsers',
    };
  }
}

export const biometricService = new BiometricService();
