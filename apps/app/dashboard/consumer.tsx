import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { cartService } from "../../services/cartService";
import { orderService } from "../../services/orderService";
import { favoritesService } from "../../services/favoritesService";
import { formatNaira } from "../../utils/currency";

export default function ConsumerDashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [cartItemCount, setCartItemCount] = useState(0);
  const [activeOrders, setActiveOrders] = useState<{ id: string; status: string; date: string }[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    loadUserData();
    loadCartCount();
    loadActiveOrders();
    loadUserStats();

    // Refresh data when screen is focused
    const unsubscribe = () => {
      loadCartCount();
      loadActiveOrders();
      loadUserStats();
    };

    // Initial load
    loadCartCount();
    loadActiveOrders();
    loadUserStats();

    return () => {
      // Clean up if needed
    };
  }, []);

  const loadCartCount = async () => {
    const count = await cartService.getCartItemCount();
    setCartItemCount(count);
  };

  const loadUserData = async () => {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      setUserEmail(email || "user@brillprime.com");
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const loadActiveOrders = async () => {
    try {
      const response = await orderService.getUserOrders({
        status: 'pending',
        limit: 10,
      });

      if (response.success && response.data) {
        const orders = response.data.orders.map(order => ({
          id: order.id,
          status: order.status,
          date: new Date(order.createdAt).toLocaleDateString(),
        }));
        setActiveOrders(orders);
      }
    } catch (error) {
      console.error("Error loading active orders:", error);
    }
  };

  const loadUserStats = async () => {
    setIsLoadingStats(true);
    try {
      // Load order summary
      const orderSummaryResponse = await orderService.getOrderSummary();
      if (orderSummaryResponse.success && orderSummaryResponse.data) {
        setTotalOrders(orderSummaryResponse.data.totalOrders);
        setTotalSpent(orderSummaryResponse.data.totalSpent);
      }

      // Load favorites count
      const favoritesResponse = await favoritesService.getFavorites();
      if (favoritesResponse.success && favoritesResponse.data) {
        setFavoritesCount(favoritesResponse.data.length);
      }
    } catch (error) {
      console.error("Error loading user stats:", error);
    } finally {
      setIsLoadingStats(false);
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
              router.replace("/");
            } catch (error) {
              console.error("Error signing out:", error);
            }
          }
        }
      ]
    );
  };

  const handleFeaturePress = (featureTitle: string) => {
    switch (featureTitle) {
      case 'Order Fuel':
        router.push('/order/fuel');
        break;
      case 'Toll Payment':
        router.push('/toll');
        break;
      case 'My Orders':
        router.push('/orders/consumer-orders');
        break;
      case 'Browse Products':
        router.push('/commodity/commodities');
        break;
      case 'Messages':
        router.push('/messages');
        break;
      case 'Favorites':
        router.push('/favorites');
        break;
      case 'Support':
        router.push('/support');
        break;
      default:
        Alert.alert('Feature', `${featureTitle} is under development.`);
    }
  };

  const features = [
    { id: 'browse-commodities', title: "Browse Products", description: "Discover amazing products", icon: 'cart-outline', route: "/commodity/commodities" },
    { id: 'my-orders', title: "My Orders", description: "Track your orders", icon: 'receipt-outline', route: "/orders/consumer-orders" },
    { id: 'messages', title: "Messages", description: "Chat with merchants & drivers", icon: 'chatbubbles-outline', route: "/messages" },
    { id: 'favorites', title: "Favorites", description: "Your saved items", icon: 'heart-outline', route: "/favorites" },
    { id: 'support', title: "Support", description: "Get help anytime", icon: 'headset-outline', route: "/support" }
  ];

  const stats = [
    { label: "Orders", value: isLoadingStats ? "..." : totalOrders.toString(), color: "#0B1A51" },
    { label: "Total Spent", value: isLoadingStats ? "..." : formatNaira(totalSpent), color: "#0B1A51" },
    { label: "Favorites", value: isLoadingStats ? "..." : favoritesCount.toString(), color: "#0B1A51" },
  ];

  const quickActions = [
    { title: "My Orders", subtitle: "View order history", icon: "receipt-outline", action: () => router.push('/orders/consumer-orders') },
    {
      title: "Track Order", subtitle: "See your active delivery", icon: "car-sport-outline", action: () => {
        if (activeOrders.length > 0) {
          // Use query string route to satisfy router.push string signature
          router.push(`/orders/order-tracking?orderId=${activeOrders[0].id}`);
        } else {
          Alert.alert('No Active Orders', 'You don’t have any active orders to track.');
        }
      }
    },
  ];


  const styles = getResponsiveStyles(screenData);

  return (
    <LinearGradient
      colors={['#0B1A51', '#1e3a8a']}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.greeting}>Hello, Consumer! 👋</Text>
          <Text style={styles.email}>{userEmail}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => router.push('/cart')}
          >
            <Ionicons name="cart-outline" size={24} color="white" />
            {cartItemCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>What would you like to do?</Text>

        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <TouchableOpacity
              key={index}
              style={styles.featureCard}
              onPress={() => handleFeaturePress(feature.title)}
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

        <Text style={styles.sectionTitle}>Services</Text>
        <View style={styles.servicesContainer}>
          <TouchableOpacity
            style={[styles.serviceCard]}
            onPress={() => handleFeaturePress('Order Fuel')}
          >
            <View style={[styles.serviceIconContainer, { backgroundColor: "#4682B4" }]}>
              <Ionicons name="water-outline" size={28} color="white" />
            </View>
            <Text style={styles.serviceTitle}>Order Fuel</Text>
            <Text style={styles.serviceDescription}>Get fuel delivered to your location</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.serviceCard}
            onPress={() => handleFeaturePress('Toll Payment')}
          >
            <View style={[styles.serviceIconContainer, { backgroundColor: "#4682B4" }]}>
              <Ionicons name="car-outline" size={28} color="white" />
            </View>
            <Text style={styles.serviceTitle}>Toll Payment</Text>
            <Text style={styles.serviceDescription}>Pay toll fees in advance</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsRow}>
            {stats.map((stat, index) => (
              <View key={index} style={[styles.statCard, { backgroundColor: stat.color }]}>
                <Text style={styles.statNumber}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickActionCard}
                onPress={action.action}
              >
                <Ionicons name={action.icon as any} size={32} color="#4682B4" />
                <Text style={styles.quickActionTitle}>{action.title}</Text>
                <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Navigation Menu Items - Added Loyalty and Referral */}
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/transactions')}
          >
            <Ionicons name="receipt-outline" size={24} color="#4682B4" />
            <Text style={styles.menuItemText}>Transaction History</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/loyalty')}
          >
            <Ionicons name="star-outline" size={24} color="#4682B4" />
            <Text style={styles.menuItemText}>Loyalty Program</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/referral')}
          >
            <Ionicons name="people-outline" size={24} color="#4682B4" />
            <Text style={styles.menuItemText}>Refer & Earn</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* New UI Components for Real-time Features */}
        <View style={styles.activityHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => router.push('/notifications')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.activityList}>
          {/* Placeholder for real-time activities. In a real app, this would be fetched from Supabase. */}
          {activeOrders.slice(0, 3).map((order, index) => (
            <View key={index} style={styles.activityItem}>
              <View style={styles.activityIconContainer}>
                <Ionicons name="receipt-outline" size={20} color="#4682B4" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Order #{order.id.substring(0, 6)}</Text>
                <Text style={styles.activityDescription}>Status: {order.status}</Text>
              </View>
              <Text style={styles.activityTime}>{order.date}</Text>
            </View>
          ))}
        </View>

        <View style={styles.activeOrdersList}>
          <Text style={styles.sectionTitle}>Active Orders</Text>
          {activeOrders.length > 0 ? (
            activeOrders.map((order, index) => (
              <TouchableOpacity
                key={index}
                style={styles.activeOrderCard}
                onPress={() => router.push(`/orders/order-tracking?orderId=${order.id}`)}
              >
                <View style={styles.orderCardHeader}>
                  <Text style={styles.orderCardTitle}>Order #{order.id.substring(0, 6)}</Text>
                  <View style={[styles.orderStatusBadge, { backgroundColor: '#28a745' }]}>
                    <Text style={styles.orderStatusText}>{order.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.orderMerchant}>Merchant Name</Text> {/* Placeholder */}
                <View style={styles.orderCardFooter}>
                  <Text style={styles.orderTotal}>Total: {formatNaira(Math.random() * 1000)}</Text> {/* Placeholder */}
                  <Text style={styles.orderDate}>{order.date}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={{ textAlign: 'center', color: '#666', marginVertical: 16 }}>No active orders.</Text>
          )}
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
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Math.max(8, width * 0.02),
    },
    cartButton: {
      position: 'relative',
      padding: Math.max(8, width * 0.02),
    },
    cartBadge: {
      position: 'absolute',
      top: 0,
      right: 0,
      backgroundColor: '#ff4444',
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cartBadgeText: {
      color: 'white',
      fontSize: 10,
      fontWeight: 'bold',
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
    serviceIcon: {
      width: isTablet ? 30 : 25,
      height: isTablet ? 30 : 25,
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
    statsContainer: {
      marginBottom: Math.max(16, height * 0.025),
    },
    statsRow: {
      flexDirection: "row",
      gap: Math.max(8, width * 0.02),
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
    quickActionsContainer: {
      marginBottom: Math.max(16, height * 0.025),
    },
    quickActionsRow: {
      flexDirection: "row",
      gap: Math.max(8, width * 0.02),
    },
    quickActionCard: {
      flex: 1,
      backgroundColor: "white",
      padding: Math.max(12, width * 0.03),
      borderRadius: 20,
      alignItems: "center",
      minHeight: isTablet ? 100 : 80,
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "#e0e0e0",
    },
    quickActionTitle: {
      fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
      fontWeight: "bold",
      color: "#2c3e50",
      marginTop: 5,
    },
    quickActionSubtitle: {
      fontSize: isTablet ? 12 : isSmallScreen ? 9 : 10,
      color: "#7f8c8d",
      marginTop: 2,
    },
    menuContainer: {
      marginTop: Math.max(16, height * 0.025),
      backgroundColor: "white",
      borderRadius: 25,
      paddingVertical: 10,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: Math.max(12, height * 0.015),
      paddingHorizontal: Math.max(16, width * 0.04),
      borderBottomWidth: 1,
      borderBottomColor: "#eee",
    },
    menuItemText: {
      flex: 1,
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      fontWeight: '500',
      color: '#333',
      marginLeft: Math.max(12, width * 0.03),
    },
    reviewAlert: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFF9E6',
      padding: 12,
      borderRadius: 12,
      marginBottom: 16,
      gap: 8,
    },
    reviewAlertText: {
      flex: 1,
      fontSize: 14,
      color: '#333',
    },
    activityHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    viewAllText: {
      fontSize: 14,
      color: '#4682B4',
      fontWeight: '500',
    },
    activityList: {
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 12,
    },
    activityItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    activityIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#E3F2FD',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    activityContent: {
      flex: 1,
    },
    activityTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#333',
      marginBottom: 2,
    },
    activityDescription: {
      fontSize: 12,
      color: '#666',
    },
    activityTime: {
      fontSize: 11,
      color: '#999',
    },
    activeOrdersList: {
      gap: 12,
    },
    activeOrderCard: {
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: '#E0E0E0',
    },
    orderCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    orderCardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333',
    },
    orderStatusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    orderStatusText: {
      fontSize: 11,
      fontWeight: '600',
      color: 'white',
    },
    orderMerchant: {
      fontSize: 14,
      color: '#666',
      marginBottom: 8,
    },
    orderCardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: '#f0f0f0',
    },
    orderTotal: {
      fontSize: 16,
      fontWeight: '700',
      color: '#4682B4',
    },
    orderDate: {
      fontSize: 12,
      color: '#999',
    },
  });
};