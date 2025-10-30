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

// Mock adminService for demonstration purposes. In a real app, this would interact with your backend.
const adminService = {
  emergencyShutdown: async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, error: null };
  },
  clearSystemCache: async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  },
  restartServices: async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  },
  backupDatabase: async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  }
};

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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });

    loadSystemMetrics();

    return () => subscription?.remove();
  }, []);

  const loadSystemMetrics = async () => {
    try {
      // In a real app, you would fetch from an API. For now, we'll use mock data.
      // const token = await AsyncStorage.getItem('adminToken');
      // const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://api.brillprime.com'}/api/admin/system-metrics`, {
      //   headers: {
      //     'Authorization': `Bearer ${token}`
      //   }
      // });
      //
      // if (response.ok) {
      //   const data = await response.json();
      //   setSystemMetrics(data);
      // } else {
      //   console.log('Using mock system metrics');
      // }
      console.log('Using mock system metrics');
    } catch (error) {
      console.error('Error loading system metrics:', error);
      // Continue using mock data as fallback
    }
  };

  const fetchControlData = async () => {
    // Placeholder for a function that reloads all necessary data for control center
    await loadSystemMetrics();
    // Add other data fetching functions here as needed
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchControlData();
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

  const handleQuickAction = async (action: string) => {
    switch (action) {
      case 'announcement':
        Alert.prompt(
          'Send Announcement',
          'Enter your announcement message:',
          async (text) => {
            if (text) {
              try {
                // Placeholder for sending announcement via API
                console.log('Sending announcement:', text);
                Alert.alert('Success', 'Announcement sent (simulated)');
              } catch (error) {
                console.error('Send announcement error:', error);
                Alert.alert('Error', 'Failed to send announcement');
              }
            }
          }
        );
        break;
      case 'maintenance':
        Alert.alert(
          'Maintenance Mode',
          'Enable maintenance mode?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Enable',
              onPress: async () => {
                // Placeholder for enabling maintenance mode via API
                console.log('Enabling maintenance mode...');
                Alert.alert('Success', 'Maintenance mode enabled (simulated)');
              }
            }
          ]
        );
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

  const handleSystemAction = async (action: string) => {
    switch (action) {
      case 'Emergency Shutdown':
        Alert.alert(
          'Emergency Shutdown',
          'This will disable all system operations. Are you sure?',
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Confirm',
              style: 'destructive',
              onPress: async () => {
                try {
                  setIsLoading(true);
                  const response = await adminService.emergencyShutdown();
                  if (response.success) {
                    Alert.alert('Success', 'System shutdown initiated.');
                  } else {
                    Alert.alert('Error', response.error || 'Failed to shutdown system');
                  }
                } catch (error) {
                  Alert.alert('Error', 'Failed to execute emergency shutdown');
                } finally {
                  setIsLoading(false);
                }
              }
            }
          ]
        );
        break;
      case 'Clear Cache':
        try {
          setIsLoading(true);
          await adminService.clearSystemCache();
          Alert.alert('Success', 'System cache cleared successfully');
          fetchControlData();
        } catch (error) {
          Alert.alert('Error', 'Failed to clear cache');
        } finally {
          setIsLoading(false);
        }
        break;
      case 'Restart Services':
        Alert.alert(
          'Restart Services',
          'This will restart all backend services. Continue?',
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Restart',
              onPress: async () => {
                try {
                  setIsLoading(true);
                  await adminService.restartServices();
                  Alert.alert('Success', 'Services restarted successfully');
                  fetchControlData();
                } catch (error) {
                  Alert.alert('Error', 'Failed to restart services');
                } finally {
                  setIsLoading(false);
                }
              }
            }
          ]
        );
        break;
      case 'View Logs':
        router.push('/admin/system-logs');
        break;
      case 'Backup Database':
        try {
          setIsLoading(true);
          const response = await adminService.backupDatabase();
          if (response.success) {
            Alert.alert('Success', 'Database backup completed successfully');
          } else {
            Alert.alert('Error', 'Failed to backup database');
          }
        } catch (error) {
          Alert.alert('Error', 'Failed to backup database');
        } finally {
          setIsLoading(false);
        }
        break;
      default:
        Alert.alert('Action', `Executing ${action}...`);
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

  const SystemActionButton = ({ title, icon, color, actionType, actionName }: {
    title: string;
    icon: string;
    color: string;
    actionType: 'quick' | 'system';
    actionName: string;
  }) => (
    <TouchableOpacity
      style={styles.actionCard}
      onPress={() => actionType === 'quick' ? handleQuickAction(actionName) : handleSystemAction(actionName)}
    >
      <Ionicons name={icon as any} size={32} color={color} />
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionDescription}>{`Perform ${title}`}</Text>
    </TouchableOpacity>
  );

  const styles = getResponsiveStyles(screenData);

  return (
    <LinearGradient
      colors={['rgb(11, 26, 81)', '#1e3a8a']}
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

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}

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
            { key: 'actions', label: 'Quick Actions' },
            { key: 'system', label: 'System Actions' }
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

        {activeTab === 'transactions' && (
          <View style={styles.tabContent}>
            <View style={styles.overviewCard}>
              <Text style={styles.cardTitle}>Transaction Metrics</Text>
              <View style={styles.activityItem}>
                <Text style={styles.activityLabel}>Total Transactions</Text>
                <Text style={styles.activityLabel}>{systemMetrics.transactions.totalTransactions.toLocaleString()}</Text>
              </View>
              <View style={styles.activityItem}>
                <Text style={styles.activityLabel}>Pending Transactions</Text>
                <Text style={styles.activityLabel}>{systemMetrics.transactions.pendingTransactions}</Text>
              </View>
              <View style={styles.activityItem}>
                <Text style={styles.activityLabel}>Disputed Transactions</Text>
                <Text style={styles.activityLabel}>{systemMetrics.transactions.disputedTransactions}</Text>
              </View>
              <View style={styles.activityItem}>
                <Text style={styles.activityLabel}>Total Volume</Text>
                <Text style={styles.activityLabel}>{formatCurrency(systemMetrics.transactions.totalVolume)}</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'security' && (
          <View style={styles.tabContent}>
            <View style={styles.overviewCard}>
              <Text style={styles.cardTitle}>Security Overview</Text>
              <View style={styles.activityItem}>
                <Text style={styles.activityLabel}>Fraud Alerts</Text>
                <Text style={styles.activityLabel}>{systemMetrics.security.fraudAlerts}</Text>
              </View>
              <View style={styles.activityItem}>
                <Text style={styles.activityLabel}>Suspicious Activities</Text>
                <Text style={styles.activityLabel}>{systemMetrics.security.suspiciousActivities}</Text>
              </View>
              <View style={styles.activityItem}>
                <Text style={styles.activityLabel}>Blocked Users</Text>
                <Text style={styles.activityLabel}>{systemMetrics.security.blockedUsers}</Text>
              </View>
              <View style={styles.activityItem}>
                <Text style={styles.activityLabel}>Security Incidents</Text>
                <Text style={styles.activityLabel}>{systemMetrics.security.securityIncidents}</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'actions' && (
          <View style={styles.tabContent}>
            <View style={styles.actionsGrid}>
              <SystemActionButton
                title="Escrow Management"
                icon="shield-checkmark"
                color="rgb(11, 26, 81)"
                actionType="quick"
                actionName="escrow"
              />

              <SystemActionButton
                title="KYC Verification"
                icon="document-text"
                color="rgb(11, 26, 81)"
                actionType="quick"
                actionName="kyc"
              />

              <SystemActionButton
                title="Content Moderation"
                icon="eye"
                color="rgb(11, 26, 81)"
                actionType="quick"
                actionName="moderation"
              />

              <SystemActionButton
                title="Send Announcement"
                icon="megaphone"
                color="rgb(11, 26, 81)"
                actionType="quick"
                actionName="announcement"
              />

              <SystemActionButton
                title="Maintenance Mode"
                icon="settings"
                color="rgb(11, 26, 81)"
                actionType="quick"
                actionName="maintenance"
              />

              <SystemActionButton
                title="Generate Reports"
                icon="bar-chart"
                color="rgb(11, 26, 81)"
                actionType="quick"
                actionName="reports"
              />
            </View>
          </View>
        )}
        {activeTab === 'system' && (
          <View style={styles.tabContent}>
            <View style={styles.actionsGrid}>
              <SystemActionButton
                title="Emergency Shutdown"
                icon="power"
                color="#ef4444"
                actionType="system"
                actionName="Emergency Shutdown"
              />
              <SystemActionButton
                title="Clear Cache"
                icon="trash"
                color="#f59e0b"
                actionType="system"
                actionName="Clear Cache"
              />
              <SystemActionButton
                title="Restart Services"
                icon="refresh-circle"
                color="#2563eb"
                actionType="system"
                actionName="Restart Services"
              />
              <SystemActionButton
                title="View Logs"
                icon="document-text"
                color="#6b7280"
                actionType="system"
                actionName="View Logs"
              />
              <SystemActionButton
                title="Backup Database"
                icon="save"
                color="#4ade80"
                actionType="system"
                actionName="Backup Database"
              />
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
      flexWrap: 'wrap', // Allow tabs to wrap on smaller screens
    },
    tab: {
      flex: 1, // This might need adjustment if tabs wrap
      minWidth: isTablet ? 100 : 80, // Ensure tabs have a minimum width
      paddingVertical: Math.max(10, height * 0.012),
      paddingHorizontal: Math.max(12, width * 0.03),
      borderRadius: 20,
      backgroundColor: '#f3f4f6',
      alignItems: 'center',
      justifyContent: 'center', // Center content if it wraps
    },
    activeTab: {
      backgroundColor: 'rgb(11, 26, 81)',
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
      justifyContent: 'center', // Center actions if they don't fill the row
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
      marginBottom: Math.max(12, width * 0.03), // Add margin for wrapping
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
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    loadingText: {
      color: 'white',
      fontSize: 20,
      fontWeight: 'bold',
    },
  });
};