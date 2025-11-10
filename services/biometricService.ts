
import AsyncStorage from '@react-native-async-storage/async-storage';

class BiometricService {
  async isBiometricAvailable(): Promise<boolean> {
    // Biometric authentication is not available on web platform
    console.log('Biometric not available on web platform');
    return false;
  }

  async getBiometricType(): Promise<string> {
    return 'Not Available';
  }

  async authenticate(reason: string = 'Authenticate to continue'): Promise<boolean> {
    // Skip biometric on web, allow fallback to password
    console.log('Biometric authentication skipped on web platform');
    return true;
  }

  async isBiometricEnabled(): Promise<boolean> {
    // Always disabled on web
    return false;
  }

  async enableBiometric(): Promise<void> {
    console.log('Cannot enable biometric on web platform');
    return;
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
