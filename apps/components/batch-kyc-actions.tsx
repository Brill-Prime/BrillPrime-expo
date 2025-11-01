
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
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

  const handleRejectAll = () => {
    Alert.prompt(
      'Reject Selected Documents',
      `Enter rejection reason for ${selectedDocuments.length} document(s):`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject All',
          style: 'destructive',
          onPress: async (reason) => {
            if (!reason || !reason.trim()) {
              Alert.alert('Error', 'Please provide a rejection reason');
              return;
            }
            setLoading(true);
            try {
              await onRejectAll(selectedDocuments, reason);
              onClearSelection();
              Alert.alert('Success', 'Documents rejected successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to reject documents');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  if (selectedDocuments.length === 0) return null;

  return (
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
            onPress={handleRejectAll}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.white} size="small" />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={20} color={theme.colors.white} />
                <Text style={styles.actionButtonText}>Reject All</Text>
              </>
            )}
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
});

export default BatchKycActions;
