import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions, Image } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function MerchantDashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [screenData, setScreenData] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      setUserEmail(email || "merchant@brillprime.com");
    } catch (error) {
      console.error("Error loading user data:", error);
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

  const handleFeaturePress = (feature: any) => {
    switch (feature.id) {
      case 'manage-commodities':
        router.push('/merchant/commodities');
        break;
      case 'manage-orders':
        router.push('/merchant/order-management');
        break;
      case 'analytics':
        router.push('/merchant/analytics');
        break;
      case 'customer-communication':
        router.push('/chat');
        break;
      case 'inventory':
        router.push('/merchant/inventory');
        break;
      case 'store-settings':
        router.push('/merchant/store-settings');
        break;
      default:
        router.push(`/${feature.route}` || '/profile');
    }
  };

  const features = [
    {
      id: "manage-commodities",
      title: "Add Products",
      description: "List new items",
      icon: require('../../attached_assets/stock_images/3d_shopping_bag_icon_da3fd56f.jpg'),
      route: "/merchant/add-commodity"
    },
    {
      id: "manage-commodities",
      title: "Manage Inventory",
      description: "Track your stock",
      icon: require('../../attached_assets/stock_images/3d_package_box_icon,_7337f405.jpg'),
      route: "/merchant/commodities"
    },
    {
      id: "manage-orders",
      title: "Orders",
      description: "View customer orders",
      icon: require('../../attached_assets/stock_images/3d_chat_bubble_icon,_09d7368d.jpg'),
      route: "/orders/consumer-orders"
    },
    {
      id: "analytics",
      title: "Analytics",
      description: "Sales insights",
      icon: require('../../attached_assets/stock_images/3d_headphones_icon,__8d7235fd.jpg'),
      route: "/merchant/analytics"
    },
    {
      id: "store-settings",
      title: "Store Settings",
      description: "Manage your store",
      icon: require('../../attached_assets/stock_images/3d_heart_icon,_favor_cc7abce4.jpg'),
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
          <Text style={styles.greeting}>Welcome, Merchant! 🏪</Text>
          <Text style={styles.email}>{userEmail}</Text>
        </View>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
                <Image
                  source={feature.icon}
                  style={styles.featureIconImage}
                  resizeMode="contain"
                />
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
            <View style={[styles.serviceIconContainer, {backgroundColor: "#4682B4"}]}>
              <Ionicons name="add-circle-outline" size={30} color="white" />
            </View>
            <Text style={styles.serviceTitle}>Add New Product</Text>
            <Text style={styles.serviceDescription}>Add products to your inventory</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.serviceCard}
            onPress={() => router.push('/orders/consumer-orders')}
          >
            <View style={[styles.serviceIconContainer, {backgroundColor: "#4682B4"}]}>
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


        <Text style={styles.sectionTitle}>Business Overview</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, {backgroundColor: "#0B1A51"}]}>
              <Text style={styles.statNumber}>45</Text>
              <Text style={styles.statLabel}>Products</Text>
            </View>
            <View style={[styles.statCard, {backgroundColor: "#0B1A51"}]}>
              <Text style={styles.statNumber}>₦18,750</Text>
              <Text style={styles.statLabel}>Revenue</Text>
            </View>
            <View style={[styles.statCard, {backgroundColor: "#0B1A51"}]}>
              <Text style={styles.statNumber}>23</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
          </View>

          <View style={styles.recentOrders}>
            <Text style={styles.sectionSubTitle}>Recent Orders</Text>
            <View style={styles.orderItem}>
              <Text style={styles.orderText}>Order #1234 - ₦850</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Processing</Text>
              </View>
            </View>
            <View style={styles.orderItem}>
              <Text style={styles.orderText}>Order #1233 - ₦1,200</Text>
              <View style={[styles.statusBadge, styles.completedBadge]}>
                <Text style={styles.statusText}>Completed</Text>
              </View>
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
    recentOrders: {
      backgroundColor: "#f8f9fa",
      padding: Math.max(16, width * 0.04),
      borderRadius: 15,
    },
    orderItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: Math.max(8, height * 0.015),
      borderBottomWidth: 1,
      borderBottomColor: "#e9ecef",
    },
    orderText: {
      fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
      color: "#2c3e50",
      fontWeight: "500",
    },
    statusBadge: {
      backgroundColor: "#ffd93d",
      paddingHorizontal: Math.max(8, width * 0.02),
      paddingVertical: Math.max(3, height * 0.005),
      borderRadius: 10,
    },
    completedBadge: {
      backgroundColor: "#a8e6cf",
    },
    statusText: {
      fontSize: isTablet ? 14 : isSmallScreen ? 10 : 12,
      fontWeight: "600",
      color: "#2c3e50",
    },
  });
};