import { withRoleAccess } from '../../components/withRoleAccess';

import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { transactionService } from '../../services/transactionService';
import { orderService } from '../../services/orderService';

interface EarningsSummary {
  totalEarnings: number;
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  completedDeliveries: number;
  averagePerDelivery: number;
  pendingPayout: number;
  lastPayoutDate: string;
  lastPayoutAmount: number;
}

interface Transaction {
  id: string;
  date: string;
  type: string;
  description: string;
  amount: number;
  status: string;
  orderId?: string;
}

function DriverEarningsDetails() {
  const router = useRouter();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [completedDeliveries, setCompletedDeliveries] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [realtimeError, setRealtimeError] = useState<string | null>(null);

  const loadEarnings = useCallback(async () => {
    setLoadError(null);
    try {
      const [transactionsResult, ordersResult] = await Promise.all([
        transactionService.getMyTransactions(),
        orderService.getDriverOrders(),
      ]);

      if (!transactionsResult.success || !transactionsResult.transactions) {
        setLoadError(transactionsResult.error || 'Unable to load earnings transactions.');
        return;
      }
      if (!ordersResult.success || !ordersResult.data) {
        setLoadError(ordersResult.error || 'Unable to load completed deliveries.');
        return;
      }

      setTransactions(transactionsResult.transactions.map(transaction => ({
        id: transaction.id,
        date: transaction.date,
        type: transaction.type,
        description: transaction.description,
        amount: Number(transaction.amount) || 0,
        status: transaction.status,
        orderId: transaction.orderId,
      })));
      setCompletedDeliveries(
        ordersResult.data.orders.filter(order => order.status?.toLowerCase() === 'delivered').length
      );
    } catch (error) {
      console.error('Error fetching driver earnings:', error);
      setLoadError('Unable to load earnings. Retry to try again.');
    }
  }, []);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    const initialize = async () => {
      try {
        await loadEarnings();
        const subscription = await transactionService.subscribeToMyTransactions(() => {
          if (active) void loadEarnings();
        });
        if (!active) {
          subscription.unsubscribe();
          return;
        }
        unsubscribe = subscription.unsubscribe;
        if (subscription.error) setRealtimeError(subscription.error);
      } catch (error) {
        console.error('Error loading driver earnings:', error);
        if (active) setLoadError('Unable to load earnings. Retry to try again.');
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void initialize();
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [loadEarnings]);

  const earnings = transactions.filter(
    transaction => transaction.type === 'commission' && transaction.status === 'completed'
  );
  const totalEarnings = earnings.reduce((total, transaction) => total + transaction.amount, 0);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(todayStart.getDate() - todayStart.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const earningsSince = (start: Date) => earnings
    .filter(transaction => new Date(transaction.date) >= start)
    .reduce((total, transaction) => total + transaction.amount, 0);
  const lastPayout = transactions
    .filter(transaction => transaction.type === 'withdrawal' && transaction.status === 'completed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const summary: EarningsSummary = {
    totalEarnings,
    todayEarnings: earningsSince(todayStart),
    weekEarnings: earningsSince(weekStart),
    monthEarnings: earningsSince(monthStart),
    completedDeliveries,
    averagePerDelivery: earnings.length > 0 ? totalEarnings / earnings.length : 0,
    pendingPayout: transactions
      .filter(transaction => transaction.type === 'withdrawal' && transaction.status === 'pending')
      .reduce((total, transaction) => total + transaction.amount, 0),
    lastPayoutDate: lastPayout?.date || '',
    lastPayoutAmount: lastPayout?.amount || 0,
  };

  const refreshEarnings = async () => {
    setRefreshing(true);
    try {
      await loadEarnings();
    } finally {
      setRefreshing(false);
    }
  };

  const retryLoading = async () => {
    setIsLoading(true);
    try {
      await loadEarnings();
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentPeriodEarnings = () => {
    switch (selectedPeriod) {
      case 'today':
        return summary.todayEarnings;
      case 'week':
        return summary.weekEarnings;
      case 'month':
        return summary.monthEarnings;
      case 'all':
        return summary.totalEarnings;
      default:
        return summary.weekEarnings;
    }
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'delivery':
      case 'commission':
        return 'car-outline';
      case 'tip':
        return 'heart-outline';
      case 'bonus':
        return 'gift-outline';
      case 'payout':
      case 'withdrawal':
        return 'card-outline';
      case 'reimbursement':
        return 'repeat-outline';
      default:
        return 'cash-outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'processing':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const styles = getResponsiveStyles(screenData);

  return (
    <LinearGradient
      colors={['rgb(11, 26, 81)', '#1e3a8a']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Earnings Details</Text>
          <View style={styles.headerActionPlaceholder} />
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refreshEarnings} />
          }
        >
          {realtimeError && (
            <Text style={styles.emptyTransactions}>
              Live updates are unavailable. Pull down to refresh.
            </Text>
          )}
          {isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTransactions}>Loading earnings...</Text>
            </View>
          ) : loadError ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTransactions}>{loadError}</Text>
              <TouchableOpacity onPress={() => void retryLoading()}>
                <Text style={styles.sectionTitle}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
          <>
          {/* Earnings Summary Card */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Earnings in selected period</Text>
            <Text style={styles.summaryAmount}>
              {formatCurrency(getCurrentPeriodEarnings())}
            </Text>

            {/* Period Selector */}
            <View style={styles.periodSelector}>
              {(['today', 'week', 'month', 'all'] as const).map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.periodButton,
                    selectedPeriod === period && styles.periodButtonActive,
                  ]}
                  onPress={() => setSelectedPeriod(period)}
                >
                  <Text
                    style={[
                      styles.periodButtonText,
                      selectedPeriod === period && styles.periodButtonTextActive,
                    ]}
                  >
                    {period === 'all' ? 'Loaded' : period.charAt(0).toUpperCase() + period.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              <Text style={styles.statValue}>{summary.completedDeliveries}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="trending-up" size={24} color="#3b82f6" />
              <Text style={styles.statValue}>{formatCurrency(summary.averagePerDelivery)}</Text>
              <Text style={styles.statLabel}>Avg/Delivery</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="time" size={24} color="#f59e0b" />
              <Text style={styles.statValue}>{formatCurrency(summary.pendingPayout)}</Text>
              <Text style={styles.statLabel}>Pending Withdrawals</Text>
            </View>
          </View>

          {/* Last Payout Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Last Payout</Text>
            <View style={styles.payoutCard}>
              <View style={styles.payoutRow}>
                <Text style={styles.payoutLabel}>Date</Text>
                <Text style={styles.payoutValue}>
                  {summary.lastPayoutDate ? new Date(summary.lastPayoutDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }) : 'No payout recorded'}
                </Text>
              </View>
              <View style={styles.payoutRow}>
                <Text style={styles.payoutLabel}>Amount</Text>
                <Text style={[styles.payoutValue, styles.payoutAmount]}>
                  {lastPayout ? formatCurrency(summary.lastPayoutAmount) : '—'}
                </Text>
              </View>
            </View>
          </View>

          {/* Transaction History */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Transaction Records</Text>
            <Text style={styles.emptyTransactions}>
              Showing the latest {transactions.length} records returned by the transactions service.
            </Text>
            {transactions.length === 0 && (
              <Text style={styles.emptyTransactions}>No transaction records are available.</Text>
            )}
            {transactions.map((transaction) => (
              <TouchableOpacity
                key={transaction.id}
                style={styles.transactionCard}
                onPress={() => {
                  if (transaction.orderId) {
                    router.push(`/orders/order-details?orderId=${transaction.orderId}`);
                  }
                }}
              >
                <View style={styles.transactionLeft}>
                  <View style={styles.transactionIcon}>
                    <Ionicons
                      name={getTransactionIcon(transaction.type) as any}
                      size={20}
                      color="rgb(11, 26, 81)"
                    />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionDescription}>
                      {transaction.description}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {formatDate(transaction.date)}
                    </Text>
                  </View>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={styles.transactionAmount}>
                    {transaction.type === 'commission' || transaction.type === 'deposit' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(transaction.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.actionSection}>
            <Text style={styles.emptyTransactions}>
              Payout requests are unavailable because no payout request endpoint is configured.
            </Text>
          </View>
          </>
          )}
        </ScrollView>
      </SafeAreaView>
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
    safeArea: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: Math.max(16, width * 0.05),
      paddingTop: Math.max(50, height * 0.07),
    },
    backButton: {
      padding: Math.max(8, width * 0.02),
    },
    headerTitle: {
      fontSize: isTablet ? 24 : isSmallScreen ? 18 : 20,
      fontWeight: 'bold',
      color: 'white',
    },
    headerActionPlaceholder: {
      width: 40,
      padding: Math.max(8, width * 0.02),
    },
    content: {
      flex: 1,
      backgroundColor: 'white',
      borderTopLeftRadius: 35,
      borderTopRightRadius: 35,
      paddingTop: Math.max(24, height * 0.03),
    },
    summaryCard: {
      marginHorizontal: Math.max(16, width * 0.05),
      marginBottom: 20,
      padding: 24,
      backgroundColor: 'rgb(11, 26, 81)',
      borderRadius: 20,
      boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
      elevation: 6,
    },
    summaryLabel: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
      marginBottom: 8,
    },
    summaryAmount: {
      fontSize: isTablet ? 36 : isSmallScreen ? 28 : 32,
      fontWeight: 'bold',
      color: 'white',
      marginBottom: 20,
    },
    periodSelector: {
      flexDirection: 'row',
      gap: 8,
    },
    periodButton: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      alignItems: 'center',
    },
    periodButtonActive: {
      backgroundColor: 'white',
    },
    periodButtonText: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.8)',
      fontWeight: '500',
    },
    periodButtonTextActive: {
      color: 'rgb(11, 26, 81)',
      fontWeight: '600',
    },
    statsGrid: {
      flexDirection: 'row',
      paddingHorizontal: Math.max(16, width * 0.05),
      marginBottom: 20,
      gap: 12,
    },
    statCard: {
      flex: 1,
      backgroundColor: 'white',
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      elevation: 3,
    },
    statValue: {
      fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
      fontWeight: 'bold',
      color: '#111827',
      marginTop: 8,
    },
    statLabel: {
      fontSize: isTablet ? 11 : 10,
      color: '#6b7280',
      marginTop: 4,
    },
    section: {
      paddingHorizontal: Math.max(16, width * 0.05),
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: isTablet ? 18 : isSmallScreen ? 15 : 16,
      fontWeight: '600',
      color: '#111827',
      marginBottom: 12,
    },
    breakdownCard: {
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 16,
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      elevation: 3,
    },
    breakdownItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#f3f4f6',
    },
    breakdownLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    breakdownIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    breakdownLabel: {
      fontSize: isTablet ? 14 : isSmallScreen ? 12 : 13,
      color: '#374151',
      flex: 1,
    },
    breakdownAmount: {
      fontSize: isTablet ? 15 : isSmallScreen ? 13 : 14,
      fontWeight: '600',
      color: '#111827',
    },
    payoutCard: {
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 16,
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      elevation: 3,
    },
    payoutRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
    },
    payoutLabel: {
      fontSize: 14,
      color: '#6b7280',
    },
    payoutValue: {
      fontSize: 14,
      fontWeight: '600',
      color: '#111827',
    },
    payoutAmount: {
      color: '#10b981',
      fontSize: 16,
    },
    transactionCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      elevation: 3,
    },
    emptyTransactions: {
      color: '#6b7280',
      paddingVertical: 16,
      textAlign: 'center',
    },
    emptyState: {
      paddingHorizontal: Math.max(16, width * 0.05),
      paddingVertical: 32,
      alignItems: 'center',
    },
    transactionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    transactionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#f3f4f6',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    transactionInfo: {
      flex: 1,
    },
    transactionDescription: {
      fontSize: isTablet ? 14 : isSmallScreen ? 12 : 13,
      fontWeight: '500',
      color: '#111827',
      marginBottom: 4,
    },
    transactionDate: {
      fontSize: isTablet ? 11 : 10,
      color: '#6b7280',
    },
    transactionRight: {
      alignItems: 'flex-end',
    },
    transactionAmount: {
      fontSize: isTablet ? 15 : isSmallScreen ? 13 : 14,
      fontWeight: '600',
      color: '#10b981',
      marginBottom: 4,
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
    actionSection: {
      paddingHorizontal: Math.max(16, width * 0.05),
      paddingBottom: 32,
    },
    payoutButton: {
      flexDirection: 'row',
      backgroundColor: 'rgb(11, 26, 81)',
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    payoutButtonText: {
      color: 'white',
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      fontWeight: '600',
    },
  });
};

export default withRoleAccess(DriverEarningsDetails, {
  requiredRole: 'driver',
  fallbackRoute: '/home/consumer',
  showUnauthorizedMessage: true,
});
