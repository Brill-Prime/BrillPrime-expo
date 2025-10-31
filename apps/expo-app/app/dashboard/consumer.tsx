import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions, Image } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { cartService } from "../../services/cartService";

export default function ConsumerDashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [cartItemCount, setCartItemCount] = useState(0);
  const [activeOrders, setActiveOrders] = useState<{ id: string; status: string; date: string }[]>([]); // Assuming you'll fetch active orders

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    loadUserData();
    loadCartCount();
    loadActiveOrders(); // Load active orders when the component mounts

    // Refresh cart count when screen is focused
    const unsubscribe = () => {
      loadCartCount();
      loadActiveOrders(); // Refresh active orders as well
    };

    // Initial load
    loadCartCount();
    loadActiveOrders();

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
    // This is a placeholder. Replace with actual API call to fetch active orders.
    // Example:
    // const orders = await fetch('/api/orders/active').then(res => res.json());
    // setActiveOrders(orders);
    try {
      // Mocking some active orders for demonstration
      const mockOrders = [
        { id: 'ORD12345', status: 'Processing', date: '2023-10-27' },
        { id: 'ORD67890', status: 'Shipped', date: '2023-10-26' },
      ];
      setActiveOrders(mockOrders);
    } catch (error) {
      console.error("Error loading active orders:", error);
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
    { id: 'browse-commodities', title: "Browse Products", description: "Discover amazing products", icon: require('../../../docs/assets/stock_images/3d_shopping_bag_icon_04f42e6d.jpg'), route: "/commodity/commodities" },
    { id: 'my-orders', title: "My Orders", description: "Track your orders", icon: require('../../../docs/assets/stock_images/3d_package_box_icon_1d5ed216.jpg'), route: "/orders/consumer-orders" },
    { id: 'messages', title: "Messages", description: "Chat with merchants & drivers", icon: require('../../../docs/assets/stock_images/3d_chat_bubble_icon_1dc64b6c.jpg'), route: "/messages" },
    { id: 'favorites', title: "Favorites", description: "Your saved items", icon: require('../../../docs/assets/stock_images/3d_heart_icon_favori_200752cd.jpg'), route: "/favorites" },
    { id: 'support', title: "Support", description: "Get help anytime", icon: require('../../../docs/assets/stock_images/3d_headphones_icon_s_281856ca.jpg'), route: "/support" }
  ];

  const stats = [
    { label: "Orders", value: "12", color: "#0B1A51" },
    { label: "Total Spent", value: "₹2,450", color: "#0B1A51" },
    { label: "Favorites", value: "8", color: "#0B1A51" },
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

        <Text style={styles.sectionTitle}>Services</Text>
        <View style={styles.servicesContainer}>
          <TouchableOpacity
            style={[styles.serviceCard]}
            onPress={() => handleFeaturePress('Order Fuel')}
          >
            <View style={[styles.serviceIconContainer, { backgroundColor: "#4682B4" }]}>
              <Image
                source={require('../../assets/images/consumer_order_fuel_icon.png')}
                style={styles.serviceIcon}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.serviceTitle}>Order Fuel</Text>
            <Text style={styles.serviceDescription}>Get fuel delivered to your location</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.serviceCard}
            onPress={() => handleFeaturePress('Toll Payment')}
          >
            <View style={[styles.serviceIconContainer, { backgroundColor: "#4682B4" }]}>
              <Image
                source={require('../../assets/images/purchase_toll_gate_white.png')}
                style={styles.serviceIcon}
                resizeMode="contain"
              />
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
  });
};