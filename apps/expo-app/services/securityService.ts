
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Crypto from 'expo-crypto';

export class SecurityService {
  // Secure Storage Methods
  static async storeSecureData(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('Error storing secure data:', error);
      throw error;
    }
  }

  static async getSecureData(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('Error retrieving secure data:', error);
      return null;
    }
  }

  static async deleteSecureData(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Error deleting secure data:', error);
      throw error;
    }
  }

  // Biometric Authentication Methods
  static async isBiometricAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return false;
    }
  }

  static async getBiometricTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
    try {
      return await LocalAuthentication.supportedAuthenticationTypesAsync();
    } catch (error) {
      console.error('Error getting biometric types:', error);
      return [];
    }
  }

  static async authenticateWithBiometrics(
    promptMessage: string = 'Authenticate to continue'
  ): Promise<LocalAuthentication.LocalAuthenticationResult> {
    try {
      return await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Password',
        disableDeviceFallback: false,
      });
    } catch (error) {
      console.error('Biometric authentication error:', error);
      throw error;
    }
  }

  // Token Security Methods
  static async storeAuthToken(token: string): Promise<void> {
    const encryptedToken = await this.encryptData(token);
    await this.storeSecureData('auth_token', encryptedToken);
  }

  static async getAuthToken(): Promise<string | null> {
    const encryptedToken = await this.getSecureData('auth_token');
    if (!encryptedToken) return null;
    return await this.decryptData(encryptedToken);
  }

  static async clearAuthToken(): Promise<void> {
    await this.deleteSecureData('auth_token');
  }

  // Encryption Methods
  static async encryptData(data: string): Promise<string> {
    try {
      return await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        data,
        { encoding: Crypto.CryptoEncoding.HEX }
      );
    } catch (error) {
      console.error('Encryption error:', error);
      throw error;
    }
  }

  static async decryptData(encryptedData: string): Promise<string> {
    // Note: For proper encryption/decryption, you'd need a more robust solution
    // This is a simplified version for demonstration
    return encryptedData;
  }

  // Combined Authentication Flow
  static async secureBiometricLogin(): Promise<boolean> {
    try {
      const isAvailable = await this.isBiometricAvailable();
      
      if (!isAvailable) {
        console.log('Biometric authentication not available');
        return false;
      }

      const result = await this.authenticateWithBiometrics(
        'Use your fingerprint or face to sign in to BrillPrime'
      );

      return result.success;
    } catch (error) {
      console.error('Secure biometric login error:', error);
      return false;
    }
  }
}
