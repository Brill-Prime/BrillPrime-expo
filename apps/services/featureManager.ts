
import { SecurityService } from './securityService';
import { EnhancedScannerService } from './enhancedScannerService';
import { SchedulingService } from './schedulingService';
import { UpdateService } from './updateService';
import * as Haptics from 'expo-haptics';

export class FeatureManager {
  private static initialized = false;

  static async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🚀 Initializing BrillPrime features...');

      // Check for app updates
      const hasUpdate = await UpdateService.checkForUpdates();
      if (hasUpdate) {
        console.log('📱 App update available');
      }

      // Initialize security features
      const biometricAvailable = await SecurityService.isBiometricAvailable();
      console.log('🔐 Biometric authentication:', biometricAvailable ? 'Available' : 'Not available');

      // Check camera permissions for QR scanning
      const cameraPermission = await EnhancedScannerService.getCameraPermissionStatus();
      console.log('📷 Camera permission:', cameraPermission);

      // Check calendar permissions
      const calendarPermission = await SchedulingService.requestCalendarPermission();
      console.log('📅 Calendar permission:', calendarPermission ? 'Granted' : 'Not granted');

      this.initialized = true;
      console.log('✅ BrillPrime features initialized');

      // Provide haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    } catch (error) {
      console.error('❌ Error initializing features:', error);
    }
  }

  static async requestAllPermissions(): Promise<{
    camera: boolean;
    calendar: boolean;
    contacts: boolean;
  }> {
    const results = {
      camera: false,
      calendar: false,
      contacts: false,
    };

    try {
      results.camera = await EnhancedScannerService.requestCameraPermission();
      results.calendar = await SchedulingService.requestCalendarPermission();
      results.contacts = await SchedulingService.requestContactsPermission();

      console.log('📋 Permissions requested:', results);
      return results;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return results;
    }
  }

  static getFeatureStatus(): {
    security: boolean;
    scanning: boolean;
    scheduling: boolean;
    updates: boolean;
  } {
    return {
      security: this.initialized,
      scanning: this.initialized,
      scheduling: this.initialized,
      updates: this.initialized && !__DEV__,
    };
  }

  // Integrated workflows
  static async handleQRScanForOrder(qrData: string): Promise<void> {
    try {
      await EnhancedScannerService.handleScanResult({
        type: 'QR',
        data: qrData,
      });

      // If it's a delivery, keep screen awake
      if (qrData.includes('delivery') || qrData.includes('tracking')) {
        SchedulingService.enableKeepAwake('Tracking delivery from QR scan');
      }
    } catch (error) {
      console.error('Error handling QR scan for order:', error);
    }
  }

  static async scheduleDeliveryWithContact(deliveryData: any): Promise<void> {
    try {
      // Schedule the delivery
      const scheduled = await SchedulingService.scheduleDelivery(deliveryData);

      if (scheduled) {
        // Add merchant to contacts if not exists
        const merchantContact = await SchedulingService.getMerchantContact(deliveryData.merchantId);
        
        if (!merchantContact && deliveryData.merchantInfo) {
          await SchedulingService.addMerchantToContacts(deliveryData.merchantInfo);
        }

        // Provide haptic feedback
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        console.log('✅ Delivery scheduled and contact added');
      }
    } catch (error) {
      console.error('Error scheduling delivery with contact:', error);
    }
  }

  static async secureDataBackup(userData: any): Promise<boolean> {
    try {
      // Encrypt and store critical user data
      const encryptedData = await SecurityService.encryptData(JSON.stringify(userData));
      await SecurityService.storeSecureData('user_backup', encryptedData);
      
      console.log('✅ User data backed up securely');
      return true;
    } catch (error) {
      console.error('Error backing up user data:', error);
      return false;
    }
  }
}
