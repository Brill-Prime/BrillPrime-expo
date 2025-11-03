import { withRoleAccess } from '../../components/withRoleAccess';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../config/theme';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface EarningsData {
  today: number;
  week: number;
  month: number;
  total: number;
  trips: {
    date: string;
    amount: number;
    orderId: string;
    distance: string;
    duration: string;
  }[];
  statistics: {
    totalTrips: number;
    avgEarningsPerTrip: number;
    totalDistance: string;
    totalHours: number;
  };
}

function DriverEarningsDetails() {
  const router = useRouter();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('week');
  const [earnings, setEarnings] = useState<EarningsData>({
    today: 0,
    week: 0,
    month: 0,
    total: 0,
    trips: [],
    statistics: {
      totalTrips: 0,
      avgEarningsPerTrip: 0,
      totalDistance: '0 km',
      totalHours: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    loadEarningsData();
    return () => subscription?.remove();
  }, []);

  const loadEarningsData = async () => {
    setLoading(true);
    try {
      // Import driverService dynamically
      const { driverService } = await import('../../services/driverService');
      
      // Fetch real earnings data from Supabase
      const response = await driverService.getEarningsData();
      
      if (response.success && response.data) {
        setEarnings(response.data);
      } else {
        console.error('Error fetching earnings:', response.error);
        // Keep empty state on error
      }
    } catch (error) {
      console.error('Error loading earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const getCurrentPeriodAmount = () => {
    // This assumes that the keys in the earnings object match the selectedPeriod state
    // and that the 'total' property is handled separately if needed.
    // If 'total' is a valid period, add it to the union type for selectedPeriod.
    if (selectedPeriod === 'today') return earnings.today;
    if (selectedPeriod === 'week') return earnings.week;
    if (selectedPeriod === 'month') return earnings.month;
    return earnings.total; // Fallback or handle 'all' period if added
  };

  const styles = getResponsiveStyles(screenData);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading earnings data...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Period Selector */}
          <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'today' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('today')}
          >
            <Text style={[styles.periodButtonText, selectedPeriod === 'today' && styles.periodButtonTextActive]}>
              Today
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('week')}
          >
            <Text style={[styles.periodButtonText, selectedPeriod === 'week' && styles.periodButtonTextActive]}>
              This Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text style={[styles.periodButtonText, selectedPeriod === 'month' && styles.periodButtonTextActive]}>
              This Month
            </Text>
          </TouchableOpacity>
        </View>

        {/* Total Earnings Card */}
        <Card style={styles.totalCard}>
          <CardContent>
            <Text style={styles.totalLabel}>Total Earnings</Text>
            <Text style={styles.totalAmount}>{formatCurrency(getCurrentPeriodAmount())}</Text>
            <View style={styles.growthContainer}>
              <Ionicons name="trending-up" size={16} color={theme.colors.success} />
              <Text style={styles.growthText}>+12.5% from last {selectedPeriod}</Text>
            </View>
          </CardContent>
        </Card>

        {/* Statistics Grid */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <CardContent>
              <Ionicons name="car" size={24} color={theme.colors.primary} />
              <Text style={styles.statValue}>{earnings.statistics.totalTrips}</Text>
              <Text style={styles.statLabel}>Total Trips</Text>
            </CardContent>
          </Card>

          <Card style={styles.statCard}>
            <CardContent>
              <Ionicons name="cash" size={24} color={theme.colors.success} />
              <Text style={styles.statValue}>{formatCurrency(earnings.statistics.avgEarningsPerTrip)}</Text>
              <Text style={styles.statLabel}>Avg/Trip</Text>
            </CardContent>
          </Card>

          <Card style={styles.statCard}>
            <CardContent>
              <Ionicons name="navigate" size={24} color={theme.colors.info} />
              <Text style={styles.statValue}>{earnings.statistics.totalDistance}</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </CardContent>
          </Card>

          <Card style={styles.statCard}>
            <CardContent>
              <Ionicons name="time" size={24} color={theme.colors.warning} />
              <Text style={styles.statValue}>{earnings.statistics.totalHours}h</Text>
              <Text style={styles.statLabel}>Hours</Text>
            </CardContent>
          </Card>
        </View>

        {/* Recent Trips */}
        <Card style={styles.tripsCard}>
          <CardHeader>
            <CardTitle>Recent Trips</CardTitle>
          </CardHeader>
          <CardContent>
            {earnings.trips.map((trip, index) => (
              <TouchableOpacity
                key={index}
                style={styles.tripItem}
                onPress={() => router.push(`/orders/order-details?orderId=${trip.orderId}`)}
              >
                <View style={styles.tripLeft}>
                  <View style={styles.tripIconContainer}>
                    <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
                  </View>
                  <View style={styles.tripInfo}>
                    <Text style={styles.tripOrderId}>{trip.orderId}</Text>
                    <Text style={styles.tripDetails}>
                      {trip.distance} • {trip.duration}
                    </Text>
                    <Text style={styles.tripDate}>{trip.date}</Text>
                  </View>
                </View>
                <Text style={styles.tripAmount}>{formatCurrency(trip.amount)}</Text>
              </TouchableOpacity>
            ))}
          </CardContent>
        </Card>

        {/* Withdrawal Button */}
        <TouchableOpacity style={styles.withdrawButton} onPress={() => router.push('/payment/add-bank-details')}>
          <Ionicons name="wallet" size={20} color="#fff" />
          <Text style={styles.withdrawButtonText}>Withdraw Earnings</Text>
        </TouchableOpacity>
      </ScrollView>
      )}
    </SafeAreaView>
  );
}

