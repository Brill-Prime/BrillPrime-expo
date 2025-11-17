
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme';

interface BatchKycActionsProps {
  selectedDocuments: string[];
  onApproveAll: (documentIds: string[]) => Promise<void>;
  onRejectAll: (documentIds: string[], reason: string) => Promise<void>;
  onClearSelection: () => void;
}

export const BatchKycActions: React.FC<BatchKycActionsProps> = ({
  selectedDocuments,
  onApproveAll,
  onRejectAll,
  onClearSelection,
}) => {
  const [loading, setLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleApproveAll = () => {
    Alert.alert(
      'Approve Selected Documents',
      `Are you sure you want to approve ${selectedDocuments.length} document(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve All',
          style: 'default',
          onPress: async () => {
            setLoading(true);
            try {
              await onApproveAll(selectedDocuments);
              onClearSelection();
              Alert.alert('Success', 'Documents approved successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to approve documents');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRejectAll = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Error', 'Please provide a rejection reason');
      return;
    }

    setLoading(true);
    try {
      await onRejectAll(selectedDocuments, rejectReason);
      onClearSelection();
      setRejectReason('');
      setShowRejectModal(false);
      Alert.alert('Success', 'Documents rejected successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to reject documents');
    } finally {
      setLoading(false);
    }
  };

  if (selectedDocuments.length === 0) return null;

  return (
    <>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.infoSection}>
            <Ionicons name="checkbox-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.selectedCount}>
              {selectedDocuments.length} selected
            </Text>
          </View>

          <View style={styles.actionSection}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={onClearSelection}
              disabled={loading}
            >
              <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => setShowRejectModal(true)}
              disabled={loading}
            >
              <Ionicons name="close-circle-outline" size={20} color={theme.colors.white} />
              <Text style={styles.actionButtonText}>Reject All</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={handleApproveAll}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.white} size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color={theme.colors.white} />
                  <Text style={styles.actionButtonText}>Approve All</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal
        visible={showRejectModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject Documents</Text>
            <Text style={styles.modalSubtitle}>
              Provide a reason for rejecting {selectedDocuments.length} document(s)
            </Text>
            <TextInput
              style={styles.rejectInput}
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleRejectAll}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.white} size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>Reject All</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    ...theme.shadows.base,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectedCount: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
  },
  actionSection: {
    flexDirection: 'row',
    gap: 10,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  clearButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.md,
  },
  rejectButton: {
    backgroundColor: theme.colors.error,
  },
  approveButton: {
    backgroundColor: theme.colors.success,
  },
  actionButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: 16,
  },
  rejectInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
    backgroundColor: theme.colors.backgroundSecondary,
    minHeight: 100,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
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
  confirmButton: {
    backgroundColor: theme.colors.error,
  },
  confirmButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.semiBold,
  },
});

export default BatchKycActions;
