
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SystemMetrics {
  platform: {
    totalUsers: number;
    activeUsers: number;
    onlineDrivers: number;
    activeMerchants: number;
    systemUptime: number;
    serverHealth: string;
  };
  transactions: {
    totalTransactions: number;
    todayTransactions: number;
    pendingTransactions: number;
    disputedTransactions: number;
    totalVolume: number;
    escrowBalance: number;
  };
  security: {
    fraudAlerts: number;
    suspiciousActivities: number;
    blockedUsers: number;
    securityIncidents: number;
  };
}

export default function AdminControlCenter() {
  const router = useRouter();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    platform: {
      totalUsers: 12543,
      activeUsers: 1845,
      onlineDrivers: 234,
      activeMerchants: 456,
      systemUptime: 172800, // 48 hours in seconds
      serverHealth: 'Excellent'
    },
    transactions: {
      totalTransactions: 98765,
      todayTransactions: 342,
      pendingTransactions: 23,
      disputedTransactions: 5,
      totalVolume: 15780000,
      escrowBalance: 2340000
    },
    security: {
      fraudAlerts: 3,
      suspiciousActivities: 8,
      blockedUsers: 12,
      securityIncidents: 1
    }
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    
    loadSystemMetrics();
    
    return () => subscription?.remove();
  }, []);

  const loadSystemMetrics = async () => {
    try {
      // In a real app, this would fetch from API
      // const response = await fetch('/api/admin/system-metrics');
      // const data = await response.json();
      // setSystemMetrics(data);
      
      // For now, using mock data
      console.log('System metrics loaded');
    } catch (error) {
      console.error('Error loading system metrics:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSystemMetrics();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'announcement':
        Alert.alert('Send Announcement', 'Platform announcement feature coming soon!');
        break;
      case 'maintenance':
        Alert.alert('Maintenance Mode', 'System maintenance controls coming soon!');
        break;
      case 'reports':
        router.push('/admin/reports');
        break;
      case 'escrow':
        router.push('/admin/escrow-management');
        break;
      case 'kyc':
        router.push('/admin/kyc-verification');
        break;
      case 'moderation':
        router.push('/admin/moderation');
        break;
      default:
        Alert.alert('Coming Soon', 'This feature is under development.');
    }
  };

  const MetricCard = ({ title, value, subtitle, icon, color }: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: string;
    color: string;
  }) => (
    <View style={[styles.metricCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricTitle}>{title}</Text>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricSubtitle}>{subtitle}</Text>
    </View>
  );

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
        <Text style={styles.headerTitle}>Admin Control Center</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* System Status Cards */}
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Active Users"
            value={systemMetrics.platform.activeUsers.toLocaleString()}
            subtitle={`${systemMetrics.platform.onlineDrivers} drivers online`}
            icon="people"
            color="#4ade80"
          />
          
          <MetricCard
            title="Escrow Balance"
            value={formatCurrency(systemMetrics.transactions.escrowBalance)}
            subtitle={`${systemMetrics.transactions.pendingTransactions} pending`}
            icon="card"
            color="#f59e0b"
          />
          
          <MetricCard
            title="Security Alerts"
            value={systemMetrics.security.fraudAlerts}
            subtitle={`${systemMetrics.security.securityIncidents} incidents today`}
            icon="shield-checkmark"
            color="#ef4444"
          />
          
          <MetricCard
            title="System Health"
            value={systemMetrics.platform.serverHealth}
            subtitle={`Uptime: ${formatUptime(systemMetrics.platform.systemUptime)}`}
            icon="pulse"
            color="#8b5cf6"
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'transactions', label: 'Transactions' },
            { key: 'security', label: 'Security' },
            { key: 'actions', label: 'Quick Actions' }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.activeTab
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            <View style={styles.overviewCard}>
              <Text style={styles.cardTitle}>Real-time Activity</Text>
              <View style={styles.activityItem}>
                <Text style={styles.activityLabel}>Today's Transactions</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{systemMetrics.transactions.todayTransactions}</Text>
                </View>
              </View>
              <View style={styles.activityItem}>
                <Text style={styles.activityLabel}>Active Merchants</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{systemMetrics.platform.activeMerchants}</Text>
                </View>
              </View>
              <View style={styles.activityItem}>
                <Text style={styles.activityLabel}>Online Drivers</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{systemMetrics.platform.onlineDrivers}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'actions' && (
          <View style={styles.tabContent}>
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => handleQuickAction('escrow')}
              >
                <Ionicons name="shield-checkmark" size={32} color="#4682B4" />
                <Text style={styles.actionTitle}>Escrow Management</Text>
                <Text style={styles.actionDescription}>Manage escrow transactions</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => handleQuickAction('kyc')}
              >
                <Ionicons name="document-text" size={32} color="#4682B4" />
                <Text style={styles.actionTitle}>KYC Verification</Text>
                <Text style={styles.actionDescription}>Review user documents</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => handleQuickAction('moderation')}
              >
                <Ionicons name="eye" size={32} color="#4682B4" />
                <Text style={styles.actionTitle}>Content Moderation</Text>
                <Text style={styles.actionDescription}>Review reported content</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => handleQuickAction('announcement')}
              >
                <Ionicons name="megaphone" size={32} color="#4682B4" />
                <Text style={styles.actionTitle}>Send Announcement</Text>
                <Text style={styles.actionDescription}>Platform-wide notifications</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => handleQuickAction('maintenance')}
              >
                <Ionicons name="settings" size={32} color="#4682B4" />
                <Text style={styles.actionTitle}>Maintenance Mode</Text>
                <Text style={styles.actionDescription}>System maintenance controls</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => handleQuickAction('reports')}
              >
                <Ionicons name="bar-chart" size={32} color="#4682B4" />
                <Text style={styles.actionTitle}>Generate Reports</Text>
                <Text style={styles.actionDescription}>Analytics and reports</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
    refreshButton: {
      padding: Math.max(8, width * 0.02),
    },
    content: {
      flex: 1,
      backgroundColor: "white",
      borderTopLeftRadius: 35,
      borderTopRightRadius: 35,
      paddingTop: Math.max(24, height * 0.03),
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: Math.max(16, width * 0.05),
      gap: Math.max(12, width * 0.03),
      marginBottom: 24,
    },
    metricCard: {
      width: isTablet ? '47%' : '100%',
      backgroundColor: 'white',
      padding: Math.max(16, width * 0.04),
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      marginBottom: isTablet ? 0 : 12,
    },
    metricHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    metricTitle: {
      fontSize: isTablet ? 14 : isSmallScreen ? 12 : 13,
      fontWeight: '600',
      color: '#6b7280',
    },
    metricValue: {
      fontSize: isTablet ? 24 : isSmallScreen ? 18 : 20,
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: 4,
    },
    metricSubtitle: {
      fontSize: isTablet ? 12 : isSmallScreen ? 10 : 11,
      color: '#9ca3af',
    },
    tabs: {
      flexDirection: 'row',
      paddingHorizontal: Math.max(16, width * 0.05),
      marginBottom: 16,
      gap: 8,
    },
    tab: {
      flex: 1,
      paddingVertical: Math.max(10, height * 0.012),
      paddingHorizontal: Math.max(12, width * 0.03),
      borderRadius: 20,
      backgroundColor: '#f3f4f6',
      alignItems: 'center',
    },
    activeTab: {
      backgroundColor: '#4682B4',
    },
    tabText: {
      fontSize: isTablet ? 14 : isSmallScreen ? 11 : 12,
      fontWeight: '500',
      color: '#6b7280',
    },
    activeTabText: {
      color: 'white',
    },
    tabContent: {
      paddingHorizontal: Math.max(16, width * 0.05),
      paddingBottom: Math.max(32, height * 0.04),
    },
    overviewCard: {
      backgroundColor: 'white',
      padding: Math.max(16, width * 0.04),
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cardTitle: {
      fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
      fontWeight: '600',
      color: '#111827',
      marginBottom: 16,
    },
    activityItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#f3f4f6',
    },
    activityLabel: {
      fontSize: isTablet ? 14 : isSmallScreen ? 12 : 13,
      color: '#6b7280',
    },
    badge: {
      backgroundColor: '#dbeafe',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    badgeText: {
      fontSize: isTablet ? 12 : isSmallScreen ? 10 : 11,
      fontWeight: '600',
      color: '#2563eb',
    },
    actionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Math.max(12, width * 0.03),
    },
    actionCard: {
      width: isTablet ? '31%' : '47%',
      backgroundColor: 'white',
      padding: Math.max(16, width * 0.04),
      borderRadius: 12,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      minHeight: 120,
      justifyContent: 'center',
    },
    actionTitle: {
      fontSize: isTablet ? 14 : isSmallScreen ? 11 : 12,
      fontWeight: '600',
      color: '#111827',
      marginTop: 8,
      textAlign: 'center',
    },
    actionDescription: {
      fontSize: isTablet ? 12 : isSmallScreen ? 10 : 11,
      color: '#6b7280',
      marginTop: 4,
      textAlign: 'center',
    },
  });
};
