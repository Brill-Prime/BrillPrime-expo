import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { orderService } from "../../services/orderService";

export default function DriverDashboard() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [driverProfile, setDriverProfile] = useState<{
    id: string;
    is_available: boolean;
    rating: number;
    total_deliveries: number;
  } | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    setLoadError(null);
    const [profileResult, ordersResult] = await Promise.all([
      orderService.getDriverProfile(),
      orderService.getDriverOrders(),
    ]);

    if (!profileResult.success || !profileResult.data) {
      setLoadError(profileResult.error || 'Unable to load driver profile.');
      return;
    }
    if (!ordersResult.success || !ordersResult.data) {
      setLoadError(ordersResult.error || 'Unable to load driver orders.');
      return;
    }
    setDriverProfile(profileResult.data);
    setOrders(ordersResult.data.orders);
  }, []);

  useEffect(() => {
    let active = true;
    let unsubscribeOrders: (() => void) | undefined;
    let unsubscribeProfile: (() => void) | undefined;

    const initialize = async () => {
      setIsLoading(true);
      try {
        await loadDashboardData();
        const driverId = await orderService.getInternalDriverId();
        if (!active || !driverId) return;
        const refresh = () => {
          if (active) void loadDashboardData();
        };
        unsubscribeOrders = orderService.subscribeToDriverOrders(driverId, refresh);
        unsubscribeProfile = orderService.subscribeToDriverProfile(driverId, refresh);
      } catch (error) {
        console.error('Error initializing driver dashboard:', error);
        if (active) setLoadError('Unable to load driver dashboard. Retry to try again.');
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void initialize();
    return () => {
      active = false;
      unsubscribeOrders?.();
      unsubscribeProfile?.();
    };
  }, [loadDashboardData]);

  const toggleOnlineStatus = async () => {
    if (!driverProfile || isUpdatingAvailability) return;
    setIsUpdatingAvailability(true);
    try {
      const result = await orderService.setDriverAvailability(!driverProfile.is_available);
      if (!result.success) {
        Alert.alert('Status Update Failed', result.error || 'Could not update driver availability.');
        return;
      }
      await loadDashboardData();
      Alert.alert(
        driverProfile.is_available ? 'Going Offline' : 'Going Online',
        driverProfile.is_available
          ? "You're now offline and won't receive new delivery requests."
          : "You're now online and ready to receive delivery requests!"
      );
    } catch (error) {
      console.error('Error updating driver availability:', error);
      Alert.alert('Status Update Failed', 'Could not update driver availability.');
    } finally {
      setIsUpdatingAvailability(false);
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
              await signOut();
              router.replace("/");
            } catch (error) {
              console.error("Error signing out:", error);
            }
          }
        }
      ]
    );
  };

  const features = [
    { id: 'available-orders', title: "Available Jobs", description: "Find deliveries", icon: "location" as const, color: "#4682B4", route: "/orders/driver-orders" },
    { id: 'my-deliveries', title: "My Deliveries", description: "Current orders", icon: "cube" as const, color: "#f093fb", route: "/orders/driver-orders" },
    { id: 'earnings', title: "Earnings", description: "Track your income", icon: "cash" as const, color: "#4facfe", route: "/transactions" },
    { id: 'navigation', title: "Route Planner", description: "Optimize your routes", icon: "map" as const, color: "#ff7e5f", route: "/store-locator" },
    { id: 'vehicle-info', title: "Vehicle Info", description: "Manage your vehicle", icon: "car" as const, color: "#a8e6cf", route: "/profile/vehicle" },
    { id: 'support', title: "Help & Support", description: "Get assistance", icon: "headset" as const, color: "#ffd93d", route: "/support" }
  ];

  const handleFeaturePress = (feature: any) => {
    // All driver features fully implemented
    switch (feature.id) {
      case 'available-orders':
        router.push('/orders/driver-orders');
        break;
      case 'my-deliveries':
        router.push('/orders/driver-orders');
        break;
      case 'earnings':
        router.push('/transactions');
        break;
      case 'navigation':
        router.push('/store-locator');
        break;
      case 'vehicle-info':
        router.push('/kyc/documents');
        break;
      case 'support':
        router.push('/support');
        break;
      default:
        router.push(feature.route || '/profile');
    }
  };

  const today = new Date().toDateString();
  const completedToday = orders.filter(order =>
    order.status?.toLowerCase() === 'delivered' &&
    order.delivered_at &&
    new Date(order.delivered_at).toDateString() === today
  ).length;
  const activeOrders = orders.filter(order =>
    !['delivered', 'cancelled', 'rejected'].includes(order.status?.toLowerCase())
  ).length;
  const recentOrders = orders.slice(0, 3);

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
          <Text style={styles.email}>{user?.email || ''}</Text>
        </View>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statusContainer}>
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>Driver Status</Text>
            <TouchableOpacity
              style={[styles.statusToggle, driverProfile?.is_available && styles.onlineToggle]}
              onPress={toggleOnlineStatus}
              disabled={!driverProfile || isUpdatingAvailability}
            >
              <View style={[styles.toggleCircle, driverProfile?.is_available && styles.onlineCircle]} />
            </TouchableOpacity>
            <Text style={[styles.statusText, driverProfile?.is_available && styles.onlineText]}>
              {isLoading ? 'LOADING' : driverProfile?.is_available ? "ONLINE" : "OFFLINE"}
            </Text>
          </View>
        </View>

        {loadError && (
          <View style={styles.loadError}>
            <Text style={styles.errorText}>{loadError}</Text>
            <TouchableOpacity onPress={() => void loadDashboardData()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>Your Dashboard</Text>

        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <TouchableOpacity
              key={index}
              style={styles.featureCard}
              onPress={() => handleFeaturePress(feature)}
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
              <Text style={styles.statNumber}>{isLoading || loadError ? '—' : completedToday}</Text>
              <Text style={styles.statLabel}>Completed Today</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{isLoading || loadError ? '—' : activeOrders}</Text>
              <Text style={styles.statLabel}>Active Orders</Text>
            </View>
            <View style={styles.statCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.statNumber}>
                  {isLoading || loadError || !driverProfile ? '—' : Number(driverProfile.rating).toFixed(1)}
                </Text>
                <Ionicons name="star" size={20} color="#FFD700" />
              </View>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>

          <View style={styles.recentDeliveries}>
            <Text style={styles.sectionSubTitle}>Recent Orders</Text>
            {isLoading ? (
              <Text style={styles.deliveryText}>Loading orders…</Text>
            ) : recentOrders.length === 0 ? (
              <Text style={styles.deliveryText}>No assigned orders yet.</Text>
            ) : recentOrders.map(order => (
              <View key={order.id} style={styles.deliveryItem}>
                <Text style={styles.deliveryText}>Order #{String(order.id).slice(-8).toUpperCase()}</Text>
                <View style={[styles.statusBadge, order.status?.toLowerCase() === 'in_transit' && styles.inTransitBadge]}>
                  <Text style={styles.deliveryStatusText}>{String(order.status || 'unknown').replace('_', ' ')}</Text>
                </View>
              </View>
            ))}
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
  loadError: {
    backgroundColor: '#fff3f3',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#b00020',
    textAlign: 'center',
  },
  retryText: {
    color: '#4682B4',
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
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
  featureEmoji: {
    fontSize: 24,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 5,
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
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  deliveryText: {
    fontSize: 14,
    color: "#2c3e50",
    fontWeight: "500",
  },
  statusBadge: {
    backgroundColor: "#a8e6cf",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  inTransitBadge: {
    backgroundColor: "#ffd93d",
  },
  deliveryStatusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2c3e50",
  },
});