

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from '@expo/vector-icons';
import { merchantService } from '../../services/merchantService';
import { useMerchant } from '../../contexts/MerchantContext';

export default function MerchantAnalytics() {
  const router = useRouter();
  const { merchantId, loadMerchantId } = useMerchant();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMerchantId();
  }, [loadMerchantId]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!merchantId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await merchantService.getAnalytics
          ? await merchantService.getAnalytics(merchantId)
          : { success: false };
        if (response.success && response.data) {
          setAnalyticsData(response.data);
        } else {
          setAnalyticsData(null);
        }
      } catch (error) {
        setAnalyticsData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    return () => subscription?.remove();
  }, [merchantId]);

  const styles = getResponsiveStyles(screenData);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B1A51' }}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 16 }}>Loading analytics...</Text>
      </View>
    );
  }

  if (!analyticsData) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B1A51' }}>
        <Ionicons name="alert-circle-outline" size={48} color="#fff" />
        <Text style={{ color: '#fff', marginTop: 16 }}>No analytics data available.</Text>
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Business Performance</Text>

        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>₦{(analyticsData.totalSales / 1000).toFixed(0)}K</Text>
            <Text style={styles.metricLabel}>Total Sales</Text>
            <View style={styles.growthIndicator}>
              <Ionicons name="trending-up" size={16} color="#28a745" />
              <Text style={styles.growthText}>+{analyticsData.monthlyGrowth}%</Text>
            </View>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{analyticsData.totalOrders}</Text>
            <Text style={styles.metricLabel}>Total Orders</Text>
            <View style={styles.growthIndicator}>
              <Ionicons name="trending-up" size={16} color="#28a745" />
              <Text style={styles.growthText}>+12.3%</Text>
            </View>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>₦{analyticsData.averageOrderValue}</Text>
            <Text style={styles.metricLabel}>Avg Order Value</Text>
            <View style={styles.growthIndicator}>
              <Ionicons name="trending-up" size={16} color="#28a745" />
              <Text style={styles.growthText}>+8.7%</Text>
            </View>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{analyticsData.customerRetention}%</Text>
            <Text style={styles.metricLabel}>Customer Retention</Text>
            <View style={styles.growthIndicator}>
              <Ionicons name="trending-up" size={16} color="#28a745" />
              <Text style={styles.growthText}>+5.2%</Text>
            </View>
          </View>
        </View>

        {/* Top Selling Products */}
        <Text style={styles.sectionTitle}>Top Selling Products</Text>
        <View style={styles.productsContainer}>
          {analyticsData.topSellingProducts.map((product, index) => (
            <View key={index} style={styles.productRow}>
              <View style={styles.productRank}>
                <Text style={styles.rankNumber}>{index + 1}</Text>
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productSales}>{product.sales} units sold</Text>
              </View>
              <View style={styles.productRevenue}>
                <Text style={styles.revenueAmount}>₦{(product.revenue / 1000).toFixed(1)}K</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Sales Chart */}
        <Text style={styles.sectionTitle}>Sales Trend (Last 7 Days)</Text>
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Daily Sales</Text>
            <Text style={styles.chartSubtitle}>Total: ₦{analyticsData.dailySales.reduce((sum, day) => sum + day.sales, 0).toLocaleString()}</Text>
          </View>
          <View style={styles.chart}>
            {analyticsData.dailySales.map((day, index) => (
              <View key={index} style={styles.chartBar}>
                <View 
                  style={[
                    styles.chartBarFill, 
                    { height: `${(day.sales / 25000) * 100}%` }
                  ]} 
                />
                <Text style={styles.chartBarLabel}>{new Date(day.date).getDate()}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Category Breakdown */}
        <Text style={styles.sectionTitle}>Revenue by Category</Text>
        <View style={styles.categoryContainer}>
          {analyticsData.categoryBreakdown.map((category, index) => (
            <View key={index} style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryName}>{category.category.charAt(0).toUpperCase() + category.category.slice(1)}</Text>
                <Text style={styles.categoryPercentage}>{category.percentage}%</Text>
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
          ))}
        </View>

        {/* Customer Metrics */}
        <Text style={styles.sectionTitle}>Customer Insights</Text>
        <View style={styles.customerMetricsContainer}>
          <View style={styles.customerMetricCard}>
            <Text style={styles.metricValue}>{analyticsData.customerMetrics.newCustomers}</Text>
            <Text style={styles.metricLabel}>New Customers</Text>
            <View style={styles.metricTrend}>
              <Ionicons name="trending-up" size={14} color="#28a745" />
              <Text style={styles.trendText}>+15%</Text>
            </View>
          </View>
          <View style={styles.customerMetricCard}>
            <Text style={styles.metricValue}>{analyticsData.customerMetrics.returningCustomers}</Text>
            <Text style={styles.metricLabel}>Returning</Text>
            <View style={styles.metricTrend}>
              <Ionicons name="trending-up" size={14} color="#28a745" />
              <Text style={styles.trendText}>+8%</Text>
            </View>
          </View>
          <View style={styles.customerMetricCard}>
            <Text style={styles.metricValue}>{analyticsData.customerMetrics.averageOrdersPerCustomer}</Text>
            <Text style={styles.metricLabel}>Avg Orders</Text>
            <View style={styles.metricTrend}>
              <Ionicons name="trending-up" size={14} color="#28a745" />
              <Text style={styles.trendText}>+12%</Text>
            </View>
          </View>
          <View style={styles.customerMetricCard}>
            <Text style={styles.metricValue}>{analyticsData.customerMetrics.customerSatisfaction}</Text>
            <Text style={styles.metricLabel}>Satisfaction</Text>
            <View style={styles.metricTrend}>
              <Ionicons name="star" size={14} color="#ffc107" />
              <Text style={styles.trendText}>4.7/5</Text>
            </View>
          </View>
        </View>

        {/* Inventory Status */}
        <Text style={styles.sectionTitle}>Inventory Overview</Text>
        <View style={styles.inventoryContainer}>
          <View style={styles.inventoryCard}>
            <Ionicons name="cube" size={24} color="#4682B4" />
            <Text style={styles.inventoryValue}>{analyticsData.inventoryMetrics.totalItems}</Text>
            <Text style={styles.inventoryLabel}>Total Items</Text>
          </View>
          <View style={styles.inventoryCard}>
            <Ionicons name="warning" size={24} color="#ffc107" />
            <Text style={styles.inventoryValue}>{analyticsData.inventoryMetrics.lowStockItems}</Text>
            <Text style={styles.inventoryLabel}>Low Stock</Text>
          </View>
          <View style={styles.inventoryCard}>
            <Ionicons name="alert-circle" size={24} color="#dc3545" />
            <Text style={styles.inventoryValue}>{analyticsData.inventoryMetrics.outOfStockItems}</Text>
            <Text style={styles.inventoryLabel}>Out of Stock</Text>
          </View>
          <View style={styles.inventoryCard}>
            <Ionicons name="repeat" size={24} color="#28a745" />
            <Text style={styles.inventoryValue}>{analyticsData.inventoryMetrics.turnoverRate}</Text>
            <Text style={styles.inventoryLabel}>Turnover Rate</Text>
          </View>
        </View>

        {/* Payment Methods */}
        <Text style={styles.sectionTitle}>Payment Methods</Text>
        <View style={styles.paymentContainer}>
          {analyticsData.paymentMethods.map((payment, index) => (
            <View key={index} style={styles.paymentMethod}>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentMethodName}>{payment.method}</Text>
                <Text style={styles.paymentAmount}>₦{(payment.amount / 1000).toFixed(0)}K</Text>
              </View>
              <View style={styles.paymentBar}>
                <View 
                  style={[
                    styles.paymentBarFill, 
                    { width: `${payment.percentage}%` }
                  ]} 
                />
              </View>
              <Text style={styles.paymentPercentage}>{payment.percentage}%</Text>
            </View>
          ))}
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
    placeholder: {
      width: 40,
    },
    content: {
      flex: 1,
      backgroundColor: "white",
      borderTopLeftRadius: 35,
      borderTopRightRadius: 35,
      paddingHorizontal: Math.max(16, width * 0.05),
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
    growthIndicator: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    growthText: {
      fontSize: isTablet ? 14 : isSmallScreen ? 11 : 12,
      color: "#28a745",
      fontWeight: "600",
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
    customerMetricsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Math.max(12, width * 0.03),
      marginBottom: Math.max(24, height * 0.04),
    },
    customerMetricCard: {
      width: isTablet ? "48%" : "47%",
      backgroundColor: "white",
      padding: Math.max(16, width * 0.04),
      borderRadius: 15,
      borderWidth: 1,
      borderColor: "#e9ecef",
      alignItems: "center",
    },
    metricTrend: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 4,
    },
    trendText: {
      fontSize: isTablet ? 12 : 10,
      color: "#28a745",
      marginLeft: 4,
      fontWeight: "600",
    },
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
  });
};