const getResponsiveStyles = (screenData: any) => {
  const { width } = screenData;
  const isTablet = width >= 768;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.backgroundSecondary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.base,
      backgroundColor: theme.colors.primary,
    },
    backButton: {
      padding: theme.spacing.sm,
    },
    headerTitle: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: 'bold',
      color: '#fff',
      fontFamily: theme.typography.fontFamily.bold,
    },
    filterButton: {
      padding: theme.spacing.sm,
    },
    content: {
      flex: 1,
      padding: theme.spacing.base,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    loadingText: {
      marginTop: theme.spacing.base,
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily.regular,
    },
    periodSelector: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    periodButton: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.white,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    periodButtonActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    periodButtonText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text,
      fontFamily: theme.typography.fontFamily.medium,
    },
    periodButtonTextActive: {
      color: '#fff',
      fontFamily: theme.typography.fontFamily.semiBold,
    },
    totalCard: {
      marginBottom: theme.spacing.lg,
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    totalLabel: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily.regular,
      marginBottom: theme.spacing.xs,
    },
    totalAmount: {
      fontSize: isTablet ? 48 : 36,
      fontWeight: 'bold',
      color: theme.colors.primary,
      fontFamily: theme.typography.fontFamily.bold,
      marginBottom: theme.spacing.sm,
    },
    growthContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    growthText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.success,
      fontFamily: theme.typography.fontFamily.medium,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    statCard: {
      width: isTablet ? '48%' : '100%', // Adjusted for better spacing on tablets and single column on smaller screens
      padding: theme.spacing.base,
      alignItems: 'center',
    },
    statValue: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: 'bold',
      color: theme.colors.text,
      fontFamily: theme.typography.fontFamily.bold,
      marginTop: theme.spacing.sm,
    },
    statLabel: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily.regular,
      marginTop: theme.spacing.xs,
    },
    tripsCard: {
      marginBottom: theme.spacing.xl,
    },
    tripItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    tripLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    tripIconContainer: {
      marginRight: theme.spacing.md,
    },
    tripInfo: {
      flex: 1,
    },
    tripOrderId: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: '600',
      color: theme.colors.text,
      fontFamily: theme.typography.fontFamily.semiBold,
    },
    tripDetails: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily.regular,
      marginTop: theme.spacing.xs,
    },
    tripDate: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.textLight,
      fontFamily: theme.typography.fontFamily.regular,
      marginTop: theme.spacing.xs,
    },
    tripAmount: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: 'bold',
      color: theme.colors.success,
      fontFamily: theme.typography.fontFamily.bold,
    },
    withdrawButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      padding: theme.spacing.base,
      borderRadius: theme.borderRadius.lg,
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.xl,
    },
    withdrawButtonText: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: 'bold',
      color: '#fff',
      fontFamily: theme.typography.fontFamily.bold,
    },
  });
};

export default withRoleAccess(DriverEarningsDetails, {
  requiredRole: 'driver',
  fallbackRoute: '/home/consumer',
  showUnauthorizedMessage: true,
});