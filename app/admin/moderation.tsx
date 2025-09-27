
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
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface ContentReport {
  id: string;
  contentType: 'POST' | 'COMMENT' | 'PRODUCT' | 'USER';
  contentId: string;
  reason: string;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reportCount: number;
  createdAt: string;
  reporter: {
    id: string;
    fullName: string;
    email: string;
  };
  content?: string;
}

export default function AdminModeration() {
  const router = useRouter();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED'>('all');
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [selectedReports, setSelectedReports] = useState<string[]>([]);

  const [reports, setReports] = useState<ContentReport[]>([
    {
      id: '1',
      contentType: 'POST',
      contentId: 'POST001',
      reason: 'Inappropriate content',
      status: 'PENDING',
      priority: 'HIGH',
      reportCount: 3,
      createdAt: '2024-01-15T10:30:00Z',
      reporter: {
        id: 'USR001',
        fullName: 'John Doe',
        email: 'john@example.com'
      },
      content: 'This is a sample post content that has been reported for inappropriate material...'
    },
    {
      id: '2',
      contentType: 'COMMENT',
      contentId: 'COM001',
      reason: 'Spam',
      status: 'PENDING',
      priority: 'MEDIUM',
      reportCount: 1,
      createdAt: '2024-01-14T15:20:00Z',
      reporter: {
        id: 'USR002',
        fullName: 'Jane Smith',
        email: 'jane@example.com'
      },
      content: 'Check out this amazing deal! Click here for more...'
    },
    {
      id: '3',
      contentType: 'PRODUCT',
      contentId: 'PRD001',
      reason: 'Misleading information',
      status: 'RESOLVED',
      priority: 'LOW',
      reportCount: 2,
      createdAt: '2024-01-13T09:15:00Z',
      reporter: {
        id: 'USR003',
        fullName: 'Mike Johnson',
        email: 'mike@example.com'
      },
      content: 'Premium iPhone 15 Pro Max - Brand New (Refurbished)'
    },
  ]);

  const moderationStats = {
    totalReports: 45,
    pendingReports: 12,
    resolvedToday: 8,
    averageResolutionTime: 4.5, // hours
  };

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    
    return () => subscription?.remove();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getFilteredReports = () => {
    if (filterStatus === 'all') return reports;
    return reports.filter(report => report.status === filterStatus);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#f59e0b';
      case 'REVIEWED': return '#3b82f6';
      case 'RESOLVED': return '#10b981';
      case 'DISMISSED': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return '#dc2626';
      case 'HIGH': return '#ea580c';
      case 'MEDIUM': return '#d97706';
      case 'LOW': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'POST': return 'document-text';
      case 'COMMENT': return 'chatbubble';
      case 'PRODUCT': return 'cube';
      case 'USER': return 'person';
      default: return 'help-circle';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const handleReportAction = (report: ContentReport) => {
    setSelectedReport(report);
    setShowActionModal(true);
  };

  const executeAction = (action: 'resolve' | 'dismiss' | 'escalate') => {
    if (!selectedReport) return;

    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${action} this report?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            setReports(prev => 
              prev.map(report => 
                report.id === selectedReport.id 
                  ? { 
                      ...report, 
                      status: action === 'resolve' ? 'RESOLVED' : action === 'dismiss' ? 'DISMISSED' : 'REVIEWED'
                    }
                  : report
              )
            );
            setShowActionModal(false);
            setActionNotes('');
            Alert.alert('Success', `Report ${action}d successfully.`);
          }
        }
      ]
    );
  };

  const handleBatchAction = (action: 'resolve' | 'dismiss') => {
    if (selectedReports.length === 0) {
      Alert.alert('Error', 'Please select reports to perform batch action');
      return;
    }

    Alert.alert(
      'Batch Action',
      `Are you sure you want to ${action} ${selectedReports.length} report(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            setReports(prev => 
              prev.map(report => 
                selectedReports.includes(report.id)
                  ? { 
                      ...report, 
                      status: action === 'resolve' ? 'RESOLVED' : 'DISMISSED'
                    }
                  : report
              )
            );
            setSelectedReports([]);
            Alert.alert('Success', `Batch ${action} completed`);
          }
        }
      ]
    );
  };

  const toggleReportSelection = (reportId: string) => {
    setSelectedReports(prev => 
      prev.includes(reportId)
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const StatCard = ({ title, value, subtitle, icon, color }: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: string;
    color: string;
  }) => (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <Text style={styles.statTitle}>{title}</Text>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statSubtitle}>{subtitle}</Text>
    </View>
  );

  const filteredReports = getFilteredReports();
  const styles = getResponsiveStyles(screenData);

  return (
    <LinearGradient
      colors={['#0B1A51', '#1e3a8a']}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Content Moderation</Text>
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
        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Pending Reports"
            value={moderationStats.pendingReports}
            subtitle="Awaiting review"
            icon="time"
            color="#f59e0b"
          />
          
          <StatCard
            title="Resolved Today"
            value={moderationStats.resolvedToday}
            subtitle="Successfully handled"
            icon="checkmark-circle"
            color="#10b981"
          />
          
          <StatCard
            title="Avg Resolution"
            value={`${moderationStats.averageResolutionTime}h`}
            subtitle="Response time"
            icon="speedometer"
            color="#3b82f6"
          />
          
          <StatCard
            title="Total Reports"
            value={moderationStats.totalReports}
            subtitle="All time"
            icon="bar-chart"
            color="#8b5cf6"
          />
        </View>

        {/* Batch Actions */}
        {selectedReports.length > 0 && (
          <View style={styles.batchActions}>
            <Text style={styles.batchText}>
              {selectedReports.length} selected
            </Text>
            <View style={styles.batchButtons}>
              <TouchableOpacity
                style={[styles.batchButton, { backgroundColor: '#10b981' }]}
                onPress={() => handleBatchAction('resolve')}
              >
                <Text style={styles.batchButtonText}>Resolve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.batchButton, { backgroundColor: '#6b7280' }]}
                onPress={() => handleBatchAction('dismiss')}
              >
                <Text style={styles.batchButtonText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          {[
            { key: 'all', label: 'All', count: reports.length },
            { key: 'PENDING', label: 'Pending', count: reports.filter(r => r.status === 'PENDING').length },
            { key: 'REVIEWED', label: 'Reviewed', count: reports.filter(r => r.status === 'REVIEWED').length },
            { key: 'RESOLVED', label: 'Resolved', count: reports.filter(r => r.status === 'RESOLVED').length }
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

        {/* Reports List */}
        <View style={styles.reportsList}>
          {filteredReports.map((report) => (
            <View key={report.id} style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => toggleReportSelection(report.id)}
                >
                  <Ionicons 
                    name={selectedReports.includes(report.id) ? "checkbox" : "square-outline"} 
                    size={20} 
                    color="#4682B4" 
                  />
                </TouchableOpacity>

                <View style={styles.reportInfo}>
                  <View style={styles.reportTitle}>
                    <Ionicons 
                      name={getContentTypeIcon(report.contentType) as any} 
                      size={16} 
                      color="#6b7280" 
                    />
                    <Text style={styles.contentType}>{report.contentType}</Text>
                    <View style={[
                      styles.priorityBadge,
                      { backgroundColor: getPriorityColor(report.priority) }
                    ]}>
                      <Text style={styles.priorityText}>{report.priority}</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.reportReason}>{report.reason}</Text>
                  <Text style={styles.reportContent} numberOfLines={2}>
                    {report.content}
                  </Text>
                </View>

                <View style={styles.reportMeta}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(report.status) }
                  ]}>
                    <Text style={styles.statusText}>{report.status}</Text>
                  </View>
                  <Text style={styles.reportTime}>{formatDate(report.createdAt)}</Text>
                  <Text style={styles.reportCount}>{report.reportCount} report(s)</Text>
                </View>
              </View>

              <View style={styles.reportFooter}>
                <Text style={styles.reporterInfo}>
                  Reported by: {report.reporter.fullName}
                </Text>
                
                {report.status === 'PENDING' && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleReportAction(report)}
                  >
                    <Text style={styles.actionButtonText}>Take Action</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Action Modal */}
      <Modal
        visible={showActionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Moderation Action</Text>
              <TouchableOpacity onPress={() => setShowActionModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedReport && (
              <View style={styles.modalBody}>
                <View style={styles.reportPreview}>
                  <Text style={styles.previewTitle}>
                    {selectedReport.contentType} - {selectedReport.reason}
                  </Text>
                  <Text style={styles.previewContent}>{selectedReport.content}</Text>
                </View>

                <TextInput
                  style={styles.notesInput}
                  placeholder="Add moderation notes..."
                  value={actionNotes}
                  onChangeText={setActionNotes}
                  multiline
                  numberOfLines={3}
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalActionButton, { backgroundColor: '#10b981' }]}
                    onPress={() => executeAction('resolve')}
                  >
                    <Text style={styles.modalActionButtonText}>Resolve</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalActionButton, { backgroundColor: '#6b7280' }]}
                    onPress={() => executeAction('dismiss')}
                  >
                    <Text style={styles.modalActionButtonText}>Dismiss</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalActionButton, { backgroundColor: '#f59e0b' }]}
                    onPress={() => executeAction('escalate')}
                  >
                    <Text style={styles.modalActionButtonText}>Escalate</Text>
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
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: Math.max(16, width * 0.05),
      gap: Math.max(12, width * 0.03),
      marginBottom: 24,
    },
    statCard: {
      width: isTablet ? '47%' : '100%',
      backgroundColor: 'white',
      padding: Math.max(16, width * 0.04),
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      marginBottom: isTablet ? 0 : 12,
    },
    statHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    statTitle: {
      fontSize: isTablet ? 14 : isSmallScreen ? 12 : 13,
      fontWeight: '600',
      color: '#6b7280',
    },
    statValue: {
      fontSize: isTablet ? 20 : isSmallScreen ? 16 : 18,
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: 4,
    },
    statSubtitle: {
      fontSize: isTablet ? 12 : isSmallScreen ? 10 : 11,
      color: '#9ca3af',
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
      color: '#4682B4',
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
      backgroundColor: '#4682B4',
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
    reportsList: {
      paddingHorizontal: Math.max(16, width * 0.05),
      paddingBottom: Math.max(32, height * 0.04),
    },
    reportCard: {
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
    reportHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
      gap: 12,
    },
    checkbox: {
      padding: 4,
    },
    reportInfo: {
      flex: 1,
    },
    reportTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
      gap: 8,
    },
    contentType: {
      fontSize: isTablet ? 14 : isSmallScreen ? 11 : 12,
      fontWeight: '600',
      color: '#111827',
    },
    priorityBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    priorityText: {
      fontSize: 10,
      fontWeight: '600',
      color: 'white',
    },
    reportReason: {
      fontSize: isTablet ? 13 : isSmallScreen ? 10 : 11,
      color: '#6b7280',
      marginBottom: 4,
    },
    reportContent: {
      fontSize: isTablet ? 12 : isSmallScreen ? 10 : 11,
      color: '#9ca3af',
      lineHeight: 16,
    },
    reportMeta: {
      alignItems: 'flex-end',
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginBottom: 4,
    },
    statusText: {
      fontSize: 10,
      fontWeight: '600',
      color: 'white',
    },
    reportTime: {
      fontSize: 10,
      color: '#9ca3af',
      marginBottom: 2,
    },
    reportCount: {
      fontSize: 10,
      color: '#6b7280',
    },
    reportFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: '#f3f4f6',
    },
    reporterInfo: {
      fontSize: isTablet ? 12 : isSmallScreen ? 10 : 11,
      color: '#6b7280',
    },
    actionButton: {
      backgroundColor: '#4682B4',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    actionButtonText: {
      color: 'white',
      fontSize: 11,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: 'white',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#111827',
    },
    modalBody: {
      paddingBottom: 20,
    },
    reportPreview: {
      backgroundColor: '#f3f4f6',
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    previewTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#111827',
      marginBottom: 8,
    },
    previewContent: {
      fontSize: 12,
      color: '#6b7280',
      lineHeight: 18,
    },
    notesInput: {
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
