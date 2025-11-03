import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions, ActivityIndicator, Image } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from '../../utils/supabase'; // Assuming supabase client is configured here

// Helper function to format currency
const formatNaira = (amount: number): string => {
  return `₦${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
};

export default function MerchantDashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [isLoading, setIsLoading] = useState(true);
  const [merchantStats, setMerchantStats] = useState({
    totalProducts: 0,
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    lowStockItems: 0,
    reviewCount: 0,
    rating: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    loadUserData();
    fetchDashboardData();
  }, []);

  const loadUserData = async () => {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      setUserEmail(email || "merchant@brillprime.com");
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const userSession = await supabase.auth.getSession();
      const merchantId = userSession.data.session?.user.id;

      if (!merchantId) {
        throw new Error("Merchant ID not found");
      }

      // Fetch Total Products
      const { count: totalProducts } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('merchantId', merchantId);

      // Fetch Total Revenue and Orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, totalAmount, status')
        .eq('merchantId', merchantId);

      if (ordersError) throw ordersError;

      const totalRevenue = ordersData.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      const totalOrders = ordersData.length;
      const pendingOrders = ordersData.filter(order => order.status === 'PENDING').length;

      // Fetch Low Stock Items
      const { count: lowStockItems } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('merchantId', merchantId)
        .lt('stockQuantity', 5); // Assuming a threshold of 5 for low stock

      // Fetch Reviews and Ratings
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('merchantId', merchantId);

      if (reviewsError) throw reviewsError;

      const reviewCount = reviewsData.length;
      const totalRating = reviewsData.reduce((sum, review) => sum + (review.rating || 0), 0);
      const rating = reviewCount > 0 ? totalRating / reviewCount : 0;

      // Fetch Recent Orders (e.g., last 5)
      const { data: recentOrdersData, error: recentOrdersError } = await supabase
        .from('orders')
        .select('id, customerName, items, totalAmount, status')
        .eq('merchantId', merchantId)
        .order('createdAt', { ascending: false })
        .limit(5);

      if (recentOrdersError) throw recentOrdersError;

      setMerchantStats({
        totalProducts: totalProducts || 0,
        totalRevenue: totalRevenue,
        totalOrders: totalOrders,
        pendingOrders: pendingOrders,
        lowStockItems: lowStockItems || 0,
        reviewCount: reviewCount,
        rating: rating,
      });
      setRecentOrders(recentOrdersData || []);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      Alert.alert("Error", "Could not load dashboard data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(["userToken", "userEmail", "userRole"]);
              await supabase.auth.signOut();
              router.replace("/");
            } catch (error) {
              console.error("Error signing out:", error);
            }
          }
        }
      ]
    );
  };

  const handleFeaturePress = (feature: any) => {
    switch (feature.id) {
      case 'manage-commodities':
        router.push('/merchant/commodities');
        break;
      case 'add-commodity':
        router.push('/merchant/add-commodity');
        break;
      case 'manage-orders':
        router.push('/merchant/order-management');
        break;
      case 'inventory':
        router.push('/merchant/inventory');
        break;
      case 'analytics':
        router.push('/merchant/analytics');
        break;
      case 'customers':
        router.push('/merchant/customer-communication');
        break;
      case 'store-settings':
        router.push('/profile/edit');
        break;
      default:
        Alert.alert("Feature", `${feature.title} is not yet implemented.`);
    }
  };


  const features = [
    {
      id: "add-commodity",
      title: "Add Products",
      description: "List new items",
      icon: 'add-circle-outline',
      route: "/merchant/add-commodity"
    },
    {
      id: "manage-commodities",
      title: "Manage Inventory",
      description: "Track your stock",
      icon: 'cube-outline',
      route: "/merchant/commodities"
    },
    {
      id: "manage-orders",
      title: "Orders",
      description: "View customer orders",
      icon: 'receipt-outline',
      route: "/orders/consumer-orders" // This route might need adjustment if it's for consumer orders specifically
    },
    {
      id: "analytics",
      title: "Analytics",
      description: "Sales insights",
      icon: 'stats-chart-outline',
      route: "/merchant/analytics"
    },
    {
      id: "store-settings",
      title: "Store Settings",
      description: "Manage your store",
      icon: 'settings-outline',
      route: "/profile/edit"
    }
  ];

  const styles = getResponsiveStyles(screenData);

  return (
    <LinearGradient
      colors={['#0B1A51', '#1e3a8a']}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/home/merchant')}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.greeting}>Welcome, Merchant! </Text>
            <Ionicons name="storefront" size={24} color="white" />
          </View>
          <Text style={styles.email}>{userEmail}</Text>
        </View>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4682B4" />
            <Text style={styles.loadingText}>Loading dashboard...</Text>
          </View>
        ) : (
          <>
            {/* Alert Cards */}
            {merchantStats.pendingOrders > 0 && (
              <TouchableOpacity
                style={styles.alertCard}
                onPress={() => router.push('/merchant/order-management')}
              >
                <Ionicons name="notifications-outline" size={24} color="#FFA500" />
                <Text style={styles.alertText}>
                  You have {merchantStats.pendingOrders} pending order{merchantStats.pendingOrders > 1 ? 's' : ''}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            )}

            {merchantStats.lowStockItems > 0 && (
              <TouchableOpacity
                style={[styles.alertCard, { backgroundColor: '#FFF3E0' }]}
                onPress={() => router.push('/merchant/inventory')}
              >
                <Ionicons name="warning-outline" size={24} color="#FF6B6B" />
                <Text style={styles.alertText}>
                  {merchantStats.lowStockItems} item{merchantStats.lowStockItems > 1 ? 's' : ''} running low on stock
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            )}

            <View style={styles.statsContainer}>
              <Text style={styles.sectionTitle}>Business Overview</Text>
              <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: "#0B1A51" }]}>
                  <Text style={styles.statNumber}>{merchantStats.totalProducts}</Text>
                  <Text style={styles.statLabel}>Products</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: "#0B1A51" }]}>
                  <Text style={styles.statNumber}>{formatNaira(merchantStats.totalRevenue)}</Text>
                  <Text style={styles.statLabel}>Revenue</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: "#0B1A51" }]}>
                  <Text style={styles.statNumber}>{merchantStats.totalOrders}</Text>
                  <Text style={styles.statLabel}>Orders</Text>
                </View>
              </View>

              {/* Rating Card */}
              {merchantStats.reviewCount > 0 && (
                <TouchableOpacity
                  style={styles.ratingCard}
                  onPress={() => router.push('/merchant/analytics')}
                >
                  <View style={styles.ratingHeader}>
                    <Text style={styles.ratingTitle}>Customer Rating</Text>
                    <View style={styles.ratingStars}>
                      {[...Array(5)].map((_, i) => (
                        <Ionicons
                          key={i}
                          name={i < Math.floor(merchantStats.rating) ? 'star' : 'star-outline'}
                          size={20}
                          color="#FFD700"
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.ratingScore}>
                    {merchantStats.rating.toFixed(1)} ({merchantStats.reviewCount} reviews)
                  </Text>
                </TouchableOpacity>
              )}

              <View style={styles.recentOrders}>
                <View style={styles.recentOrdersHeader}>
                  <Text style={styles.sectionSubTitle}>Recent Orders</Text>
                  <TouchableOpacity onPress={() => router.push('/merchant/order-management')}>
                    <Text style={styles.viewAllText}>View All</Text>
                  </TouchableOpacity>
                </View>

                {recentOrders.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="receipt-outline" size={48} color="#ccc" />
                    <Text style={styles.emptyText}>No recent orders</Text>
                  </View>
                ) : (
                  recentOrders.map((order) => (
                    <TouchableOpacity
                      key={order.id}
                      style={styles.orderItem}
                      onPress={() => router.push(`/orders/order-details?orderId=${order.id}`)}
                    >
                      <View style={styles.orderInfo}>
                        <Text style={styles.orderText}>
                          #{order.id.slice(0, 8)} - {order.customerName}
                        </Text>
                        <Text style={styles.orderSubtext}>
                          {order.items} item{order.items > 1 ? 's' : ''} • {formatNaira(order.totalAmount)}
                        </Text>
                      </View>
                      <View style={[
                        styles.statusBadge,
                        order.status === 'DELIVERED' && styles.completedBadge,
                        order.status === 'PENDING' && styles.pendingBadge,
                      ]}>
                        <Text style={styles.statusText}>{order.status}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>Manage Your Business</Text>
        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <TouchableOpacity
              key={index}
              style={styles.featureCard}
              onPress={() => handleFeaturePress(feature)}
              activeOpacity={0.8}
            >
              <View style={[styles.featureIcon, { backgroundColor: "#4682B4" }]}>
                <Ionicons name={feature.icon as any} size={28} color="white" />
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.servicesContainer}>
          <TouchableOpacity
            style={styles.serviceCard}
            onPress={() => router.push('/merchant/add-commodity')}
          >
            <View style={[styles.serviceIconContainer, { backgroundColor: "#4682B4" }]}>
              <Ionicons name="add-circle-outline" size={30} color="white" />
            </View>
            <Text style={styles.serviceTitle}>Add New Product</Text>
            <Text style={styles.serviceDescription}>Add products to your inventory</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.serviceCard}
            onPress={() => router.push('/merchant/order-management')}
          >
            <View style={[styles.serviceIconContainer, { backgroundColor: "#4682B4" }]}>
              <Ionicons name="receipt-outline" size={30} color="white" />
            </View>
            <Text style={styles.serviceTitle}>View Orders</Text>
            <Text style={styles.serviceDescription}>Manage customer orders</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Quick Links</Text>
        <View style={styles.actionCardsContainer}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/merchant/commodities")}
          >
            <Image source={require('../../assets/images/manange_commodities_icon.png')} style={styles.actionIcon} />
            <Text style={styles.actionText}>Manage Commodities</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/merchant/order-management")}
          >
            <Image source={require('../../assets/images/manage_orders_icon.png')} style={styles.actionIcon} />
            <Text style={styles.actionText}>Order Management</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/merchant/inventory")}
          >
            <Ionicons name="library" size={32} color="#4682B4" />
            <Text style={styles.actionText}>Inventory</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/merchant/customer-communication")}
          >
            <Ionicons name="chatbubbles" size={32} color="#4682B4" />
            <Text style={styles.actionText}>Customer Communication</Text>
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
      alignItems: "flex-start",
      padding: Math.max(16, width * 0.05),
      paddingTop: Math.max(50, height * 0.07),
    },
    backButton: {
      padding: Math.max(8, width * 0.02),
      marginRight: Math.max(12, width * 0.03),
    },
    headerTextContainer: {
      flex: 1,
    },
    greeting: {
      fontSize: isTablet ? 28 : isSmallScreen ? 20 : 24,
      fontWeight: "bold",
      color: "white",
    },
    email: {
      fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
      color: "rgba(255, 255, 255, 0.8)",
      marginTop: 2,
    },
    signOutButton: {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      paddingHorizontal: Math.max(12, width * 0.03),
      paddingVertical: Math.max(6, height * 0.01),
      borderRadius: 15,
    },
    signOutText: {
      color: "white",
      fontSize: isTablet ? 14 : isSmallScreen ? 10 : 12,
      fontWeight: "500",
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
      fontSize: isTablet ? 24 : isSmallScreen ? 18 : 20,
      fontWeight: "bold",
      color: "#2c3e50",
      marginBottom: Math.max(16, height * 0.025),
    },
    sectionSubTitle: {
      fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
      fontWeight: "600",
      color: "#2c3e50",
      marginBottom: Math.max(12, height * 0.02),
    },
    featuresGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Math.max(12, width * 0.03),
      marginBottom: Math.max(24, height * 0.04),
    },
    featureCard: {
      width: isTablet ? "31%" : "47%",
      backgroundColor: "white",
      padding: Math.max(16, width * 0.04),
      borderRadius: 25,
      alignItems: "center",
      minHeight: isTablet ? 140 : 120,
      justifyContent: "center",
      borderWidth: 2,
      borderColor: "#4682B4",
    },
    featureIcon: {
      width: isTablet ? 60 : 50,
      height: isTablet ? 60 : 50,
      borderRadius: isTablet ? 30 : 25,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: Math.max(8, height * 0.015),
    },
    featureIconImage: {
      width: isTablet ? 32 : 28,
      height: isTablet ? 32 : 28,
    },
    featureTitle: {
      fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
      fontWeight: "600",
      color: "#2c3e50",
      marginBottom: Math.max(4, height * 0.008),
      textAlign: "center",
    },
    featureDescription: {
      fontSize: isTablet ? 14 : isSmallScreen ? 10 : 12,
      color: "#7f8c8d",
      textAlign: "center",
    },
    servicesContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: Math.max(24, height * 0.04),
      gap: Math.max(12, width * 0.03),
    },
    serviceCard: {
      flex: 1,
      backgroundColor: "white",
      padding: Math.max(16, width * 0.04),
      borderRadius: 25,
      alignItems: "center",
      minHeight: isTablet ? 140 : 120,
      justifyContent: "center",
      borderWidth: 2,
      borderColor: "#4682B4",
    },
    serviceIconContainer: {
      backgroundColor: "#4682B4",
      width: isTablet ? 60 : 50,
      height: isTablet ? 60 : 50,
      borderRadius: isTablet ? 30 : 25,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: Math.max(8, height * 0.015),
    },
    serviceTitle: {
      fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
      fontWeight: "600",
      color: "#2c3e50",
      marginBottom: Math.max(4, height * 0.008),
      textAlign: "center",
    },
    serviceDescription: {
      fontSize: isTablet ? 14 : isSmallScreen ? 10 : 12,
      color: "#7f8c8d",
      textAlign: "center",
    },
    actionCardsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Math.max(12, width * 0.03),
      marginBottom: Math.max(24, height * 0.04),
      justifyContent: "center",
    },
    actionCard: {
      width: isTablet ? "47%" : "47%",
      backgroundColor: "white",
      padding: Math.max(16, width * 0.04),
      borderRadius: 25,
      alignItems: "center",
      minHeight: isTablet ? 140 : 120,
      justifyContent: "center",
      borderWidth: 2,
      borderColor: "#4682B4",
      marginBottom: Math.max(12, height * 0.02),
    },
    actionIcon: {
      width: isTablet ? 40 : 32,
      height: isTablet ? 40 : 32,
      marginBottom: Math.max(8, height * 0.015),
    },
    actionText: {
      fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
      fontWeight: "600",
      color: "#2c3e50",
      textAlign: "center",
    },
    // Updated Styles for Dynamic Data
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 200, // Ensure it takes up space
    },
    loadingText: {
      fontSize: isTablet ? 18 : 16,
      color: '#666',
      marginTop: 10,
    },
    alertCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFF9E6', // Light yellow for notifications
      padding: Math.max(12, width * 0.03),
      borderRadius: 15,
      marginBottom: Math.max(12, height * 0.02),
      justifyContent: 'space-between',
    },
    alertText: {
      flex: 1,
      fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
      color: '#333',
      marginHorizontal: Math.max(8, width * 0.02),
    },
    statsContainer: {
      marginBottom: Math.max(16, height * 0.025),
    },
    statsRow: {
      flexDirection: "row",
      gap: Math.max(8, width * 0.02),
      marginBottom: Math.max(24, height * 0.04),
    },
    statCard: {
      flex: 1,
      backgroundColor: "#4682B4",
      padding: Math.max(12, width * 0.03),
      borderRadius: 20,
      alignItems: "center",
      minHeight: isTablet ? 80 : 60,
      justifyContent: "center",
    },
    statNumber: {
      fontSize: isTablet ? 22 : isSmallScreen ? 16 : 18,
      fontWeight: "bold",
      color: "white",
    },
    statLabel: {
      fontSize: isTablet ? 14 : isSmallScreen ? 10 : 12,
      color: "rgba(255, 255, 255, 0.8)",
      marginTop: 2,
    },
    ratingCard: {
      backgroundColor: 'white',
      padding: Math.max(16, width * 0.04),
      borderRadius: 15,
      marginBottom: Math.max(24, height * 0.04),
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    ratingHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Math.max(8, height * 0.015),
    },
    ratingTitle: {
      fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
      fontWeight: '600',
      color: '#2c3e50',
    },
    ratingStars: {
      flexDirection: 'row',
    },
    ratingScore: {
      fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
      color: '#7f8c8d',
      fontWeight: '500',
    },
    recentOrders: {
      backgroundColor: "#f8f9fa",
      padding: Math.max(16, width * 0.04),
      borderRadius: 15,
    },
    recentOrdersHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Math.max(12, height * 0.02),
    },
    viewAllText: {
      fontSize: isTablet ? 14 : isSmallScreen ? 10 : 12,
      color: "#4682B4",
      fontWeight: "600",
    },
    orderItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: Math.max(8, height * 0.015),
      borderBottomWidth: 1,
      borderBottomColor: "#e9ecef",
    },
    orderInfo: {
      flex: 1, // Take available space
      marginRight: Math.max(8, width * 0.02),
    },
    orderText: {
      fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
      color: "#2c3e50",
      fontWeight: "500",
    },
    orderSubtext: {
      fontSize: isTablet ? 13 : isSmallScreen ? 10 : 11,
      color: "#7f8c8d",
      marginTop: 2,
    },
    statusBadge: {
      paddingHorizontal: Math.max(10, width * 0.02),
      paddingVertical: Math.max(5, height * 0.008),
      borderRadius: 10,
      alignSelf: 'flex-start', // Ensure badge aligns correctly
    },
    completedBadge: {
      backgroundColor: "#a8e6cf", // Green for completed
    },
    pendingBadge: {
      backgroundColor: "#ffd93d", // Yellow for pending
    },
    statusText: {
      fontSize: isTablet ? 14 : isSmallScreen ? 10 : 12,
      fontWeight: "600",
      color: "#2c3e50",
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Math.max(20, height * 0.03),
    },
    emptyText: {
      fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
      color: '#999',
      marginTop: 10,
    },
  });
};