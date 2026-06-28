
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AnalyticsData {
  overview: {
    totalRevenue: number;
    totalOrders: number;
    totalUsers: number;
    activeUsers: number;
    revenueGrowth: number;
    orderGrowth: number;
    userGrowth: number;
  };
  userMetrics: {
    consumers: number;
    merchants: number;
    drivers: number;
    newUsersThisMonth: number;
    activeUsersToday: number;
    retentionRate: number;
  };
  transactionMetrics: {
    completedOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
    averageOrderValue: number;
    totalEscrow: number;
    totalCommission: number;
  };
  revenueByCategory: {
    category: string;
    revenue: number;
    percentage: number;
  }[];
  topMerchants: {
    id: string;
    name: string;
    revenue: number;
    orders: number;
  }[];
  topDrivers: {
    id: string;
    name: string;
    deliveries: number;
    earnings: number;
    rating: number;
  }[];
  dailyRevenue: {
    date: string;
    revenue: number;
    orders: number;
  }[];
}

export default function AdminAnalytics() {
  const router = useRouter();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    loadAnalytics();
    return () => subscription?.remove();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      const token = await AsyncStorage.getItem('adminToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://api.brillprime.com'}/api/admin/analytics?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        // Mock data fallback
        const mockAnalytics: AnalyticsData = {
          overview: {
            totalRevenue: 15780000,
            totalOrders: 1234,
            totalUsers: 5678,
            activeUsers: 2345,
            revenueGrowth: 15.4,
            orderGrowth: 12.3,
            userGrowth: 8.7,
          },
          userMetrics: {
            consumers: 4200,
            merchants: 1200,
            drivers: 278,
            newUsersThisMonth: 456,
            activeUsersToday: 1234,
            retentionRate: 78,
          },
          transactionMetrics: {
            completedOrders: 1050,
            pendingOrders: 134,
            cancelledOrders: 50,
            averageOrderValue: 12789,
            totalEscrow: 2340000,
            totalCommission: 789000,
          },
          revenueByCategory: [
            { category: 'Fuel', revenue: 9468000, percentage: 60 },
            { category: 'Commodities', revenue: 4734000, percentage: 30 },
            { category: 'Toll', revenue: 1578000, percentage: 10 },
          ],
          topMerchants: [
            { id: '1', name: 'Prime Fuel Station', revenue: 2340000, orders: 456 },
            { id: '2', name: 'Fresh Market', revenue: 1890000, orders: 389 },
            { id: '3', name: 'Tech Hub', revenue: 1560000, orders: 234 },
          ],
          topDrivers: [
            { id: '1', name: 'Michael Johnson', deliveries: 245, earnings: 125000, rating: 4.8 },
            { id: '2', name: 'Sarah Williams', deliveries: 312, earnings: 185000, rating: 4.9 },
            { id: '3', name: 'David Brown', deliveries: 189, earnings: 98000, rating: 4.6 },
          ],
          dailyRevenue: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString(),
            revenue: Math.floor(Math.random() * 1000000) + 500000,
            orders: Math.floor(Math.random() * 100) + 50,
          })),
        };
        setAnalytics(mockAnalytics);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      notation: amount >= 1000000 ? 'compact' : 'standard',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const styles = getResponsiveStyles(screenData);

  if (!analytics) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: 'white' }}>Loading analytics...</Text>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Analytics & Reports</Text>
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
        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          {['today', 'week', 'month', 'year'].map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                timeRange === range && styles.activeTimeRange,
              ]}
              onPress={() => setTimeRange(range as any)}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  timeRange === range && styles.activeTimeRangeText,
                ]}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overview Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatCurrency(analytics.overview.totalRevenue)}</Text>
              <Text style={styles.statLabel}>Total Revenue</Text>
              <View style={styles.growthIndicator}>
                <Ionicons name="trending-up" size={16} color="#10b981" />
                <Text style={styles.growthText}>+{analytics.overview.revenueGrowth}%</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>{analytics.overview.totalOrders}</Text>
              <Text style={styles.statLabel}>Total Orders</Text>
              <View style={styles.growthIndicator}>
                <Ionicons name="trending-up" size={16} color="#10b981" />
                <Text style={styles.growthText}>+{analytics.overview.orderGrowth}%</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>{analytics.overview.totalUsers}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
              <View style={styles.growthIndicator}>
                <Ionicons name="trending-up" size={16} color="#10b981" />
                <Text style={styles.growthText}>+{analytics.overview.userGrowth}%</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>{analytics.overview.activeUsers}</Text>
              <Text style={styles.statLabel}>Active Users</Text>
              <Text style={styles.statSubtext}>{analytics.userMetrics.retentionRate}% retention</Text>
            </View>
          </View>
        </View>

        {/* Revenue Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue Trend</Text>
          <View style={styles.chartContainer}>
            {analytics.dailyRevenue.map((day, index) => (
              <View key={index} style={styles.chartBar}>
                <View
                  style={[
                    styles.chartBarFill,
                    { height: `${(day.revenue / 1500000) * 100}%` },
                  ]}
                />
                <Text style={styles.chartBarLabel}>{formatDate(day.date)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* User Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Distribution</Text>
          <View style={styles.userMetricsGrid}>
            <View style={styles.userMetricCard}>
              <Ionicons name="people" size={32} color="#8b5cf6" />
              <Text style={styles.userMetricValue}>{analytics.userMetrics.consumers}</Text>
              <Text style={styles.userMetricLabel}>Consumers</Text>
            </View>
            <View style={styles.userMetricCard}>
              <Ionicons name="storefront" size={32} color="#ec4899" />
              <Text style={styles.userMetricValue}>{analytics.userMetrics.merchants}</Text>
              <Text style={styles.userMetricLabel}>Merchants</Text>
            </View>
            <View style={styles.userMetricCard}>
              <Ionicons name="car" size={32} color="#06b6d4" />
              <Text style={styles.userMetricValue}>{analytics.userMetrics.drivers}</Text>
              <Text style={styles.userMetricLabel}>Drivers</Text>
            </View>
          </View>
        </View>

        {/* Transaction Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction Breakdown</Text>
          <View style={styles.transactionGrid}>
            <View style={styles.transactionCard}>
              <Text style={styles.transactionValue}>{analytics.transactionMetrics.completedOrders}</Text>
              <Text style={styles.transactionLabel}>Completed</Text>
            </View>
            <View style={styles.transactionCard}>
              <Text style={styles.transactionValue}>{analytics.transactionMetrics.pendingOrders}</Text>
              <Text style={styles.transactionLabel}>Pending</Text>
            </View>
            <View style={styles.transactionCard}>
              <Text style={styles.transactionValue}>{analytics.transactionMetrics.cancelledOrders}</Text>
              <Text style={styles.transactionLabel}>Cancelled</Text>
            </View>
            <View style={styles.transactionCard}>
              <Text style={styles.transactionValue}>{formatCurrency(analytics.transactionMetrics.averageOrderValue)}</Text>
              <Text style={styles.transactionLabel}>Avg Order</Text>
            </View>
          </View>
        </View>

        {/* Revenue by Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue by Category</Text>
          {analytics.revenueByCategory.map((category, index) => (
            <View key={index} style={styles.categoryRow}>
              <Text style={styles.categoryName}>{category.category}</Text>
              <View style={styles.categoryBar}>
                <View
                  style={[styles.categoryBarFill, { width: `${category.percentage}%` }]}
                />
              </View>
              <Text style={styles.categoryValue}>{formatCurrency(category.revenue)}</Text>
            </View>
          ))}
        </View>

        {/* Top Performers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Merchants</Text>
          {analytics.topMerchants.map((merchant, index) => (
            <View key={merchant.id} style={styles.topPerformerCard}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              <View style={styles.performerInfo}>
                <Text style={styles.performerName}>{merchant.name}</Text>
                <Text style={styles.performerStats}>
                  {merchant.orders} orders • {formatCurrency(merchant.revenue)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Drivers</Text>
          {analytics.topDrivers.map((driver, index) => (
            <View key={driver.id} style={styles.topPerformerCard}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              <View style={styles.performerInfo}>
                <Text style={styles.performerName}>{driver.name}</Text>
                <Text style={styles.performerStats}>
                  {driver.deliveries} deliveries • {formatCurrency(driver.earnings)}
                </Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={14} color="#ffc107" />
                  <Text style={styles.ratingText}>{driver.rating}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Financial Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Summary</Text>
          <View style={styles.financialCard}>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Total Escrow Balance</Text>
              <Text style={styles.financialValue}>{formatCurrency(analytics.transactionMetrics.totalEscrow)}</Text>
            </View>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Total Commission</Text>
              <Text style={styles.financialValue}>{formatCurrency(analytics.transactionMetrics.totalCommission)}</Text>
            </View>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Platform Revenue</Text>
              <Text style={[styles.financialValue, { color: '#10b981', fontWeight: 'bold' }]}>
                {formatCurrency(analytics.overview.totalRevenue)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    timeRangeContainer: {
      flexDirection: 'row',
      paddingHorizontal: Math.max(16, width * 0.05),
      marginBottom: 20,
      gap: 8,
    },
    timeRangeButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: '#f3f4f6',
      alignItems: 'center',
    },
    activeTimeRange: {
      backgroundColor: 'rgb(11, 26, 81)',
    },
    timeRangeText: {
      fontSize: 12,
      color: '#6b7280',
      fontWeight: '500',
    },
    activeTimeRangeText: {
      color: 'white',
    },
    section: {
      paddingHorizontal: Math.max(16, width * 0.05),
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: 16,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    statCard: {
      width: isTablet ? '47%' : '100%',
      backgroundColor: 'white',
      padding: 16,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    statValue: {
      fontSize: isTablet ? 24 : 20,
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: '#6b7280',
      marginBottom: 8,
    },
    statSubtext: {
      fontSize: 11,
      color: '#9ca3af',
    },
    growthIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    growthText: {
      fontSize: 12,
      color: '#10b981',
      fontWeight: '600',
    },
    chartContainer: {
      flexDirection: 'row',
      height: 200,
      backgroundColor: '#f8f9fa',
      borderRadius: 12,
      padding: 16,
      gap: 8,
      alignItems: 'flex-end',
    },
    chartBar: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    chartBarFill: {
      width: '100%',
      backgroundColor: 'rgb(11, 26, 81)',
      borderRadius: 4,
      minHeight: 20,
    },
    chartBarLabel: {
      fontSize: 10,
      color: '#6b7280',
      marginTop: 4,
    },
    userMetricsGrid: {
      flexDirection: 'row',
      gap: 12,
    },
    userMetricCard: {
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
    userMetricValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#111827',
      marginTop: 8,
    },
    userMetricLabel: {
      fontSize: 12,
      color: '#6b7280',
      marginTop: 4,
    },
    transactionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    transactionCard: {
      width: isTablet ? '22%' : '47%',
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
    transactionValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: 4,
    },
    transactionLabel: {
      fontSize: 12,
      color: '#6b7280',
    },
    categoryRow: {
      marginBottom: 16,
    },
    categoryName: {
      fontSize: 14,
      fontWeight: '600',
      color: '#111827',
      marginBottom: 4,
    },
    categoryBar: {
      height: 8,
      backgroundColor: '#f3f4f6',
      borderRadius: 4,
      marginBottom: 4,
    },
    categoryBarFill: {
      height: '100%',
      backgroundColor: 'rgb(11, 26, 81)',
      borderRadius: 4,
    },
    categoryValue: {
      fontSize: 12,
      color: '#6b7280',
    },
    topPerformerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'white',
      padding: 12,
      borderRadius: 12,
      marginBottom: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    rankBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgb(11, 26, 81)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    rankText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 14,
    },
    performerInfo: {
      flex: 1,
    },
    performerName: {
      fontSize: 14,
      fontWeight: '600',
      color: '#111827',
      marginBottom: 2,
    },
    performerStats: {
      fontSize: 12,
      color: '#6b7280',
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    ratingText: {
      fontSize: 12,
      color: '#ffc107',
      marginLeft: 4,
      fontWeight: '600',
    },
    financialCard: {
      backgroundColor: 'white',
      padding: 16,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    financialRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#f3f4f6',
    },
    financialLabel: {
      fontSize: 14,
      color: '#6b7280',
    },
    financialValue: {
      fontSize: 14,
      fontWeight: '600',
      color: '#111827',
    },
  });
};
