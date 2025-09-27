
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from '@expo/vector-icons';

export default function MerchantAnalytics() {
  const router = useRouter();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [analyticsData, setAnalyticsData] = useState({
    totalSales: 125000,
    totalOrders: 243,
    averageOrderValue: 514,
    topSellingProducts: [
      { name: "Rice", sales: 45, revenue: 18000 },
      { name: "Cooking Oil", sales: 32, revenue: 12800 },
      { name: "Beans", sales: 28, revenue: 8400 },
    ],
    monthlyGrowth: 15.6,
    customerRetention: 78.3,
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, []);

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
            onPress={() => router.push('/orders/consumer-orders')}
          >
            <Ionicons name="cube-outline" size={24} color="#4682B4" />
            <Text style={styles.actionText}>View Orders</Text>
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
  });
};
