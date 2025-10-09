import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  RefreshControl,
  Modal,
  Image,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface KycDocument {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  documentType: 'ID_CARD' | 'PASSPORT' | 'DRIVER_LICENSE' | 'UTILITY_BILL';
  documentUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export default function AdminKYCVerification() {
  const router = useRouter();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('all');
  const [selectedDocument, setSelectedDocument] = useState<KycDocument | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [actionNotes, setActionNotes] = useState('');

  const [documents, setDocuments] = useState<KycDocument[]>([
    {
      id: '1',
      userId: 'USR001',
      userName: 'John Doe',
      userEmail: 'john@example.com',
      documentType: 'ID_CARD',
      documentUrl: 'https://example.com/doc1.jpg',
      status: 'PENDING',
      submittedAt: '2024-01-15T10:30:00Z',
    },
    {
      id: '2',
      userId: 'USR002',
      userName: 'Jane Smith',
      userEmail: 'jane@example.com',
      documentType: 'PASSPORT',
      documentUrl: 'https://example.com/doc2.jpg',
      status: 'PENDING',
      submittedAt: '2024-01-14T15:20:00Z',
    },
    {
      id: '3',
      userId: 'USR003',
      userName: 'Mike Johnson',
      userEmail: 'mike@example.com',
      documentType: 'DRIVER_LICENSE',
      documentUrl: 'https://example.com/doc3.jpg',
      status: 'APPROVED',
      submittedAt: '2024-01-13T09:15:00Z',
      reviewedAt: '2024-01-13T14:30:00Z',
    },
    {
      id: '4',
      userId: 'USR004',
      userName: 'Sarah Wilson',
      userEmail: 'sarah@example.com',
      documentType: 'UTILITY_BILL',
      documentUrl: 'https://example.com/doc4.jpg',
      status: 'REJECTED',
      submittedAt: '2024-01-12T16:45:00Z',
      reviewedAt: '2024-01-12T18:00:00Z',
      rejectionReason: 'Document not clear enough',
    },
  ]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    loadKYCDocuments();

    return () => subscription?.remove();
  }, []);

  const loadKYCDocuments = async () => {
    try {
      const token = await AsyncStorage.getItem('adminToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://api.brillprime.com'}/api/admin/kyc/documents`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Error loading KYC documents:', error);
      // Keep using mock data as fallback
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    loadKYCDocuments(); // Actually load data on refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getFilteredDocuments = () => {
    if (filterStatus === 'all') return documents;
    return documents.filter(doc => doc.status === filterStatus);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#f59e0b';
      case 'APPROVED': return '#10b981';
      case 'REJECTED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'ID_CARD': return 'ID Card';
      case 'PASSPORT': return 'Passport';
      case 'DRIVER_LICENSE': return 'Driver License';
      case 'UTILITY_BILL': return 'Utility Bill';
      default: return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDocumentReview = (document: KycDocument) => {
    setSelectedDocument(document);
    setShowReviewModal(true);
  };

  const handleApproveDocument = async () => {
    if (!selectedDocument) return;

    try {
      const token = await AsyncStorage.getItem('adminToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://api.brillprime.com'}/api/admin/kyc/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          documentId: selectedDocument.id,
          userId: selectedDocument.userId,
          notes: actionNotes
        })
      });

      if (!response.ok) throw new Error('Failed to approve document');

      setDocuments(prev => 
        prev.map(doc => 
          doc.id === selectedDocument.id 
            ? { 
                ...doc, 
                status: 'APPROVED' as const,
                reviewedAt: new Date().toISOString()
              }
            : doc
        )
      );

      setShowReviewModal(false);
      setActionNotes('');
      Alert.alert('Success', 'Document approved successfully');
    } catch (error) {
      console.error('Error approving document:', error);
      Alert.alert('Error', 'Failed to approve document. Please try again.');
    }
  };

  const handleRejectDocument = async () => {
    if (!selectedDocument || !rejectionReason.trim()) {
      Alert.alert('Error', 'Please provide a rejection reason');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('adminToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://api.brillprime.com'}/api/admin/kyc/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          documentId: selectedDocument.id,
          userId: selectedDocument.userId,
          reason: rejectionReason.trim(),
          notes: actionNotes
        })
      });

      if (!response.ok) throw new Error('Failed to reject document');

      setDocuments(prev => 
        prev.map(doc => 
          doc.id === selectedDocument.id 
            ? { 
                ...doc, 
                status: 'REJECTED' as const,
                reviewedAt: new Date().toISOString(),
                rejectionReason: rejectionReason.trim()
              }
            : doc
        )
      );

      setShowReviewModal(false);
      setRejectionReason('');
      setActionNotes('');
      Alert.alert('Success', 'Document rejected with reason');
    } catch (error) {
      console.error('Error rejecting document:', error);
      Alert.alert('Error', 'Failed to reject document. Please try again.');
    }
  };

  const handleBatchAction = (action: 'approve' | 'reject') => {
    if (selectedDocuments.length === 0) {
      Alert.alert('Error', 'Please select documents to perform batch action');
      return;
    }

    Alert.alert(
      `Batch Action: ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      `Are you sure you want to ${action} ${selectedDocuments.length} document(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('adminToken');
              const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://api.brillprime.com'}/api/admin/kyc/batch`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  documentIds: selectedDocuments,
                  action: action.toUpperCase(), // APPROVE or REJECT
                  notes: actionNotes
                })
              });

              if (!response.ok) throw new Error(`Failed to ${action} documents`);

              setDocuments(prev => 
                prev.map(doc => 
                  selectedDocuments.includes(doc.id)
                    ? { 
                        ...doc, 
                        status: action === 'approve' ? 'APPROVED' as const : 'REJECTED' as const,
                        reviewedAt: new Date().toISOString(),
                        rejectionReason: action === 'reject' ? 'Batch rejection' : undefined
                      }
                    : doc
                )
              );
              setSelectedDocuments([]);
              setActionNotes('');
              Alert.alert('Success', `Batch ${action} completed successfully`);
            } catch (error) {
              console.error(`Error performing batch ${action}:`, error);
              Alert.alert('Error', `Failed to perform batch ${action}. Please try again.`);
            }
          }
        }
      ]
    );
  };

  const toggleDocumentSelection = (documentId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId)
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  const pendingCount = documents.filter(doc => doc.status === 'PENDING').length;
  const filteredDocuments = getFilteredDocuments();
  const styles = getResponsiveStyles(screenData);

  return (
    <LinearGradient
      colors={['rgb(11, 26, 81)', '#1e3a8a']}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KYC Verification</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {pendingCount} documents pending review
          </Text>
        </View>

        {/* Batch Actions */}
        {selectedDocuments.length > 0 && (
          <View style={styles.batchActions}>
            <Text style={styles.batchText}>
              {selectedDocuments.length} selected
            </Text>
            <View style={styles.batchButtons}>
              <TouchableOpacity
                style={[styles.batchButton, { backgroundColor: '#10b981' }]}
                onPress={() => handleBatchAction('approve')}
              >
                <Text style={styles.batchButtonText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.batchButton, { backgroundColor: '#ef4444' }]}
                onPress={() => handleBatchAction('reject')}
              >
                <Text style={styles.batchButtonText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          {[
            { key: 'all', label: 'All', count: documents.length },
            { key: 'PENDING', label: 'Pending', count: documents.filter(d => d.status === 'PENDING').length },
            { key: 'APPROVED', label: 'Approved', count: documents.filter(d => d.status === 'APPROVED').length },
            { key: 'REJECTED', label: 'Rejected', count: documents.filter(d => d.status === 'REJECTED').length }
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterTab,
                filterStatus === filter.key && styles.activeFilterTab
              ]}
              onPress={() => setFilterStatus(filter.key as any)}
            >
              <Text style={[
                styles.filterTabText,
                filterStatus === filter.key && styles.activeFilterTabText
              ]}>
                {filter.label}
              </Text>
              {filter.count > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{filter.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Documents List */}
        <View style={styles.documentsList}>
          {filteredDocuments.map((document) => (
            <View key={document.id} style={styles.documentCard}>
              <View style={styles.documentHeader}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => toggleDocumentSelection(document.id)}
                >
                  <Ionicons 
                    name={selectedDocuments.includes(document.id) ? "checkbox" : "square-outline"} 
                    size={20} 
                    color="rgb(11, 26, 81)" 
                  />
                </TouchableOpacity>

                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{document.userName}</Text>
                  <Text style={styles.userEmail}>{document.userEmail}</Text>
                </View>

                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(document.status) }
                ]}>
                  <Text style={styles.statusText}>{document.status}</Text>
                </View>
              </View>

              <View style={styles.documentInfo}>
                <Text style={styles.documentType}>
                  {getDocumentTypeLabel(document.documentType)}
                </Text>
                <Text style={styles.submissionDate}>
                  Submitted: {formatDate(document.submittedAt)}
                </Text>
                {document.reviewedAt && (
                  <Text style={styles.reviewDate}>
                    Reviewed: {formatDate(document.reviewedAt)}
                  </Text>
                )}
                {document.rejectionReason && (
                  <Text style={styles.rejectionReason}>
                    Reason: {document.rejectionReason}
                  </Text>
                )}
              </View>

              {document.status === 'PENDING' && (
                <TouchableOpacity
                  style={styles.reviewButton}
                  onPress={() => handleDocumentReview(document)}
                >
                  <Text style={styles.reviewButtonText}>Review Document</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowReviewModal(false);
          setRejectionReason(''); // Clear rejection reason on close
          setActionNotes(''); // Clear action notes on close
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Review Document</Text>
              <TouchableOpacity onPress={() => {
                setShowReviewModal(false);
                setRejectionReason(''); // Clear rejection reason on close
                setActionNotes(''); // Clear action notes on close
              }}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedDocument && (
              <View style={styles.modalBody}>
                <View style={styles.documentPreview}>
                  <Text style={styles.previewLabel}>Document Preview</Text>
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="image" size={48} color="#ccc" />
                    <Text style={styles.imagePlaceholderText}>
                      {getDocumentTypeLabel(selectedDocument.documentType)}
                    </Text>
                  </View>
                </View>

                <View style={styles.userDetails}>
                  <Text style={styles.detailLabel}>User: {selectedDocument.userName}</Text>
                  <Text style={styles.detailLabel}>Email: {selectedDocument.userEmail}</Text>
                  <Text style={styles.detailLabel}>
                    Submitted: {formatDate(selectedDocument.submittedAt)}
                  </Text>
                </View>
                
                <TextInput
                  style={styles.rejectionInput}
                  placeholder="Rejection reason (optional)"
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                  multiline
                  numberOfLines={3}
                />

                <TextInput
                  style={styles.rejectionInput}
                  placeholder="Action notes (optional)"
                  value={actionNotes}
                  onChangeText={setActionNotes}
                  multiline
                  numberOfLines={3}
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalActionButton, { backgroundColor: '#ef4444' }]}
                    onPress={handleRejectDocument}
                  >
                    <Text style={styles.modalActionButtonText}>Reject</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalActionButton, { backgroundColor: '#10b981' }]}
                    onPress={handleApproveDocument}
                  >
                    <Text style={styles.modalActionButtonText}>Approve</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const getResponsiveStyles = (screenData: any) => {
  const { width, height } = screenData;
  const isTablet = width >= 768;
  const isSmallScreen = width < 350;

  return StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: Math.max(16, width * 0.05),
      paddingTop: Math.max(50, height * 0.07),
    },
    backButton: {
      padding: Math.max(8, width * 0.02),
    },
    headerTitle: {
      fontSize: isTablet ? 24 : isSmallScreen ? 18 : 20,
      fontWeight: "bold",
      color: "white",
    },
    refreshButton: {
      padding: Math.max(8, width * 0.02),
    },
    content: {
      flex: 1,
      backgroundColor: "white",
      borderTopLeftRadius: 35,
      borderTopRightRadius: 35,
      paddingTop: Math.max(24, height * 0.03),
    },
    statsContainer: {
      paddingHorizontal: Math.max(16, width * 0.05),
      marginBottom: 16,
    },
    statsText: {
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      color: '#6b7280',
      textAlign: 'center',
    },
    batchActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Math.max(16, width * 0.05),
      marginBottom: 16,
      backgroundColor: '#f3f4f6',
      paddingVertical: 12,
      borderRadius: 8,
      marginHorizontal: Math.max(16, width * 0.05),
    },
    batchText: {
      fontSize: 14,
      color: 'rgb(11, 26, 81)',
      fontWeight: '600',
    },
    batchButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    batchButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
    },
    batchButtonText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
    },
    filterTabs: {
      flexDirection: 'row',
      paddingHorizontal: Math.max(16, width * 0.05),
      marginBottom: 16,
      gap: 8,
    },
    filterTab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Math.max(10, height * 0.012),
      borderRadius: 20,
      backgroundColor: '#f3f4f6',
      gap: 4,
    },
    activeFilterTab: {
      backgroundColor: 'rgb(11, 26, 81)',
    },
    filterTabText: {
      fontSize: isTablet ? 12 : isSmallScreen ? 10 : 11,
      fontWeight: '500',
      color: '#6b7280',
    },
    activeFilterTabText: {
      color: 'white',
    },
    filterBadge: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
    },
    filterBadgeText: {
      fontSize: 10,
      fontWeight: '600',
      color: 'white',
    },
    documentsList: {
      paddingHorizontal: Math.max(16, width * 0.05),
      paddingBottom: Math.max(32, height * 0.04),
    },
    documentCard: {
      backgroundColor: 'white',
      borderRadius: 12,
      padding: Math.max(16, width * 0.04),
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    documentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 12,
    },
    checkbox: {
      padding: 4,
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      fontWeight: '600',
      color: '#111827',
    },
    userEmail: {
      fontSize: isTablet ? 12 : isSmallScreen ? 10 : 11,
      color: '#6b7280',
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 10,
      fontWeight: '600',
      color: 'white',
    },
    documentInfo: {
      marginBottom: 12,
    },
    documentType: {
      fontSize: isTablet ? 14 : isSmallScreen ? 11 : 12,
      fontWeight: '500',
      color: '#111827',
      marginBottom: 4,
    },
    submissionDate: {
      fontSize: isTablet ? 12 : isSmallScreen ? 10 : 11,
      color: '#6b7280',
    },
    reviewDate: {
      fontSize: isTablet ? 12 : isSmallScreen ? 10 : 11,
      color: '#6b7280',
    },
    rejectionReason: {
      fontSize: isTablet ? 12 : isSmallScreen ? 10 : 11,
      color: '#ef4444',
      fontStyle: 'italic',
      marginTop: 4,
    },
    reviewButton: {
      backgroundColor: 'rgb(11, 26, 81)',
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
    },
    reviewButtonText: {
      color: 'white',
      fontSize: isTablet ? 14 : isSmallScreen ? 11 : 12,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: 20,
      padding: 20,
      width: '90%',
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#111827',
    },
    modalBody: {
      flex: 1,
    },
    documentPreview: {
      marginBottom: 20,
    },
    previewLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: '#111827',
      marginBottom: 8,
    },
    imagePlaceholder: {
      height: 200,
      backgroundColor: '#f3f4f6',
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    imagePlaceholderText: {
      fontSize: 12,
      color: '#6b7280',
      marginTop: 8,
    },
    userDetails: {
      marginBottom: 20,
    },
    detailLabel: {
      fontSize: 14,
      color: '#6b7280',
      marginBottom: 4,
    },
    rejectionInput: {
      borderWidth: 1,
      borderColor: '#d1d5db',
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      color: '#111827',
      minHeight: 80,
      textAlignVertical: 'top',
      marginBottom: 20,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
    },
    modalActionButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    modalActionButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
  });
};