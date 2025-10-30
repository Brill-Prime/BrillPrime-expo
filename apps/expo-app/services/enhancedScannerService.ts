
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as Haptics from 'expo-haptics';

export interface ScanResult {
  type: string;
  data: string;
  bounds?: {
    origin: { x: number; y: number };
    size: { width: number; height: number };
  };
}

export class EnhancedScannerService {
  static async requestCameraPermission(): Promise<boolean> {
    try {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return false;
    }
  }

  static async getCameraPermissionStatus(): Promise<string> {
    try {
      const { status } = await BarCodeScanner.getPermissionsAsync();
      return status;
    } catch (error) {
      console.error('Error getting camera permission status:', error);
      return 'undetermined';
    }
  }

  static getSupportedBarcodeTypes(): string[] {
    return [
      BarCodeScanner.Constants.BarCodeType.qr,
      BarCodeScanner.Constants.BarCodeType.pdf417,
      BarCodeScanner.Constants.BarCodeType.aztec,
      BarCodeScanner.Constants.BarCodeType.ean13,
      BarCodeScanner.Constants.BarCodeType.ean8,
      BarCodeScanner.Constants.BarCodeType.upc_e,
      BarCodeScanner.Constants.BarCodeType.code39,
      BarCodeScanner.Constants.BarCodeType.code128,
      BarCodeScanner.Constants.BarCodeType.code93,
      BarCodeScanner.Constants.BarCodeType.codabar,
      BarCodeScanner.Constants.BarCodeType.datamatrix,
      BarCodeScanner.Constants.BarCodeType.itf14,
    ];
  }

  static async handleScanResult(scanResult: ScanResult): Promise<void> {
    // Provide haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Process different types of QR codes
    if (this.isOrderQR(scanResult.data)) {
      await this.processOrderQR(scanResult.data);
    } else if (this.isMerchantQR(scanResult.data)) {
      await this.processMerchantQR(scanResult.data);
    } else if (this.isPaymentQR(scanResult.data)) {
      await this.processPaymentQR(scanResult.data);
    } else {
      console.log('Unknown QR code type:', scanResult.data);
    }
  }

  private static isOrderQR(data: string): boolean {
    return data.startsWith('order:') || data.includes('brillprime.com/order/');
  }

  private static isMerchantQR(data: string): boolean {
    return data.startsWith('merchant:') || data.includes('brillprime.com/merchant/');
  }

  private static isPaymentQR(data: string): boolean {
    return data.startsWith('payment:') || data.includes('brillprime.com/payment/');
  }

  private static async processOrderQR(data: string): Promise<void> {
    const orderId = this.extractId(data);
    console.log('Processing order QR:', orderId);
    // Navigate to order tracking or details
  }

  private static async processMerchantQR(data: string): Promise<void> {
    const merchantId = this.extractId(data);
    console.log('Processing merchant QR:', merchantId);
    // Navigate to merchant profile or store
  }

  private static async processPaymentQR(data: string): Promise<void> {
    const paymentInfo = this.extractPaymentInfo(data);
    console.log('Processing payment QR:', paymentInfo);
    // Navigate to payment confirmation
  }

  private static extractId(data: string): string {
    const match = data.match(/[/:]([\w-]+)$/);
    return match ? match[1] : '';
  }

  private static extractPaymentInfo(data: string): any {
    try {
      return JSON.parse(data.replace('payment:', ''));
    } catch {
      return { data };
    }
  }
}
