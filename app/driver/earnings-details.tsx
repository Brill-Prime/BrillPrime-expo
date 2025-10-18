
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../config/theme';

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

interface EarningsBreakdown {
  deliveryFees: number;
  tips: number;
  bonuses: number;
  fuelReimbursement: number;
  tollReimbursement: number;
}

interface Transaction {
  id: string;
  date: string;
  type: 'delivery' | 'tip' | 'bonus' | 'payout' | 'reimbursement';
  description: string;
  amount: number;
  status: 'completed' | 'pending' | 'processing';
  orderId?: string;
}

export default function DriverEarningsDetails() {
  const router = useRouter();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('week');
  
  const [summary, setSummary] = useState<EarningsSummary>({
    totalEarnings: 45750.00,
    todayEarnings: 3200.00,
    weekEarnings: 18500.00,
    monthEarnings: 45750.00,
    completedDeliveries: 127,
    averagePerDelivery: 360.24,
    pendingPayout: 8300.00,
    lastPayoutDate: '2025-01-20',
    lastPayoutAmount: 15000.00,
  });

  const [breakdown, setBreakdown] = useState<EarningsBreakdown>({
    deliveryFees: 35000.00,
    tips: 5500.00,
    bonuses: 3250.00,
    fuelReimbursement: 1500.00,
    tollReimbursement: 500.00,
  });

  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      date: '2025-01-28 14:30',
      type: 'delivery',
      description: 'Delivery #ORD-1001',
      amount: 450.00,
      status: 'completed',
      orderId: 'ORD-1001',
    },
    {
      id: '2',
      date: '2025-01-28 12:15',
      type: 'tip',
      description: 'Customer tip - ORD-1000',
      amount: 100.00,
      status: 'completed',
      orderId: 'ORD-1000',
    },
    {
      id: '3',
      date: '2025-01-27 18:45',
      type: 'bonus',
      description: 'Weekend delivery bonus',
      amount: 500.00,
      status: 'completed',
    },
    {
      id: '4',
      date: '2025-01-27 16:20',
      type: 'delivery',
      description: 'Delivery #ORD-0999',
      amount: 380.00,
      status: 'completed',
      orderId: 'ORD-0999',
    },
    {
      id: '5',
      date: '2025-01-26 11:00',
      type: 'reimbursement',
      description: 'Fuel reimbursement',
      amount: 250.00,
      status: 'processing',
    },
  ]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    loadEarningsData();

    return () => subscription?.remove();
  }, []);

  const loadEarningsData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      // TODO: Implement API call to fetch earnings data
      // const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/driver/earnings`, {
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });
    } catch (error) {
      console.error('Error loading earnings data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEarningsData();
    setTimeout(() => setRefreshing(false), 1000);
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
        return 'car-outline';
      case 'tip':
        return 'heart-outline';
      case 'bonus':
        return 'gift-outline';
      case 'payout':
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
          {/* Earnings Summary Card */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Current Balance</Text>
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
                    {period.charAt(0).toUpperCase() + period.slice(1)}
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
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>

          {/* Earnings Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Earnings Breakdown</Text>
            <View style={styles.breakdownCard}>
              {[
                { label: 'Delivery Fees', amount: breakdown.deliveryFees, icon: 'car-outline', color: '#4682B4' },
                { label: 'Tips', amount: breakdown.tips, icon: 'heart-outline', color: '#ef4444' },
                { label: 'Bonuses', amount: breakdown.bonuses, icon: 'gift-outline', color: '#8b5cf6' },
                { label: 'Fuel Reimbursement', amount: breakdown.fuelReimbursement, icon: 'water-outline', color: '#f59e0b' },
                { label: 'Toll Reimbursement', amount: breakdown.tollReimbursement, icon: 'card-outline', color: '#10b981' },
              ].map((item, index) => (
                <View key={index} style={styles.breakdownItem}>
                  <View style={styles.breakdownLeft}>
                    <View style={[styles.breakdownIcon, { backgroundColor: item.color + '20' }]}>
                      <Ionicons name={item.icon as any} size={20} color={item.color} />
                    </View>
                    <Text style={styles.breakdownLabel}>{item.label}</Text>
                  </View>
                  <Text style={styles.breakdownAmount}>{formatCurrency(item.amount)}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Last Payout Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Last Payout</Text>
            <View style={styles.payoutCard}>
              <View style={styles.payoutRow}>
                <Text style={styles.payoutLabel}>Date</Text>
                <Text style={styles.payoutValue}>
                  {new Date(summary.lastPayoutDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
              <View style={styles.payoutRow}>
                <Text style={styles.payoutLabel}>Amount</Text>
                <Text style={[styles.payoutValue, styles.payoutAmount]}>
                  {formatCurrency(summary.lastPayoutAmount)}
                </Text>
              </View>
            </View>
          </View>

          {/* Transaction History */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
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
                    +{formatCurrency(transaction.amount)}
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

          {/* Request Payout Button */}
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={styles.payoutButton}
              onPress={() => {
                router.push('/payment/index');
              }}
            >
              <Ionicons name="wallet-outline" size={20} color="white" />
              <Text style={styles.payoutButtonText}>Request Payout</Text>
            </TouchableOpacity>
          </View>
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
    refreshButton: {
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
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
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
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
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
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
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
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
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
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
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
