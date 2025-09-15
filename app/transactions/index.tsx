
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Transaction {
  id: string;
  type: 'purchase' | 'refund' | 'payment' | 'reward';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  orderId?: string;
}

export default function TransactionHistory() {
  const router = useRouter();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'purchase' | 'refund' | 'payment' | 'reward'>('all');
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'purchase',
      amount: 150.00,
      description: 'Electronics Purchase - Order #12345',
      date: '2024-01-15',
      status: 'completed',
      orderId: '12345'
    },
    {
      id: '2',
      type: 'payment',
      amount: 25.00,
      description: 'Payment Processing Fee',
      date: '2024-01-15',
      status: 'completed'
    },
    {
      id: '3',
      type: 'refund',
      amount: 75.00,
      description: 'Refund for Order #12340',
      date: '2024-01-10',
      status: 'completed',
      orderId: '12340'
    },
    {
      id: '4',
      type: 'purchase',
      amount: 320.50,
      description: 'Grocery Purchase - Order #12338',
      date: '2024-01-08',
      status: 'completed',
      orderId: '12338'
    },
    {
      id: '5',
      type: 'reward',
      amount: 10.00,
      description: 'Cashback Reward',
      date: '2024-01-05',
      status: 'completed'
    },
    {
      id: '6',
      type: 'purchase',
      amount: 89.99,
      description: 'Fashion Purchase - Order #12335',
      date: '2024-01-03',
      status: 'pending',
      orderId: '12335'
    }
  ]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    return () => subscription?.remove();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getFilteredTransactions = () => {
    if (selectedFilter === 'all') return transactions;
    return transactions.filter(t => t.type === selectedFilter);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'card';
      case 'refund':
        return 'return-up-back';
      case 'payment':
        return 'wallet';
      case 'reward':
        return 'gift';
      default:
        return 'receipt';
    }
  };

  const getTransactionColor = (type: string, status: string) => {
    if (status === 'failed') return '#ff6b6b';
    if (status === 'pending') return '#f59e0b';
    
    switch (type) {
      case 'purchase':
      case 'payment':
        return '#ff6b6b';
      case 'refund':
      case 'reward':
        return '#4ade80';
      default:
        return '#667eea';
    }
  };

  const formatAmount = (amount: number, type: string) => {
    const sign = (type === 'refund' || type === 'reward') ? '+' : '-';
    return `${sign}₹${amount.toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4ade80';
      case 'pending':
        return '#f59e0b';
      case 'failed':
        return '#ff6b6b';
      default:
        return '#6b7280';
    }
  };

  const filteredTransactions = getFilteredTransactions();
  const totalSpent = transactions
    .filter(t => (t.type === 'purchase' || t.type === 'payment') && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalRefunds = transactions
    .filter(t => (t.type === 'refund' || t.type === 'reward') && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'purchase', label: 'Purchases' },
    { key: 'refund', label: 'Refunds' },
    { key: 'payment', label: 'Payments' },
    { key: 'reward', label: 'Rewards' }
  ];

  const styles = getResponsiveStyles(screenData);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction History</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryAmount}>₹{totalSpent.toFixed(2)}</Text>
          <Text style={styles.summaryLabel}>Total Spent</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryAmount, { color: '#4ade80' }]}>₹{totalRefunds.toFixed(2)}</Text>
          <Text style={styles.summaryLabel}>Total Refunds</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              selectedFilter === filter.key && styles.activeFilterButton
            ]}
            onPress={() => setSelectedFilter(filter.key as any)}
          >
            <Text style={[
              styles.filterText,
              selectedFilter === filter.key && styles.activeFilterText
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Transactions List */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((transaction) => (
            <TouchableOpacity
              key={transaction.id}
              style={styles.transactionCard}
              activeOpacity={0.7}
            >
              <View style={styles.transactionContent}>
                <View style={[
                  styles.iconContainer,
                  { backgroundColor: getTransactionColor(transaction.type, transaction.status) + '20' }
                ]}>
                  <Ionicons
                    name={getTransactionIcon(transaction.type) as any}
                    size={24}
                    color={getTransactionColor(transaction.type, transaction.status)}
                  />
                </View>
                
                <View style={styles.textContainer}>
                  <View style={styles.titleRow}>
                    <Text style={styles.transactionTitle}>
                      {transaction.description}
                    </Text>
                    <Text style={[
                      styles.amount,
                      { color: getTransactionColor(transaction.type, transaction.status) }
                    ]}>
                      {formatAmount(transaction.amount, transaction.type)}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.date}>{transaction.date}</Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(transaction.status) + '20' }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: getStatusColor(transaction.status) }
                      ]}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No transactions found</Text>
            <Text style={styles.emptyMessage}>
              No transactions match your current filter. Try selecting a different filter.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const getResponsiveStyles = (screenData: any) => {
  const { width, height } = screenData;
  const isTablet = width >= 768;
  const isSmallScreen = width < 350;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f8f9fa',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Math.max(16, width * 0.04),
      paddingTop: Math.max(50, height * 0.07),
      paddingBottom: Math.max(16, height * 0.02),
      backgroundColor: 'white',
      borderBottomWidth: 1,
      borderBottomColor: '#e9ecef',
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: isTablet ? 24 : isSmallScreen ? 18 : 20,
      fontWeight: 'bold',
      color: '#333',
    },
    placeholder: {
      width: 40,
    },
    summaryContainer: {
      flexDirection: 'row',
      paddingHorizontal: Math.max(16, width * 0.04),
      paddingVertical: Math.max(16, height * 0.02),
      gap: 12,
    },
    summaryCard: {
      flex: 1,
      backgroundColor: 'white',
      padding: Math.max(16, width * 0.04),
      borderRadius: 12,
      alignItems: 'center',
    },
    summaryAmount: {
      fontSize: isTablet ? 24 : isSmallScreen ? 18 : 20,
      fontWeight: 'bold',
      color: '#ff6b6b',
      marginBottom: 4,
    },
    summaryLabel: {
      fontSize: isTablet ? 14 : isSmallScreen ? 10 : 12,
      color: '#666',
    },
    filterContainer: {
      maxHeight: 50,
      marginBottom: 8,
    },
    filterContent: {
      paddingHorizontal: Math.max(16, width * 0.04),
      gap: 8,
    },
    filterButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: 'white',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#e9ecef',
    },
    activeFilterButton: {
      backgroundColor: '#667eea',
      borderColor: '#667eea',
    },
    filterText: {
      fontSize: isTablet ? 14 : isSmallScreen ? 10 : 12,
      color: '#666',
      fontWeight: '500',
    },
    activeFilterText: {
      color: 'white',
    },
    content: {
      flex: 1,
      paddingHorizontal: Math.max(16, width * 0.04),
    },
    transactionCard: {
      backgroundColor: 'white',
      marginVertical: Math.max(4, height * 0.005),
      borderRadius: 12,
      padding: Math.max(16, width * 0.04),
    },
    transactionContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconContainer: {
      width: isTablet ? 50 : 40,
      height: isTablet ? 50 : 40,
      borderRadius: isTablet ? 25 : 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    textContainer: {
      flex: 1,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    transactionTitle: {
      fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
      fontWeight: '600',
      color: '#333',
      flex: 1,
      marginRight: 8,
    },
    amount: {
      fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
      fontWeight: 'bold',
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    date: {
      fontSize: isTablet ? 14 : isSmallScreen ? 10 : 12,
      color: '#666',
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      fontSize: isTablet ? 12 : isSmallScreen ? 8 : 10,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: Math.max(100, height * 0.2),
    },
    emptyTitle: {
      fontSize: isTablet ? 24 : isSmallScreen ? 18 : 20,
      fontWeight: '600',
      color: '#666',
      marginTop: 16,
      marginBottom: 8,
    },
    emptyMessage: {
      fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
      color: '#999',
      textAlign: 'center',
      paddingHorizontal: 32,
      lineHeight: 20,
    },
  });
};
