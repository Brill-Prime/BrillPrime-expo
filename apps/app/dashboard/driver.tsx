
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, RefreshControl, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { orderService } from "../../services/orderService";
import { authService } from "../../services/authService";
import { locationService } from "../../services/locationService";
import { formatNaira } from "../../utils/currency";
import { realtimeService } from "../../services/realtimeService";

interface DriverStats {
  deliveries: number;
  earnings: number;
  rating: number;
}

interface Order {
  id: string;
  customer: string;
  customerPhone?: string;
  distance: string;
  status: string;
  amount: number;
  pickupAddress: string;
  deliveryAddress: string;
  createdAt: string;
}

export default function DriverDashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [todayStats, setTodayStats] = useState<DriverStats>({ deliveries: 0, earnings: 0, rating: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    loadUserData();
    loadDriverData();
    subscribeToRealtimeUpdates();

    return () => {
      // Cleanup subscriptions
      realtimeService.unsubscribeAll();
    };
  }, []);

  const loadUserData = async () => {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      setUserEmail(email || "driver@brillprime.com");
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const loadDriverData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadAvailableOrders(),
        loadActiveOrders(),
        loadTodayStats(),
        loadDriverStatus(),
      ]);
    } catch (error) {
      console.error("Error loading driver data:", error);
      Alert.alert("Error", "Failed to load driver data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableOrders = async () => {
    try {
      const response = await orderService.getUserOrders({
        status: 'pending',
        limit: 10,
      });

      if (response.success && response.data) {
        const orders = response.data.orders.map(order => ({
          id: order.id,
          customer: order.user?.name || 'Customer',
          customerPhone: order.user?.phone,
          distance: calculateDistance(order),
          status: order.status,
          amount: order.total_amount || 0,
          pickupAddress: order.pickup_address || '',
          deliveryAddress: order.delivery_address || '',
          createdAt: order.created_at,
        }));
        setAvailableOrders(orders);
      }
    } catch (error) {
      console.error("Error loading available orders:", error);
    }
  };

  const loadActiveOrders = async () => {
    try {
      const response = await orderService.getUserOrders({
        status: 'in_transit',
        limit: 10,
      });

      if (response.success && response.data) {
        const orders = response.data.orders.map(order => ({
          id: order.id,
          customer: order.user?.name || 'Customer',
          customerPhone: order.user?.phone,
          distance: calculateDistance(order),
          status: order.status,
          amount: order.total_amount || 0,
          pickupAddress: order.pickup_address || '',
          deliveryAddress: order.delivery_address || '',
          createdAt: order.created_at,
        }));
        setActiveOrders(orders);
      }
    } catch (error) {
      console.error("Error loading active orders:", error);
    }
  };

  const loadTodayStats = async () => {
    try {
      const response = await orderService.getOrderSummary();
      if (response.success && response.data) {
        setTodayStats({
          deliveries: response.data.completedOrders || 0,
          earnings: response.data.totalSpent || 0,
          rating: 4.8, // This would come from a driver rating service
        });
      }
    } catch (error) {
      console.error("Error loading today stats:", error);
    }
  };

  const loadDriverStatus = async () => {
    try {
      const status = await AsyncStorage.getItem("driverOnlineStatus");
      setIsOnline(status === "true");
    } catch (error) {
      console.error("Error loading driver status:", error);
    }
  };

  const calculateDistance = (order: any): string => {
    // This would use locationService to calculate actual distance
    // For now, return a placeholder
    return "2.5 km";
  };

  const subscribeToRealtimeUpdates = () => {
    // Subscribe to new order notifications
    realtimeService.subscribeToOrderUpdates('driver', (update) => {
      if (update.status === 'pending') {
        loadAvailableOrders();
      } else if (update.status === 'in_transit') {
        loadActiveOrders();
      }
    });
  };

  const toggleOnlineStatus = async () => {
    setIsUpdatingStatus(true);
    try {
      const newStatus = !isOnline;
      setIsOnline(newStatus);
      await AsyncStorage.setItem("driverOnlineStatus", newStatus.toString());

      if (newStatus) {
        // Start location tracking when going online
        await locationService.startLiveTracking(5000);
      } else {
        // Stop location tracking when going offline
        locationService.stopLiveTracking();
      }

      Alert.alert(
        newStatus ? "Going Online" : "Going Offline",
        newStatus 
          ? "You're now online and ready to receive delivery requests!" 
          : "You're now offline and won't receive new delivery requests."
      );
    } catch (error) {
      console.error("Error toggling online status:", error);
      Alert.alert("Error", "Failed to update status. Please try again.");
      setIsOnline(!isOnline); // Revert on error
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      const response = await orderService.updateOrderStatus(orderId, 'CONFIRMED');
      if (response.success) {
        Alert.alert("Success", "Order accepted successfully!");
        await loadDriverData();
      } else {
        Alert.alert("Error", response.error || "Failed to accept order");
      }
    } catch (error) {
      console.error("Error accepting order:", error);
      Alert.alert("Error", "Failed to accept order. Please try again.");
    }
  };

  const handleStartDelivery = async (orderId: string) => {
    try {
      const response = await orderService.updateOrderStatus(orderId, 'IN_TRANSIT');
      if (response.success) {
        Alert.alert("Success", "Delivery started!");
        router.push({
          pathname: '/orders/order-tracking',
          params: { orderId }
        });
      } else {
        Alert.alert("Error", response.error || "Failed to start delivery");
      }
    } catch (error) {
      console.error("Error starting delivery:", error);
      Alert.alert("Error", "Failed to start delivery. Please try again.");
    }
  };

  const handleCompleteDelivery = async (orderId: string) => {
    Alert.alert(
      "Complete Delivery",
      "Are you sure you want to mark this delivery as completed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete",
          onPress: async () => {
            try {
              const response = await orderService.updateOrderStatus(orderId, 'DELIVERED');
              if (response.success) {
                Alert.alert("Success", "Delivery completed successfully!");
                await loadDriverData();
              } else {
                Alert.alert("Error", response.error || "Failed to complete delivery");
              }
            } catch (error) {
              console.error("Error completing delivery:", error);
              Alert.alert("Error", "Failed to complete delivery. Please try again.");
            }
          }
        }
      ]
    );
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
              // Stop location tracking
              locationService.stopLiveTracking();
              // Sign out
              await authService.signOut();
              router.replace("/");
            } catch (error) {
              console.error("Error signing out:", error);
            }
          }
        }
      ]
    );
  };

  const handleFeaturePress = (feature: string) => {
    switch (feature) {
      case 'Available Jobs':
        router.push('/orders/driver-orders');
        break;
      case 'My Deliveries':
        if (activeOrders.length > 0) {
          router.push({
            pathname: '/orders/order-tracking',
            params: { orderId: activeOrders[0].id }
          });
        } else {
          Alert.alert('No Active Orders', 'You don\'t have any active deliveries.');
        }
        break;
      case 'Earnings':
        router.push('/driver/earnings-details');
        break;
      case 'Route Planner':
        if (activeOrders.length > 0) {
          router.push({
            pathname: '/orders/order-tracking',
            params: { orderId: activeOrders[0].id }
          });
        } else {
          Alert.alert('No Active Orders', 'You don\'t have any active deliveries to plan a route for.');
        }
        break;
      case 'Vehicle Info':
        router.push('/driver/vehicle-management');
        break;
      case 'Help & Support':
        router.push('/support');
        break;
      default:
        Alert.alert('Feature', `Opening ${feature}...`);
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadDriverData();
    setIsRefreshing(false);
  }, []);

  const features = [
    { id: 'available-orders', title: "Available Jobs", description: "Find deliveries", icon: "location" as const, color: "#4682B4", route: "/orders/driver-orders" },
    { id: 'my-deliveries', title: "My Deliveries", description: "Current orders", icon: "cube" as const, color: "#f093fb", route: "/orders/driver-orders" },
    { id: 'earnings', title: "Earnings", description: "Track your income", icon: "cash" as const, color: "#4facfe", route: "/driver/earnings-details" },
    { id: 'navigation', title: "Route Planner", description: "Optimize your routes", icon: "map" as const, color: "#ff7e5f", route: "/store-locator" },
    { id: 'vehicle-info', title: "Vehicle Info", description: "Manage your vehicle", icon: "car" as const, color: "#a8e6cf", route: "/profile/vehicle" },
    { id: 'support', title: "Help & Support", description: "Get assistance", icon: "headset" as const, color: "#ffd93d", route: "/support" }
  ];

  if (isLoading) {
    return (
      <LinearGradient colors={['#0B1A51', '#1e3a8a']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading driver dashboard...</Text>
        </View>
      </LinearGradient>
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
          onPress={() => router.push('/home/driver')}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.greeting}>Ready to Drive! </Text>
            <Ionicons name="car-sport" size={24} color="white" />
          </View>
          <Text style={styles.email}>{userEmail}</Text>
        </View>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#4682B4"
          />
        }
      >
        <View style={styles.statusContainer}>
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>Driver Status</Text>
            <TouchableOpacity
              style={[styles.statusToggle, isOnline && styles.onlineToggle]}
              onPress={toggleOnlineStatus}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <View style={[styles.toggleCircle, isOnline && styles.onlineCircle]} />
              )}
            </TouchableOpacity>
            <Text style={[styles.statusText, isOnline && styles.onlineText]}>
              {isOnline ? "ONLINE" : "OFFLINE"}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Your Dashboard</Text>

        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <TouchableOpacity
              key={index}
              style={styles.featureCard}
              onPress={() => handleFeaturePress(feature.title)}
            >
              <View style={[styles.featureIcon, { backgroundColor: feature.color }]}>
                <Ionicons name={feature.icon} size={32} color="white" />
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Today's Summary</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{todayStats.deliveries}</Text>
              <Text style={styles.statLabel}>Deliveries</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{formatNaira(todayStats.earnings)}</Text>
              <Text style={styles.statLabel}>Earnings</Text>
            </View>
            <View style={styles.statCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.statNumber}>{todayStats.rating.toFixed(1)} </Text>
                <Ionicons name="star" size={20} color="#FFD700" />
              </View>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>

          {availableOrders.length > 0 && (
            <View style={styles.ordersSection}>
              <Text style={styles.sectionSubTitle}>Available Orders</Text>
              {availableOrders.map((order, index) => (
                <View key={index} style={styles.orderItem}>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderText}>Order #{order.id.slice(0, 8)}</Text>
                    <Text style={styles.orderDistance}>{order.distance}</Text>
                    <Text style={styles.orderAmount}>{formatNaira(order.amount)}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleAcceptOrder(order.id)}
                  >
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={styles.recentDeliveries}>
            <Text style={styles.sectionSubTitle}>Active Deliveries</Text>
            {activeOrders.length > 0 ? activeOrders.map((order, index) => (
              <View key={index} style={styles.deliveryItem}>
                <View style={styles.deliveryInfo}>
                  <Text style={styles.deliveryText}>Order #{order.id.slice(0, 8)}</Text>
                  <Text style={styles.deliveryDistance}>{order.distance}</Text>
                </View>
                <View style={styles.deliveryActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.trackButton]}
                    onPress={() => router.push({
                      pathname: '/orders/order-tracking',
                      params: { orderId: order.id }
                    })}
                  >
                    <Text style={styles.actionButtonText}>Track</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.completeButton]}
                    onPress={() => handleCompleteDelivery(order.id)}
                  >
                    <Text style={styles.actionButtonText}>Complete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )) : (
              <Text style={{ textAlign: 'center', color: '#7f8c8d', paddingVertical: 20 }}>
                No active deliveries.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    marginRight: 15,
    paddingVertical: 8,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  headerTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  email: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  signOutButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  signOutText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  content: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  statusContainer: {
    marginBottom: 30,
  },
  statusCard: {
    backgroundColor: "white",
    padding: 25,
    borderRadius: 25,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#4682B4",
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 15,
  },
  statusToggle: {
    width: 60,
    height: 30,
    backgroundColor: "#e9ecef",
    borderRadius: 15,
    justifyContent: "center",
    marginBottom: 10,
  },
  onlineToggle: {
    backgroundColor: "#4682B4",
  },
  toggleCircle: {
    width: 26,
    height: 26,
    backgroundColor: "white",
    borderRadius: 13,
    marginLeft: 2,
  },
  onlineCircle: {
    marginLeft: 32,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#7f8c8d",
  },
  onlineText: {
    color: "#4682B4",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 20,
  },
  sectionSubTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 15,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
    marginBottom: 30,
  },
  featureCard: {
    width: "47%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 25,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#4682B4",
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 5,
    textAlign: "center",
  },
  featureDescription: {
    fontSize: 12,
    color: "#7f8c8d",
    textAlign: "center",
  },
  statsContainer: {
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    padding: 15,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#4682B4",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4682B4",
  },
  statLabel: {
    fontSize: 12,
    color: "#2c3e50",
    marginTop: 2,
  },
  ordersSection: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#4682B4",
    marginBottom: 20,
  },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  orderInfo: {
    flex: 1,
  },
  orderText: {
    fontSize: 14,
    color: "#2c3e50",
    fontWeight: "600",
  },
  orderDistance: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 2,
  },
  orderAmount: {
    fontSize: 14,
    color: "#4682B4",
    fontWeight: "bold",
    marginTop: 4,
  },
  acceptButton: {
    backgroundColor: "#4682B4",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 15,
  },
  acceptButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  recentDeliveries: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#4682B4",
  },
  deliveryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryText: {
    fontSize: 14,
    color: "#2c3e50",
    fontWeight: "600",
  },
  deliveryDistance: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 2,
  },
  deliveryActions: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  trackButton: {
    backgroundColor: "#ffd93d",
  },
  completeButton: {
    backgroundColor: "#a8e6cf",
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2c3e50",
  },
});
