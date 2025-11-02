
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAlert } from '../../components/AlertProvider';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

interface DisputeEvidence {
  type: 'image' | 'document';
  uri: string;
  name: string;
}

export default function DisputeResolution() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { showError, showConfirmDialog } = useAlert();
  const orderId = params.orderId as string;

  const [selectedReason, setSelectedReason] = useState<string>('');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState<DisputeEvidence[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const disputeReasons = [
    { id: 'wrong_item', label: 'Wrong item received', icon: 'swap-horizontal' },
    { id: 'damaged_item', label: 'Damaged or defective item', icon: 'alert-circle' },
    { id: 'missing_item', label: 'Missing items', icon: 'remove-circle' },
    { id: 'late_delivery', label: 'Very late delivery', icon: 'time' },
    { id: 'no_delivery', label: 'Order never delivered', icon: 'close-circle' },
    { id: 'quality_issue', label: 'Quality not as described', icon: 'thumbs-down' },
    { id: 'overcharge', label: 'Incorrect charge', icon: 'cash' },
    { id: 'other', label: 'Other issue', icon: 'ellipsis-horizontal' },
  ];

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showError('Permission Denied', 'Camera roll permission is required to upload images');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newEvidence: DisputeEvidence[] = result.assets.map((asset, index) => ({
        type: 'image',
        uri: asset.uri,
        name: `evidence_${Date.now()}_${index}.jpg`,
      }));
      setEvidence([...evidence, ...newEvidence]);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newEvidence: DisputeEvidence = {
          type: 'document',
          uri: result.assets[0].uri,
          name: result.assets[0].name || `document_${Date.now()}.pdf`,
        };
        setEvidence([...evidence, newEvidence]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      showError('Error', 'Failed to pick document');
    }
  };

  const removeEvidence = (index: number) => {
    setEvidence(evidence.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    if (!selectedReason) {
      showError('Missing Information', 'Please select a reason for the dispute');
      return false;
    }
    if (description.trim().length < 20) {
      showError('Missing Information', 'Please provide a detailed description (at least 20 characters)');
      return false;
    }
    return true;
  };

  const submitDispute = async () => {
    if (!validateForm()) return;

    showConfirmDialog(
      'Submit Dispute',
      'Are you sure you want to submit this dispute? This will be reviewed by our support team.',
      async () => {
        setSubmitting(true);
        try {
          // TODO: Replace with actual API call
          // const formData = new FormData();
          // formData.append('orderId', orderId);
          // formData.append('reason', selectedReason);
          // formData.append('description', description);
          // evidence.forEach((item, index) => {
          //   formData.append(`evidence_${index}`, {
          //     uri: item.uri,
          //     name: item.name,
          //     type: item.type === 'image' ? 'image/jpeg' : 'application/pdf',
          //   });
          // });
          // await disputeService.submitDispute(formData);

          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 2000));

          showConfirmDialog(
            'Dispute Submitted',
            'Your dispute has been submitted successfully. Our support team will review it within 24-48 hours and contact you via email.',
            () => router.back()
          );
        } catch (error) {
          console.error('Error submitting dispute:', error);
          showError('Error', 'Failed to submit dispute. Please try again.');
        } finally {
          setSubmitting(false);
        }
      }
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0B1A51" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>File a Dispute</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#4682B4" />
          <Text style={styles.infoText}>
            Please provide detailed information about your issue. Our support team will review your
            dispute and respond within 24-48 hours.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Select Reason</Text>
        <View style={styles.reasonsContainer}>
          {disputeReasons.map((reason) => (
            <TouchableOpacity
              key={reason.id}
              style={[
                styles.reasonCard,
                selectedReason === reason.id && styles.reasonCardSelected,
              ]}
              onPress={() => setSelectedReason(reason.id)}
            >
              <Ionicons
                name={reason.icon as any}
                size={24}
                color={selectedReason === reason.id ? '#FFFFFF' : '#4682B4'}
              />
              <Text
                style={[
                  styles.reasonText,
                  selectedReason === reason.id && styles.reasonTextSelected,
                ]}
              >
                {reason.label}
              </Text>
              {selectedReason === reason.id && (
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Describe the Issue</Text>
        <TextInput
          style={styles.descriptionInput}
          value={description}
          onChangeText={setDescription}
          placeholder="Please provide detailed information about your issue. Include order details, what went wrong, and what resolution you're seeking."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
        <Text style={styles.characterCount}>{description.length} / 500 characters</Text>

        <Text style={styles.sectionTitle}>Add Evidence (Optional)</Text>
        <Text style={styles.sectionSubtitle}>
          Upload photos or documents to support your dispute
        </Text>

        <View style={styles.uploadButtons}>
          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            <Ionicons name="image" size={24} color="#4682B4" />
            <Text style={styles.uploadButtonText}>Add Photos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
            <Ionicons name="document" size={24} color="#4682B4" />
            <Text style={styles.uploadButtonText}>Add Document</Text>
          </TouchableOpacity>
        </View>

        {evidence.length > 0 && (
          <View style={styles.evidenceList}>
            {evidence.map((item, index) => (
              <View key={index} style={styles.evidenceItem}>
                {item.type === 'image' ? (
                  <Image source={{ uri: item.uri }} style={styles.evidenceImage} />
                ) : (
                  <View style={styles.documentPreview}>
                    <Ionicons name="document-text" size={40} color="#4682B4" />
                  </View>
                )}
                <Text style={styles.evidenceName} numberOfLines={1}>
                  {item.name}
                </Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeEvidence(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={styles.noticeCard}>
          <Ionicons name="shield-checkmark" size={20} color="#10B981" />
          <Text style={styles.noticeText}>
            Your dispute will be handled confidentially. We'll notify you via email about any
            updates.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={submitDispute}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Submit Dispute</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0B1A51',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0B1A51',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    marginTop: -8,
  },
  reasonsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  reasonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  reasonCardSelected: {
    backgroundColor: '#4682B4',
    borderColor: '#4682B4',
  },
  reasonText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#0B1A51',
    fontWeight: '500',
  },
  reasonTextSelected: {
    color: '#FFFFFF',
  },
  descriptionInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#0B1A51',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 24,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4682B4',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#4682B4',
  },
  evidenceList: {
    gap: 12,
    marginBottom: 24,
  },
  evidenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
  },
  evidenceImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  documentPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  evidenceName: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#0B1A51',
  },
  removeButton: {
    padding: 4,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ECFDF5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  noticeText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4682B4',
    padding: 16,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
