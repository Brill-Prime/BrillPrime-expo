import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Linking,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { communicationService } from '../services/communicationService';

interface CommunicationModalProps {
  visible: boolean;
  onClose: () => void;
  contactName: string;
  contactPhone?: string;
  contactRole: 'driver' | 'merchant';
  orderId?: string;
  onChatPress: () => void;
}

export default function CommunicationModal({
  visible,
  onClose,
  contactName,
  contactPhone,
  contactRole,
  orderId,
  onChatPress,
}: CommunicationModalProps) {
  const [screenData, setScreenData] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    return () => subscription?.remove();
  }, []);

  const handlePhoneCall = () => {
    if (!contactPhone) {
      Alert.alert('No Phone Number', 'Phone number not available for this contact.');
      return;
    }

    Alert.alert(
      'Make a Call',
      `Call ${contactName} at ${contactPhone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            Linking.openURL(`tel:${contactPhone}`);
            onClose();
          },
        },
      ]
    );
  };

  const handleInAppCall = async () => {
    try {
      // Mock in-app call functionality
      Alert.alert(
        'In-App Call',
        `Starting in-app call with ${contactName}...`,
        [
          { text: 'End Call', style: 'destructive' },
          { text: 'Continue', style: 'default' },
        ]
      );

      // In a real implementation, you would integrate with WebRTC or similar
      // const response = await communicationService.initiateCall(conversationId, participantId);

      onClose();
    } catch (error) {
      console.error('Error initiating in-app call:', error);
      Alert.alert('Error', 'Failed to start in-app call. Please try again.');
    }
  };

  const handleChatPress = () => {
    onClose();
    if (onChatPress) {
      onChatPress();
    } else {
      Alert.alert(
        "Start Chat",
        "Opening chat with " + contactName,
        [{ text: "OK" }]
      );
    }
  };

  const styles = getResponsiveStyles(screenData);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.contactInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {contactName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.contactDetails}>
                <Text style={styles.contactName}>{contactName}</Text>
                <Text style={styles.contactRole}>
                  {contactRole === 'driver' ? 'Delivery Driver' : 'Merchant'}
                </Text>
                {contactPhone && (
                  <Text style={styles.contactPhone}>{contactPhone}</Text>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Communication Options */}
          <View style={styles.optionsContainer}>
            <Text style={styles.optionsTitle}>Choose Communication Method</Text>

            {/* In-App Chat */}
            <TouchableOpacity style={styles.optionButton} onPress={handleChatPress}>
              <View style={[styles.optionIcon, { backgroundColor: '#667eea' }]}>
                <Ionicons name="chatbubble" size={24} color="#fff" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>In-App Chat</Text>
                <Text style={styles.optionSubtitle}>
                  Send messages and share updates
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>

            {/* In-App Call */}
            <TouchableOpacity style={styles.optionButton} onPress={handleInAppCall}>
              <View style={[styles.optionIcon, { backgroundColor: '#28a745' }]}>
                <Ionicons name="videocam" size={24} color="#fff" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>In-App Call</Text>
                <Text style={styles.optionSubtitle}>
                  Voice/video call through the app
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>

            {/* Phone Call */}
            {contactPhone && (
              <TouchableOpacity style={styles.optionButton} onPress={handlePhoneCall}>
                <View style={[styles.optionIcon, { backgroundColor: '#007bff' }]}>
                  <Ionicons name="call" size={24} color="#fff" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Phone Call</Text>
                  <Text style={styles.optionSubtitle}>
                    Call using your phone dialer
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Actions */}
          {contactRole === 'driver' && orderId && (
            <View style={styles.quickActionsContainer}>
              <Text style={styles.quickActionsTitle}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                <TouchableOpacity style={styles.quickActionButton}>
                  <Ionicons name="location" size={20} color="#667eea" />
                  <Text style={styles.quickActionText}>Share Location</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickActionButton}>
                  <Ionicons name="time" size={20} color="#667eea" />
                  <Text style={styles.quickActionText}>ETA Update</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {contactRole === 'merchant' && (
            <View style={styles.quickActionsContainer}>
              <Text style={styles.quickActionsTitle}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                <TouchableOpacity style={styles.quickActionButton}>
                  <Ionicons name="pricetag" size={20} color="#667eea" />
                  <Text style={styles.quickActionText}>Get Quote</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickActionButton}>
                  <Ionicons name="information-circle" size={20} color="#667eea" />
                  <Text style={styles.quickActionText}>Product Info</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
      justifyContent: 'center',
      alignItems: 'center',
      padding: Math.max(20, width * 0.05),
    },
    modalContainer: {
      backgroundColor: '#fff',
      borderRadius: 16,
      width: '100%',
      maxWidth: isTablet ? 400 : undefined,
      maxHeight: height * 0.8,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Math.max(20, width * 0.05),
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    contactInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    avatar: {
      width: isTablet ? 60 : isSmallScreen ? 45 : 50,
      height: isTablet ? 60 : isSmallScreen ? 45 : 50,
      borderRadius: isTablet ? 30 : isSmallScreen ? 22.5 : 25,
      backgroundColor: '#667eea',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
    },
    avatarText: {
      fontSize: isTablet ? 24 : isSmallScreen ? 18 : 20,
      fontWeight: 'bold',
      color: '#fff',
    },
    contactDetails: {
      flex: 1,
    },
    contactName: {
      fontSize: isTablet ? 18 : isSmallScreen ? 16 : 17,
      fontWeight: '600',
      color: '#333',
      marginBottom: 2,
    },
    contactRole: {
      fontSize: isTablet ? 14 : isSmallScreen ? 12 : 13,
      color: '#666',
      marginBottom: 2,
    },
    contactPhone: {
      fontSize: isTablet ? 12 : isSmallScreen ? 11 : 12,
      color: '#999',
    },
    closeButton: {
      padding: 8,
    },
    optionsContainer: {
      padding: Math.max(20, width * 0.05),
    },
    optionsTitle: {
      fontSize: isTablet ? 16 : isSmallScreen ? 14 : 15,
      fontWeight: '600',
      color: '#333',
      marginBottom: 16,
    },
    optionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f8f9fa',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    optionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
    },
    optionContent: {
      flex: 1,
    },
    optionTitle: {
      fontSize: isTablet ? 16 : isSmallScreen ? 14 : 15,
      fontWeight: '600',
      color: '#333',
      marginBottom: 2,
    },
    optionSubtitle: {
      fontSize: isTablet ? 13 : isSmallScreen ? 12 : 12,
      color: '#666',
    },
    quickActionsContainer: {
      padding: Math.max(20, width * 0.05),
      paddingTop: 0,
    },
    quickActionsTitle: {
      fontSize: isTablet ? 16 : isSmallScreen ? 14 : 15,
      fontWeight: '600',
      color: '#333',
      marginBottom: 16,
    },
    quickActionsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    quickActionButton: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: '#f0f7ff',
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 12,
    },
    quickActionText: {
      fontSize: isTablet ? 12 : isSmallScreen ? 11 : 12,
      color: '#667eea',
      fontWeight: '500',
      marginTop: 8,
      textAlign: 'center',
    },
  });
};