
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme';

interface KYCDocument {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  documentType: 'ID_CARD' | 'PASSPORT' | 'DRIVER_LICENSE' | 'UTILITY_BILL' | 'BUSINESS_REGISTRATION';
  documentUrl: string;
  backDocumentUrl?: string;
  documentNumber?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

interface KycReviewModalProps {
  visible: boolean;
  document: KYCDocument | null;
  onClose: () => void;
  onApprove: (documentId: string) => Promise<void>;
  onReject: (documentId: string, reason: string) => Promise<void>;
}

export const KycReviewModal: React.FC<KycReviewModalProps> = ({
  visible,
  document,
  onClose,
  onApprove,
  onReject,
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  const handleApprove = async () => {
    if (!document) return;

    Alert.alert(
      'Approve Document',
      'Are you sure you want to approve this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            setLoading(true);
            try {
              await onApprove(document.id);
              onClose();
            } catch (error) {
              Alert.alert('Error', 'Failed to approve document');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleReject = async () => {
    if (!document) return;

    if (!rejectionReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }

    setLoading(true);
    try {
      await onReject(document.id, rejectionReason);
      setRejectionReason('');
      setShowRejectInput(false);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to reject document');
    } finally {
      setLoading(false);
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ID_CARD: 'National ID Card',
      PASSPORT: 'Passport',
      DRIVER_LICENSE: "Driver's License",
      UTILITY_BILL: 'Utility Bill',
      BUSINESS_REGISTRATION: 'Business Registration',
    };
    return labels[type] || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!document) return null;

  const isSmallScreen = screenDimensions.width < 400;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>KYC Document Review</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* User Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>User Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={20} color={theme.colors.textSecondary} />
                <Text style={styles.infoLabel}>Name:</Text>
                <Text style={styles.infoValue}>{document.userName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={20} color={theme.colors.textSecondary} />
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{document.userEmail}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={20} color={theme.colors.textSecondary} />
                <Text style={styles.infoLabel}>Submitted:</Text>
                <Text style={styles.infoValue}>{formatDate(document.submittedAt)}</Text>
              </View>
            </View>
          </View>

          {/* Document Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Document Details</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="document-text-outline" size={20} color={theme.colors.textSecondary} />
                <Text style={styles.infoLabel}>Type:</Text>
                <Text style={styles.infoValue}>{getDocumentTypeLabel(document.documentType)}</Text>
              </View>
              {document.documentNumber && (
                <View style={styles.infoRow}>
                  <Ionicons name="key-outline" size={20} color={theme.colors.textSecondary} />
                  <Text style={styles.infoLabel}>Number:</Text>
                  <Text style={styles.infoValue}>{document.documentNumber}</Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Ionicons 
                  name={
                    document.status === 'APPROVED' ? 'checkmark-circle' : 
                    document.status === 'REJECTED' ? 'close-circle' : 
                    'time'
                  } 
                  size={20} 
                  color={
                    document.status === 'APPROVED' ? theme.colors.success : 
                    document.status === 'REJECTED' ? theme.colors.error : 
                    theme.colors.warning
                  } 
                />
                <Text style={styles.infoLabel}>Status:</Text>
                <Text style={[
                  styles.infoValue,
                  document.status === 'APPROVED' && { color: theme.colors.success },
                  document.status === 'REJECTED' && { color: theme.colors.error },
                  document.status === 'PENDING' && { color: theme.colors.warning },
                ]}>
                  {document.status}
                </Text>
              </View>
            </View>
          </View>

          {/* Document Images */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Document Images</Text>
            <View style={styles.imageContainer}>
              <View style={styles.imageWrapper}>
                <Text style={styles.imageLabel}>Front</Text>
                <Image
                  source={{ uri: document.documentUrl }}
                  style={styles.documentImage}
                  resizeMode="contain"
                />
              </View>
              {document.backDocumentUrl && (
                <View style={styles.imageWrapper}>
                  <Text style={styles.imageLabel}>Back</Text>
                  <Image
                    source={{ uri: document.backDocumentUrl }}
                    style={styles.documentImage}
                    resizeMode="contain"
                  />
                </View>
              )}
            </View>
          </View>

          {/* Rejection Reason (if rejected) */}
          {document.status === 'REJECTED' && document.rejectionReason && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rejection Reason</Text>
              <View style={[styles.infoCard, styles.rejectionCard]}>
                <Text style={styles.rejectionText}>{document.rejectionReason}</Text>
              </View>
            </View>
          )}

          {/* Reject Input */}
          {showRejectInput && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rejection Reason</Text>
              <TextInput
                style={styles.rejectInput}
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChangeText={setRejectionReason}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          )}
        </ScrollView>

        {/* Action Buttons */}
        {document.status === 'PENDING' && (
          <View style={styles.actionContainer}>
            {showRejectInput ? (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => {
                    setShowRejectInput(false);
                    setRejectionReason('');
                  }}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.confirmRejectButton]}
                  onPress={handleReject}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={theme.colors.white} />
                  ) : (
                    <Text style={styles.approveButtonText}>Confirm Reject</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => setShowRejectInput(true)}
                  disabled={loading}
                >
                  <Ionicons name="close-circle-outline" size={20} color={theme.colors.white} />
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={handleApprove}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={theme.colors.white} />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={20} color={theme.colors.white} />
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    padding: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
    marginLeft: 10,
    width: 90,
  },
  infoValue: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
    flex: 1,
  },
  imageContainer: {
    gap: 15,
  },
  imageWrapper: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.backgroundSecondary,
  },
  imageLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
    padding: 10,
    backgroundColor: theme.colors.primary,
    color: theme.colors.white,
  },
  documentImage: {
    width: '100%',
    height: 300,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  rejectionCard: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error,
  },
  rejectionText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.error,
    lineHeight: 20,
  },
  rejectInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: 15,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
    minHeight: 100,
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    backgroundColor: theme.colors.background,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: theme.borderRadius.md,
    gap: 8,
  },
  rejectButton: {
    backgroundColor: theme.colors.error,
  },
  rejectButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  approveButton: {
    backgroundColor: theme.colors.success,
  },
  approveButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  cancelButton: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  confirmRejectButton: {
    backgroundColor: theme.colors.error,
  },
});

export default KycReviewModal;
