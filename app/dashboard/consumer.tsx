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

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    loadUserData();
    loadCartCount();
    
    // Refresh cart count when screen is focused
    const unsubscribe = router.addListener?.('focus', () => {
      loadCartCount();
    });

    return unsubscribe;
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
    if (feature.route) {
      router.push(feature.route);
    } else {
      Alert.alert("Coming Soon", `${feature.title} feature will be available soon!`);
    }
  };

  const features = [
    { title: "Browse Products", description: "Discover amazing products", emoji: "🛍️", color: "#667eea", route: "/commodity/commodities" },
    { title: "My Orders", description: "Track your orders", emoji: "📦", color: "#f093fb", route: "/orders/consumer-orders" },
    { title: "Messages", description: "Chat with merchants & drivers", emoji: "💬", color: "#4CAF50", route: "/chat" },
    { title: "Favorites", description: "Your saved items", emoji: "❤️", color: "#4facfe", route: "/favorites" },
    { title: "Support", description: "Get help anytime", emoji: "🎧", color: "#ffd93d", route: "/support" }
  ];

  const styles = getResponsiveStyles(screenData);

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <View style={styles.header}>
        <View>
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
              onPress={() => handleFeaturePress(feature)}
              activeOpacity={0.8}
            >
              <View style={[styles.featureIcon, { backgroundColor: feature.color }]}>
                <Text style={styles.featureEmoji}>{feature.emoji}</Text>
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Services</Text>
        <View style={styles.servicesContainer}>
          <TouchableOpacity
            style={styles.serviceCard}
            onPress={() => router.push('/order/fuel')}
          >
            <View style={styles.serviceIconContainer}>
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
            onPress={() => router.push('/toll')}
          >
            <View style={styles.serviceIconContainer}>
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
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>₹2,450</Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>8</Text>
              <Text style={styles.statLabel}>Favorites</Text>
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
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
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
      backgroundColor: "#f8f9fa",
      padding: Math.max(16, width * 0.04),
      borderRadius: 15,
      alignItems: "center",
      minHeight: isTablet ? 140 : 120,
      justifyContent: "center",
    },
    featureIcon: {
      width: isTablet ? 60 : 50,
      height: isTablet ? 60 : 50,
      borderRadius: isTablet ? 30 : 25,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: Math.max(8, height * 0.015),
    },
    featureEmoji: {
      fontSize: isTablet ? 28 : isSmallScreen ? 20 : 24,
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
      backgroundColor: "#f8f9fa",
      padding: Math.max(16, width * 0.04),
      borderRadius: 15,
      alignItems: "center",
      minHeight: isTablet ? 140 : 120,
      justifyContent: "center",
    },
    serviceIconContainer: {
      backgroundColor: "#667eea",
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
      backgroundColor: "#667eea",
      padding: Math.max(12, width * 0.03),
      borderRadius: 10,
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
  });
};