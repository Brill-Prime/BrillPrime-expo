import { withRoleAccess } from '../../components/withRoleAccess';
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from '@expo/vector-icons';
import { merchantService } from '../../services/merchantService';
import { paymentService } from '../../services/paymentService';
import { useMerchant } from '../../contexts/MerchantContext';
import { useAuth } from '../../contexts/AuthContext';
import { MerchantAnalyticsService } from '../../services/merchantAnalyticsService';
import type { SalesMetrics, CategoryBreakdown, TopProduct, CustomerInsight, TimeSeriesData } from '../../services/merchantAnalyticsService';

function MerchantAnalytics() {
  const router = useRouter();
  const { loadMerchantId } = useMerchant();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<SalesMetrics | null>(null);
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [customerInsights, setCustomerInsights] = useState<CustomerInsight | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData[]>([]);

  const merchantId = user?.uid || '';

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();

    switch (selectedPeriod) {
      case '7days':
        start.setDate(start.getDate() - 7);
        break;
      case '30days':
        start.setDate(start.getDate() - 30);
        break;
      case '90days':
        start.setDate(start.getDate() - 90);
        break;
      default:
        start.setDate(start.getDate() - 30);
    }

    return { start, end };
  };

  const loadAnalytics = async () => {
    if (!merchantId) {
      setError('Merchant ID not found');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const { start, end } = getDateRange();

      const [metricsData, categoriesData, productsData, insightsData, timeSeriesData] = await Promise.all([
        MerchantAnalyticsService.getSalesMetrics(merchantId, start, end),
        MerchantAnalyticsService.getCategoryBreakdown(merchantId, start, end),
        MerchantAnalyticsService.getTopProducts(merchantId, start, end, 5),
        MerchantAnalyticsService.getCustomerInsights(merchantId, start, end),
        MerchantAnalyticsService.getTimeSeriesData(merchantId, start, end, 'day')
      ]);

      setMetrics(metricsData);
      setCategories(categoriesData);
      setTopProducts(productsData);
      setCustomerInsights(insightsData);
      setTimeSeries(timeSeriesData);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
  };

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod, merchantId]);

  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [selectedPeriod, setSelectedPeriod] = useState('30days');

  useEffect(() => {
    loadMerchantId();
  }, []);

  // Removed the duplicate useEffect for fetching analytics

  const styles = getResponsiveStyles(screenData);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B1A51' }}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 16 }}>Loading analytics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B1A51' }}>
        <Ionicons name="alert-circle-outline" size={48} color="#fff" />
        <Text style={{ color: '#fff', marginTop: 16 }}>{error}</Text>
        <TouchableOpacity onPress={loadAnalytics} style={{ marginTop: 16, padding: 10, backgroundColor: '#fff', borderRadius: 5 }}>
          <Text style={{ color: '#0B1A51' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Analytics</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />
        }
      >
        <Text style={styles.sectionTitle}>Business Performance</Text>

        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              ₦{metrics?.totalRevenue.toLocaleString() || '0'}
            </Text>
            <Text style={styles.metricLabel}>Total Revenue</Text>
            <Text style={[
              styles.metricChange,
              { color: (metrics?.periodComparison.revenue || 0) >= 0 ? '#4CAF50' : '#f44336' }
            ]}>
              {(metrics?.periodComparison.revenue || 0) >= 0 ? '+' : ''}
              {metrics?.periodComparison.revenue.toFixed(1)}%
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{metrics?.totalOrders.toLocaleString() || '0'}</Text>
            <Text style={styles.metricLabel}>Total Orders</Text>
            <Text style={[
              styles.metricChange,
              { color: (metrics?.periodComparison.orders || 0) >= 0 ? '#4CAF50' : '#f44336' }
            ]}>
              {(metrics?.periodComparison.orders || 0) >= 0 ? '+' : ''}
              {metrics?.periodComparison.orders.toFixed(1)}%
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              ₦{metrics?.averageOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'}
            </Text>
            <Text style={styles.metricLabel}>Avg Order Value</Text>
            <Text style={styles.metricChange}>Per Order</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              {metrics?.completionRate.toFixed(1)}%
            </Text>
            <Text style={styles.metricLabel}>Completion Rate</Text>
            <Text style={styles.metricChange}>Success Rate</Text>
          </View>
        </View>

        {/* Customer Insights */}
        {customerInsights && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Insights</Text>
            <View style={styles.insightsGrid}>
              <View style={styles.insightCard}>
                <Ionicons name="people" size={24} color="#4CAF50" />
                <Text style={styles.insightValue}>{customerInsights.totalCustomers}</Text>
                <Text style={styles.insightLabel}>Total Customers</Text>
              </View>
              <View style={styles.insightCard}>
                <Ionicons name="repeat" size={24} color="#2196F3" />
                <Text style={styles.insightValue}>{customerInsights.repeatCustomers}</Text>
                <Text style={styles.insightLabel}>Repeat Customers</Text>
              </View>
              <View style={styles.insightCard}>
                <Ionicons name="trending-up" size={24} color="#FF9800" />
                <Text style={styles.insightValue}>{customerInsights.repeatRate.toFixed(1)}%</Text>
                <Text style={styles.insightLabel}>Repeat Rate</Text>
              </View>
              <View style={styles.insightCard}>
                <Ionicons name="cash" size={24} color="#9C27B0" />
                <Text style={styles.insightValue}>
                  ₦{customerInsights.averageLifetimeValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </Text>
                <Text style={styles.insightLabel}>Avg LTV</Text>
              </View>
            </View>
          </View>
        )}

        {/* Revenue by Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue by Category</Text>
          {categories.length === 0 ? (
            <Text style={styles.emptyText}>No category data available</Text>
          ) : (
            categories.map((category, index) => (
              <View key={index} style={styles.categoryCard}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryName}>{category.categoryName}</Text>
                  <Text style={styles.categoryPercentage}>{category.percentage.toFixed(1)}%</Text>
                </View>
                <View style={styles.categoryBar}>
                  <View
                    style={[
                      styles.categoryBarFill,
                      { width: `${category.percentage}%` }
                    ]}
                  />
                </View>
                <Text style={styles.categoryRevenue}>₦{(category.revenue / 1000).toFixed(0)}K</Text>
              </View>
            ))
          )}
        </View>

        {/* Top Selling Products */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Selling Products</Text>
          {topProducts.length === 0 ? (
            <Text style={styles.emptyText}>No product data available</Text>
          ) : (
            topProducts.map((product, index) => (
              <View key={index} style={styles.productRow}>
                <View style={styles.productRank}>
                  <Text style={styles.rankNumber}>{index + 1}</Text>
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.productName}</Text>
                  <Text style={styles.productSales}>{product.unitsSold} units sold</Text>
                </View>
                <View style={styles.productRevenue}>
                  <Text style={styles.revenueAmount}>₦{(product.totalRevenue / 1000).toFixed(1)}K</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Sales Chart */}
        <Text style={styles.sectionTitle}>Sales Trend (Last 7 Days)</Text>
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Daily Sales</Text>
            <Text style={styles.chartSubtitle}>Total: ₦{timeSeries.reduce((sum, day) => sum + day.sales, 0).toLocaleString()}</Text>
          </View>
          <View style={styles.chart}>
            {timeSeries.map((day, index) => (
              <View key={index} style={styles.chartBar}>
                <View
                  style={[
                    styles.chartBarFill,
                    { height: `${(day.sales / (metrics?.maxSalesThisPeriod || 25000)) * 100}%` }
                  ]}
                />
                <Text style={styles.chartBarLabel}>{new Date(day.date).getDate()}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/transactions')}
          >
            <Ionicons name="receipt-outline" size={24} color="#4682B4" />
            <Text style={styles.actionText}>View Transactions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/merchant/commodities')}
          >
            <Ionicons name="grid-outline" size={24} color="#4682B4" />
            <Text style={styles.actionText}>Manage Products</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/merchant/order-management')}
          >
            <Ionicons name="cube-outline" size={24} color="#4682B4" />
            <Text style={styles.actionText}>Manage Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/merchant/inventory')}
          >
            <Ionicons name="library-outline" size={24} color="#4682B4" />
            <Text style={styles.actionText}>Inventory</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/chat')}
          >
            <Ionicons name="chatbubbles-outline" size={24} color="#4682B4" />
            <Text style={styles.actionText}>Customer Chat</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const getResponsiveStyles = (screenData: any) => {
  const { width, height } = screenData;
  const isTablet = width >= 768;
  const isSmallScreen = width < 350;
  const responsivePadding = Math.max(16, width * 0.05);

  return StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: responsivePadding,
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
    placeholder: {
      width: 40,
    },
    content: {
      flex: 1,
      backgroundColor: "white",
      borderTopLeftRadius: 35,
      borderTopRightRadius: 35,
      paddingHorizontal: responsivePadding,
      paddingTop: Math.max(24, height * 0.03),
    },
    sectionTitle: {
      fontSize: isTablet ? 22 : isSmallScreen ? 16 : 18,
      fontWeight: "bold",
      color: "#2c3e50",
      marginBottom: Math.max(16, height * 0.025),
    },
    metricsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Math.max(12, width * 0.03),
      marginBottom: Math.max(24, height * 0.04),
    },
    metricCard: {
      width: isTablet ? "48%" : "47%",
      backgroundColor: "white",
      padding: Math.max(16, width * 0.04),
      borderRadius: 15,
      borderWidth: 1,
      borderColor: "#e9ecef",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    metricValue: {
      fontSize: isTablet ? 28 : isSmallScreen ? 20 : 24,
      fontWeight: "bold",
      color: "#2c3e50",
      marginBottom: 4,
    },
    metricLabel: {
      fontSize: isTablet ? 14 : isSmallScreen ? 11 : 12,
      color: "#7f8c8d",
      marginBottom: 8,
    },
    metricChange: {
      fontSize: 12,
      marginTop: 4,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: '#666',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      marginTop: 12,
      fontSize: 16,
      color: '#666',
      textAlign: 'center',
    },
    retryButton: {
      marginTop: 20,
      backgroundColor: '#4CAF50',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    retryButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    emptyText: {
      fontSize: 14,
      color: '#999',
      textAlign: 'center',
      padding: 20,
    },
    insightsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -6,
    },
    insightCard: {
      width: '48%',
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 16,
      margin: '1%',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    insightValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#000',
      marginTop: 8,
    },
    insightLabel: {
      fontSize: 12,
      color: '#666',
      marginTop: 4,
      textAlign: 'center',
    },
    productsContainer: {
      backgroundColor: "white",
      borderRadius: 15,
      padding: Math.max(16, width * 0.04),
      marginBottom: Math.max(24, height * 0.04),
      borderWidth: 1,
      borderColor: "#e9ecef",
    },
    productRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: Math.max(12, height * 0.015),
      borderBottomWidth: 1,
      borderBottomColor: "#f8f9fa",
    },
    productRank: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: "#4682B4",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    rankNumber: {
      color: "white",
      fontWeight: "bold",
      fontSize: isTablet ? 16 : 14,
    },
    productInfo: {
      flex: 1,
    },
    productName: {
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      fontWeight: "600",
      color: "#2c3e50",
      marginBottom: 2,
    },
    productSales: {
      fontSize: isTablet ? 14 : isSmallScreen ? 11 : 12,
      color: "#7f8c8d",
    },
    productRevenue: {
      alignItems: "flex-end",
    },
    revenueAmount: {
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      fontWeight: "bold",
      color: "#28a745",
    },
    actionsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Math.max(12, width * 0.03),
      marginBottom: Math.max(24, height * 0.04),
    },
    actionButton: {
      flex: 1,
      minWidth: "30%",
      backgroundColor: "white",
      padding: Math.max(16, width * 0.04),
      borderRadius: 15,
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#4682B4",
      gap: 8,
    },
    actionText: {
      fontSize: isTablet ? 14 : isSmallScreen ? 11 : 12,
      color: "#4682B4",
      fontWeight: "600",
      textAlign: "center",
    },
    chartContainer: {
      backgroundColor: "white",
      borderRadius: 15,
      padding: Math.max(16, width * 0.04),
      marginBottom: Math.max(24, height * 0.04),
      borderWidth: 1,
      borderColor: "#e9ecef",
    },
    chartHeader: {
      marginBottom: 16,
    },
    chartTitle: {
      fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
      fontWeight: "bold",
      color: "#2c3e50",
    },
    chartSubtitle: {
      fontSize: isTablet ? 14 : isSmallScreen ? 11 : 12,
      color: "#7f8c8d",
    },
    chart: {
      flexDirection: "row",
      alignItems: "flex-end",
      height: 120,
      justifyContent: "space-around",
    },
    chartBar: {
      flex: 1,
      alignItems: "center",
    },
    chartBarFill: {
      backgroundColor: "#4682B4",
      width: "60%",
      minHeight: 10,
      borderRadius: 2,
      marginBottom: 8,
    },
    chartBarLabel: {
      fontSize: isTablet ? 12 : 10,
      color: "#666",
    },
    categoryContainer: {
      backgroundColor: "white",
      borderRadius: 15,
      padding: Math.max(16, width * 0.04),
      marginBottom: Math.max(24, height * 0.04),
      borderWidth: 1,
      borderColor: "#e9ecef",
    },
    categoryCard: {
      marginBottom: 16,
    },
    categoryHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    categoryName: {
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      fontWeight: "600",
      color: "#2c3e50",
    },
    categoryPercentage: {
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      fontWeight: "bold",
      color: "#4682B4",
    },
    categoryBar: {
      height: 8,
      backgroundColor: "#f0f0f0",
      borderRadius: 4,
      marginBottom: 4,
    },
    categoryBarFill: {
      height: "100%",
      backgroundColor: "#4682B4",
      borderRadius: 4,
    },
    categoryRevenue: {
      fontSize: isTablet ? 14 : isSmallScreen ? 11 : 12,
      color: "#666",
    },
    // Inventory Status styles were present in original, kept for consistency
    inventoryContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Math.max(12, width * 0.03),
      marginBottom: Math.max(24, height * 0.04),
    },
    inventoryCard: {
      width: isTablet ? "23%" : "47%",
      backgroundColor: "white",
      padding: Math.max(12, width * 0.03),
      borderRadius: 15,
      borderWidth: 1,
      borderColor: "#e9ecef",
      alignItems: "center",
    },
    inventoryValue: {
      fontSize: isTablet ? 24 : isSmallScreen ? 18 : 20,
      fontWeight: "bold",
      color: "#2c3e50",
      marginVertical: 4,
    },
    inventoryLabel: {
      fontSize: isTablet ? 12 : 10,
      color: "#7f8c8d",
      textAlign: "center",
    },
    // Payment Methods styles were present in original, kept for consistency
    paymentContainer: {
      backgroundColor: "white",
      borderRadius: 15,
      padding: Math.max(16, width * 0.04),
      marginBottom: Math.max(24, height * 0.04),
      borderWidth: 1,
      borderColor: "#e9ecef",
    },
    paymentMethod: {
      marginBottom: 16,
    },
    paymentInfo: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    paymentMethodName: {
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      fontWeight: "600",
      color: "#2c3e50",
    },
    paymentAmount: {
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      fontWeight: "bold",
      color: "#4682B4",
    },
    paymentBar: {
      height: 6,
      backgroundColor: "#f0f0f0",
      borderRadius: 3,
      marginBottom: 4,
    },
    paymentBarFill: {
      height: "100%",
      backgroundColor: "#4682B4",
      borderRadius: 3,
    },
    paymentPercentage: {
      fontSize: isTablet ? 12 : 10,
      color: "#666",
      textAlign: "right",
    },
    // Chart placeholder styles were present in original, kept for consistency
    chartPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
      height: 150, // Increased height for better visibility
      backgroundColor: '#f8f9fa', // Light background for placeholder
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#e0e0e0',
      marginVertical: 10,
    },
    mockChart: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-around',
      width: '100%',
      height: 120,
      paddingHorizontal: 10,
    },
    bar: {
      width: 30,
      borderRadius: 4,
    },
  });
};
export default withRoleAccess(MerchantAnalytics, {
  requiredRole: 'merchant',
  fallbackRoute: '/home/consumer',
  showUnauthorizedMessage: true,
});