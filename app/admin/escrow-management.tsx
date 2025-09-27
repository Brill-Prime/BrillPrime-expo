
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

interface EscrowTransaction {
  id: string;
  transactionId: string;
  orderId: string;
  buyerName: string;
  sellerName: string;
  totalAmount: number;
  status: 'HELD' | 'DISPUTED' | 'RELEASED' | 'REFUNDED';
  createdAt: string;
  autoReleaseAt?: string;
  disputeReason?: string;
}

export default function AdminEscrowManagement() {
  const router = useRouter();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'held' | 'disputed' | 'released'>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<EscrowTransaction | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([
    {
      id: '1',
      transactionId: 'TXN001',
      orderId: 'ORD001',
      buyerName: 'John Doe',
      sellerName: 'Prime Store',
      totalAmount: 15000,
      status: 'HELD',
      createdAt: '2024-01-15T10:30:00Z',
      autoReleaseAt: '2024-01-18T10:30:00Z',
    },
    {
      id: '2',
      transactionId: 'TXN002',
      orderId: 'ORD002',
      buyerName: 'Jane Smith',
      sellerName: 'Fresh Market',
      totalAmount: 8500,
      status: 'DISPUTED',
      createdAt: '2024-01-14T15:20:00Z',
      disputeReason: 'Product not delivered as described',
    },
    {
      id: '3',
      transactionId: 'TXN003',
      orderId: 'ORD003',
      buyerName: 'Mike Johnson',
      sellerName: 'Tech Hub',
      totalAmount: 32000,
      status: 'RELEASED',
      createdAt: '2024-01-13T09:15:00Z',
    },
  ]);

  const escrowStats = {
    totalBalance: 125000000,
    heldAmount: 45000000,
    disputedAmount: 8500000,
    releasedToday: 15000000,
    activeTransactions: 45,
    disputedTransactions: 5,
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

  const getFilteredTransactions = () => {
    if (activeFilter === 'all') return transactions;
    return transactions.filter(t => t.status.toLowerCase() === activeFilter);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HELD': return '#f59e0b';
      case 'DISPUTED': return '#ef4444';
      case 'RELEASED': return '#10b981';
      case 'REFUNDED': return '#6366f1';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'HELD': return 'time';
      case 'DISPUTED': return 'warning';
      case 'RELEASED': return 'checkmark-circle';
      case 'REFUNDED': return 'return-up-back';
      default: return 'help-circle';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
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

  const handleTransactionAction = (transaction: EscrowTransaction) => {
    setSelectedTransaction(transaction);
    setShowActionModal(true);
  };

  const executeAction = (action: 'release' | 'refund' | 'investigate') => {
    if (!selectedTransaction) return;

    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${action} this transaction?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            // Update transaction status
            setTransactions(prev => 
              prev.map(t => 
                t.id === selectedTransaction.id 
                  ? { 
                      ...t, 
                      status: action === 'release' ? 'RELEASED' : action === 'refund' ? 'REFUNDED' : t.status 
                    }
                  : t
              )
            );
            setShowActionModal(false);
            setActionNotes('');
            Alert.alert('Success', `Transaction ${action} completed successfully.`);
          }
        }
      ]
    );
  };

  const StatCard = ({ title, value, subtitle, icon, color }: {
    title: string;
    value: string;
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

  const filteredTransactions = getFilteredTransactions();
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
        <Text style={styles.headerTitle}>Escrow Management</Text>
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
            title="Total Balance"
            value={formatCurrency(escrowStats.totalBalance)}
            subtitle={`${escrowStats.activeTransactions} active transactions`}
            icon="wallet"
            color="#10b981"
          />
          
          <StatCard
            title="Held Amount"
            value={formatCurrency(escrowStats.heldAmount)}
            subtitle="Awaiting release"
            icon="time"
            color="#f59e0b"
          />
          
          <StatCard
            title="Disputed"
            value={formatCurrency(escrowStats.disputedAmount)}
            subtitle={`${escrowStats.disputedTransactions} disputes`}
            icon="warning"
            color="#ef4444"
          />
          
          <StatCard
            title="Released Today"
            value={formatCurrency(escrowStats.releasedToday)}
            subtitle="Successfully completed"
            icon="checkmark-circle"
            color="#6366f1"
          />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          {[
            { key: 'all', label: 'All', count: transactions.length },
            { key: 'held', label: 'Held', count: transactions.filter(t => t.status === 'HELD').length },
            { key: 'disputed', label: 'Disputed', count: transactions.filter(t => t.status === 'DISPUTED').length },
            { key: 'released', label: 'Released', count: transactions.filter(t => t.status === 'RELEASED').length }
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterTab,
                activeFilter === filter.key && styles.activeFilterTab
              ]}
              onPress={() => setActiveFilter(filter.key as any)}
            >
              <Text style={[
                styles.filterTabText,
                activeFilter === filter.key && styles.activeFilterTabText
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

        {/* Transactions List */}
        <View style={styles.transactionsList}>
          {filteredTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionHeader}>
                <View>
                  <Text style={styles.transactionId}>#{transaction.transactionId}</Text>
                  <Text style={styles.orderId}>Order: {transaction.orderId}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(transaction.status) }
                ]}>
                  <Ionicons 
                    name={getStatusIcon(transaction.status) as any} 
                    size={12} 
                    color="white" 
                  />
                  <Text style={styles.statusText}>{transaction.status}</Text>
                </View>
              </View>

              <View style={styles.transactionBody}>
                <View style={styles.partyInfo}>
                  <Text style={styles.partyLabel}>Buyer:</Text>
                  <Text style={styles.partyName}>{transaction.buyerName}</Text>
                </View>
                <View style={styles.partyInfo}>
                  <Text style={styles.partyLabel}>Seller:</Text>
                  <Text style={styles.partyName}>{transaction.sellerName}</Text>
                </View>
                
                <View style={styles.amountInfo}>
                  <Text style={styles.amountLabel}>Amount:</Text>
                  <Text style={styles.amountValue}>{formatCurrency(transaction.totalAmount)}</Text>
                </View>

                <Text style={styles.dateText}>
                  Created: {formatDate(transaction.createdAt)}
                </Text>

                {transaction.autoReleaseAt && (
                  <Text style={styles.autoReleaseText}>
                    Auto-release: {formatDate(transaction.autoReleaseAt)}
                  </Text>
                )}

                {transaction.disputeReason && (
                  <Text style={styles.disputeReason}>
                    Dispute: {transaction.disputeReason}
                  </Text>
                )}
              </View>

              {(transaction.status === 'HELD' || transaction.status === 'DISPUTED') && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleTransactionAction(transaction)}
                >
                  <Text style={styles.actionButtonText}>Take Action</Text>
                </TouchableOpacity>
              )}
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
              <Text style={styles.modalTitle}>Transaction Action</Text>
              <TouchableOpacity onPress={() => setShowActionModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedTransaction && (
              <View style={styles.modalBody}>
                <Text style={styles.modalSubtitle}>
                  {selectedTransaction.transactionId} - {formatCurrency(selectedTransaction.totalAmount)}
                </Text>

                <TextInput
                  style={styles.notesInput}
                  placeholder="Add notes for this action..."
                  value={actionNotes}
                  onChangeText={setActionNotes}
                  multiline
                  numberOfLines={3}
                />

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.modalActionButton, { backgroundColor: '#10b981' }]}
                    onPress={() => executeAction('release')}
                  >
                    <Text style={styles.modalActionButtonText}>Release to Seller</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalActionButton, { backgroundColor: '#6366f1' }]}
                    onPress={() => executeAction('refund')}
                  >
                    <Text style={styles.modalActionButtonText}>Refund to Buyer</Text>
                  </TouchableOpacity>

                  {selectedTransaction.status === 'DISPUTED' && (
                    <TouchableOpacity
                      style={[styles.modalActionButton, { backgroundColor: '#f59e0b' }]}
                      onPress={() => executeAction('investigate')}
                    >
                      <Text style={styles.modalActionButtonText}>Need Investigation</Text>
                    </TouchableOpacity>
                  )}
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
    transactionsList: {
      paddingHorizontal: Math.max(16, width * 0.05),
      paddingBottom: Math.max(32, height * 0.04),
    },
    transactionCard: {
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
    transactionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    transactionId: {
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      fontWeight: '600',
      color: '#111827',
    },
    orderId: {
      fontSize: isTablet ? 12 : isSmallScreen ? 10 : 11,
      color: '#6b7280',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    statusText: {
      fontSize: 10,
      fontWeight: '600',
      color: 'white',
    },
    transactionBody: {
      marginBottom: 12,
    },
    partyInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    partyLabel: {
      fontSize: isTablet ? 12 : isSmallScreen ? 10 : 11,
      color: '#6b7280',
    },
    partyName: {
      fontSize: isTablet ? 12 : isSmallScreen ? 10 : 11,
      fontWeight: '500',
      color: '#111827',
    },
    amountInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
      marginBottom: 8,
    },
    amountLabel: {
      fontSize: isTablet ? 14 : isSmallScreen ? 11 : 12,
      color: '#6b7280',
    },
    amountValue: {
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      fontWeight: '600',
      color: '#111827',
    },
    dateText: {
      fontSize: isTablet ? 12 : isSmallScreen ? 10 : 11,
      color: '#9ca3af',
      marginTop: 4,
    },
    autoReleaseText: {
      fontSize: isTablet ? 12 : isSmallScreen ? 10 : 11,
      color: '#f59e0b',
      marginTop: 2,
    },
    disputeReason: {
      fontSize: isTablet ? 12 : isSmallScreen ? 10 : 11,
      color: '#ef4444',
      marginTop: 4,
      fontStyle: 'italic',
    },
    actionButton: {
      backgroundColor: 'rgb(11, 26, 81)',
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
    },
    actionButtonText: {
      color: 'white',
      fontSize: isTablet ? 14 : isSmallScreen ? 11 : 12,
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
    modalSubtitle: {
      fontSize: 14,
      color: '#6b7280',
      marginBottom: 16,
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
    actionButtons: {
      gap: 12,
    },
    modalActionButton: {
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
