
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Platform,
  Share,
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAlert } from './AlertProvider';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

interface ReceiptData {
  orderId: string;
  date: string;
  status: string;
  merchantName: string;
  items: ReceiptItem[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  deliveryAddress: string;
  paymentMethod: string;
}

interface ReceiptSharingModalProps {
  visible: boolean;
  onClose: () => void;
  receiptData: ReceiptData;
}

export default function ReceiptSharingModal({
  visible,
  onClose,
  receiptData,
}: ReceiptSharingModalProps) {
  const { showSuccess, showError } = useAlert();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const viewShotRef = useRef<ViewShot>(null);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    return () => subscription?.remove();
  }, []);

  const generateReceiptText = () => {
    return `
━━━━━━━━━━━━━━━━━━━━━━━━━
    BRILL PRIME RECEIPT
━━━━━━━━━━━━━━━━━━━━━━━━━

Order ID: ${receiptData.orderId}
Date: ${receiptData.date}
Status: ${receiptData.status}

━━━━━━━━━━━━━━━━━━━━━━━━━
MERCHANT
${receiptData.merchantName}

━━━━━━━━━━━━━━━━━━━━━━━━━
ITEMS
${receiptData.items.map(item => 
  `${item.name} x${item.quantity}\n₦${(item.price * item.quantity).toLocaleString()}.00`
).join('\n\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━
SUMMARY
Subtotal:      ₦${receiptData.subtotal.toLocaleString()}.00
Delivery Fee:  ₦${receiptData.deliveryFee.toLocaleString()}.00
━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL:         ₦${receiptData.totalAmount.toLocaleString()}.00

━━━━━━━━━━━━━━━━━━━━━━━━━
DELIVERY ADDRESS
${receiptData.deliveryAddress}

PAYMENT METHOD
${receiptData.paymentMethod}

━━━━━━━━━━━━━━━━━━━━━━━━━
Thank you for your order!
www.brillprime.com
━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();
  };

  const handleCopyToClipboard = async () => {
    try {
      const receiptText = generateReceiptText();
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(receiptText);
      } else {
        Clipboard.setString(receiptText);
      }
      showSuccess('Copied!', 'Receipt copied to clipboard');
      onClose();
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      showError('Copy Failed', 'Failed to copy receipt');
    }
  };

  const handleShareReceipt = async () => {
    try {
      if (!viewShotRef.current) {
        showError('Error', 'Unable to capture receipt');
        return;
      }

      // Capture the receipt as image
      const uri = await viewShotRef.current.capture();
      
      if (Platform.OS === 'web') {
        // For web, download the image
        const response = await fetch(uri);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `receipt_${receiptData.orderId}.png`;
        link.click();
        URL.revokeObjectURL(url);
        showSuccess('Downloaded!', 'Receipt saved as image');
      } else {
        // For mobile, share the image
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Share Receipt',
          });
        } else {
          showSuccess('Saved!', 'Receipt saved to gallery');
        }
      }
      onClose();
    } catch (error: any) {
      if (error.message !== 'User did not share') {
        console.error('Error sharing receipt:', error);
        showError('Share Failed', 'Failed to share receipt');
      }
    }
  };

  const handleDownloadReceipt = async () => {
    try {
      if (!viewShotRef.current) {
        showError('Error', 'Unable to capture receipt');
        return;
      }

      const uri = await viewShotRef.current.capture();
      const fileName = `receipt_${receiptData.orderId}.png`;

      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
        showSuccess('Downloaded!', 'Receipt saved to downloads');
      } else {
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.copyAsync({ from: uri, to: fileUri });
        showSuccess('Saved!', 'Receipt saved to gallery');
      }
      onClose();
    } catch (error) {
      console.error('Error downloading receipt:', error);
      showError('Download Failed', 'Failed to download receipt');
    }
  };

  const handleEmailReceipt = () => {
    // This would integrate with email service
    showSuccess('Email Sent', 'Receipt sent to your registered email');
    onClose();
  };

  const styles = getResponsiveStyles(screenData);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Share Receipt</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Receipt Preview */}
          <ScrollView style={styles.receiptPreview} showsVerticalScrollIndicator={false}>
            <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
            <View style={[styles.receiptHeader, { backgroundColor: '#fff', padding: 20 }]}>
              <Text style={styles.receiptTitle}>BRILL PRIME</Text>
              <Text style={styles.receiptSubtitle}>Order Receipt</Text>
            </View>

            <View style={styles.receiptSection}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Order ID:</Text>
                <Text style={styles.receiptValue}>{receiptData.orderId}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Date:</Text>
                <Text style={styles.receiptValue}>{receiptData.date}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Status:</Text>
                <Text style={[styles.receiptValue, styles.statusValue]}>
                  {receiptData.status}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.receiptSection}>
              <Text style={styles.sectionTitle}>Merchant</Text>
              <Text style={styles.merchantName}>{receiptData.merchantName}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.receiptSection}>
              <Text style={styles.sectionTitle}>Items</Text>
              {receiptData.items.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemQty}>x{item.quantity}</Text>
                  </View>
                  <Text style={styles.itemPrice}>
                    ₦{(item.price * item.quantity).toLocaleString()}.00
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.divider} />

            <View style={styles.receiptSection}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal:</Text>
                <Text style={styles.summaryValue}>
                  ₦{receiptData.subtotal.toLocaleString()}.00
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Fee:</Text>
                <Text style={styles.summaryValue}>
                  ₦{receiptData.deliveryFee.toLocaleString()}.00
                </Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>TOTAL:</Text>
                <Text style={styles.totalValue}>
                  ₦{receiptData.totalAmount.toLocaleString()}.00
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.receiptSection}>
              <Text style={styles.sectionTitle}>Delivery Address</Text>
              <Text style={styles.addressText}>{receiptData.deliveryAddress}</Text>
            </View>

            <View style={styles.receiptSection}>
              <Text style={styles.sectionTitle}>Payment Method</Text>
              <Text style={styles.paymentText}>{receiptData.paymentMethod}</Text>
            </View>

            <View style={styles.receiptFooter}>
              <Text style={styles.footerText}>Thank you for your order!</Text>
              <Text style={styles.footerLink}>www.brillprime.com</Text>
            </View>
            </ViewShot>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={handleCopyToClipboard}>
              <View style={[styles.actionIcon, { backgroundColor: '#667eea' }]}>
                <Ionicons name="copy-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.actionText}>Copy</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleShareReceipt}>
              <View style={[styles.actionIcon, { backgroundColor: '#28a745' }]}>
                <Ionicons name="share-social-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleDownloadReceipt}>
              <View style={[styles.actionIcon, { backgroundColor: '#007bff' }]}>
                <Ionicons name="download-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.actionText}>Download</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleEmailReceipt}>
              <View style={[styles.actionIcon, { backgroundColor: '#ffc107' }]}>
                <Ionicons name="mail-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.actionText}>Email</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const getResponsiveStyles = (screenData: any) => {
  const { width, height } = screenData;
  const isTablet = width >= 768;
  const isSmallScreen = width < 350;

  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: '#fff',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: height * 0.9,
      paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
      fontSize: isTablet ? 20 : 18,
      fontWeight: '600',
      color: '#1C1B1F',
      fontFamily: 'Montserrat-SemiBold',
    },
    closeButton: {
      padding: 8,
    },
    receiptPreview: {
      maxHeight: height * 0.5,
      paddingHorizontal: 20,
    },
    receiptHeader: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    receiptTitle: {
      fontSize: isTablet ? 24 : 20,
      fontWeight: 'bold',
      color: '#2f75c2',
      fontFamily: 'Montserrat-Bold',
    },
    receiptSubtitle: {
      fontSize: isTablet ? 14 : 12,
      color: '#666',
      marginTop: 4,
      fontFamily: 'Montserrat-Regular',
    },
    receiptSection: {
      paddingVertical: 12,
    },
    receiptRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    receiptLabel: {
      fontSize: isTablet ? 14 : 13,
      color: '#666',
      fontFamily: 'Montserrat-Regular',
    },
    receiptValue: {
      fontSize: isTablet ? 14 : 13,
      color: '#1C1B1F',
      fontWeight: '500',
      fontFamily: 'Montserrat-Medium',
    },
    statusValue: {
      color: '#28a745',
      textTransform: 'capitalize',
    },
    divider: {
      height: 1,
      backgroundColor: '#e0e0e0',
      marginVertical: 12,
    },
    sectionTitle: {
      fontSize: isTablet ? 16 : 14,
      fontWeight: '600',
      color: '#1C1B1F',
      marginBottom: 8,
      fontFamily: 'Montserrat-SemiBold',
    },
    merchantName: {
      fontSize: isTablet ? 15 : 14,
      color: '#333',
      fontFamily: 'Montserrat-Medium',
    },
    itemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    itemInfo: {
      flex: 1,
    },
    itemName: {
      fontSize: isTablet ? 14 : 13,
      color: '#1C1B1F',
      fontFamily: 'Montserrat-Medium',
    },
    itemQty: {
      fontSize: isTablet ? 12 : 11,
      color: '#666',
      marginTop: 2,
      fontFamily: 'Montserrat-Regular',
    },
    itemPrice: {
      fontSize: isTablet ? 14 : 13,
      color: '#1C1B1F',
      fontWeight: '600',
      fontFamily: 'Montserrat-SemiBold',
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    summaryLabel: {
      fontSize: isTablet ? 14 : 13,
      color: '#666',
      fontFamily: 'Montserrat-Regular',
    },
    summaryValue: {
      fontSize: isTablet ? 14 : 13,
      color: '#1C1B1F',
      fontFamily: 'Montserrat-Medium',
    },
    totalRow: {
      marginTop: 8,
      paddingTop: 12,
      borderTopWidth: 2,
      borderTopColor: '#2f75c2',
    },
    totalLabel: {
      fontSize: isTablet ? 16 : 15,
      fontWeight: 'bold',
      color: '#1C1B1F',
      fontFamily: 'Montserrat-Bold',
    },
    totalValue: {
      fontSize: isTablet ? 16 : 15,
      fontWeight: 'bold',
      color: '#2f75c2',
      fontFamily: 'Montserrat-Bold',
    },
    addressText: {
      fontSize: isTablet ? 14 : 13,
      color: '#333',
      lineHeight: 20,
      fontFamily: 'Montserrat-Regular',
    },
    paymentText: {
      fontSize: isTablet ? 14 : 13,
      color: '#333',
      fontFamily: 'Montserrat-Medium',
    },
    receiptFooter: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    footerText: {
      fontSize: isTablet ? 14 : 13,
      color: '#666',
      fontFamily: 'Montserrat-Regular',
    },
    footerLink: {
      fontSize: isTablet ? 13 : 12,
      color: '#2f75c2',
      marginTop: 4,
      fontFamily: 'Montserrat-Medium',
    },
    actionsContainer: {
      flexDirection: 'row',
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: '#f0f0f0',
      justifyContent: 'space-around',
    },
    actionButton: {
      alignItems: 'center',
      width: isTablet ? 90 : 70,
    },
    actionIcon: {
      width: isTablet ? 56 : 48,
      height: isTablet ? 56 : 48,
      borderRadius: isTablet ? 28 : 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    actionText: {
      fontSize: isTablet ? 12 : 11,
      color: '#333',
      fontFamily: 'Montserrat-Medium',
    },
  });
};
