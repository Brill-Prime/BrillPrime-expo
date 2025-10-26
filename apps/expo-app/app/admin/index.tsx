
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdminDashboard() {
  const router = useRouter();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [adminUser, setAdminUser] = useState({
    name: 'Admin User',
    email: 'admin@brillprime.com',
    role: 'Super Admin'
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    
    checkAdminAccess();
    
    return () => subscription?.remove();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const [adminToken, adminTokenExpiry] = await AsyncStorage.multiGet([
        'adminToken',
        'adminTokenExpiry'
      ]);

      const isTokenExpired = adminTokenExpiry[1] 
        ? Date.now() > parseInt(adminTokenExpiry[1]) 
        : true;

      if (!adminToken[1] || isTokenExpired) {
        Alert.alert('Session Expired', 'Please sign in to access admin panel', [
          { text: 'OK', onPress: () => router.replace('/admin/auth') }
        ]);
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      router.replace('/admin/auth');
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of admin panel?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                'adminToken', 
                'adminEmail', 
                'adminRole', 
                'adminTokenExpiry'
              ]);
              router.replace('/admin/auth');
            } catch (error) {
              console.error('Error signing out:', error);
            }
          }
        }
      ]
    );
  };

  const adminFeatures = [
    {
      title: 'Control Center',
      description: 'System overview and management',
      icon: 'speedometer',
      route: '/admin/control-center',
      color: 'rgb(11, 26, 81)'
    },
    {
      title: 'Escrow Management',
      description: 'Monitor payment transactions',
      icon: 'shield-checkmark',
      route: '/admin/escrow-management',
      color: 'rgb(11, 26, 81)'
    },
    {
      title: 'KYC Verification',
      description: 'Review user documents',
      icon: 'document-text',
      route: '/admin/kyc-verification',
      color: 'rgb(11, 26, 81)'
    },
    {
      title: 'Content Moderation',
      description: 'Review reported content',
      icon: 'eye',
      route: '/admin/moderation',
      color: 'rgb(11, 26, 81)'
    },
    {
      title: 'User Management',
      description: 'Manage user accounts',
      icon: 'people',
      route: '/admin/users',
      color: 'rgb(11, 26, 81)'
    },
    {
      title: 'Analytics & Reports',
      description: 'Platform insights',
      icon: 'bar-chart',
      route: '/admin/analytics',
      color: 'rgb(11, 26, 81)'
    }
  ];

  const styles = getResponsiveStyles(screenData);

  return (
    <LinearGradient
      colors={['rgb(11, 26, 81)', '#1e3a8a']}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={20} color="white" />
          </View>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.adminName}>{adminUser.name}</Text>
            <Text style={styles.adminRole}>{adminUser.role}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Admin Panel</Text>
        <Text style={styles.sectionDescription}>
          Manage and monitor the BrillPrime platform
        </Text>

        <View style={styles.featuresGrid}>
          {adminFeatures.map((feature, index) => (
            <TouchableOpacity
              key={index}
              style={styles.featureCard}
              onPress={() => router.push(feature.route as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.featureIcon, { backgroundColor: feature.color }]}>
                <Ionicons name={feature.icon as any} size={28} color="white" />
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.quickStats}>
          <Text style={styles.quickStatsTitle}>Quick Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>15,234</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>₦2.3M</Text>
              <Text style={styles.statLabel}>Escrow Balance</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>23</Text>
              <Text style={styles.statLabel}>Pending KYC</Text>
            </View>
          </View>
        </View>
      </View>
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
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    adminBadge: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    welcomeText: {
      fontSize: isTablet ? 14 : isSmallScreen ? 11 : 12,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    adminName: {
      fontSize: isTablet ? 20 : isSmallScreen ? 16 : 18,
      fontWeight: "bold",
      color: "white",
    },
    adminRole: {
      fontSize: isTablet ? 12 : isSmallScreen ? 10 : 11,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    signOutButton: {
      padding: Math.max(8, width * 0.02),
    },
    content: {
      flex: 1,
      backgroundColor: "white",
      borderTopLeftRadius: 35,
      borderTopRightRadius: 35,
      paddingTop: Math.max(24, height * 0.03),
      paddingHorizontal: Math.max(16, width * 0.05),
    },
    sectionTitle: {
      fontSize: isTablet ? 24 : isSmallScreen ? 18 : 20,
      fontWeight: "bold",
      color: "#111827",
      marginBottom: 8,
    },
    sectionDescription: {
      fontSize: isTablet ? 14 : isSmallScreen ? 12 : 13,
      color: "#6b7280",
      marginBottom: 24,
    },
    featuresGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Math.max(12, width * 0.03),
      marginBottom: 32,
    },
    featureCard: {
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
      minHeight: 140,
      justifyContent: 'center',
    },
    featureIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    featureTitle: {
      fontSize: isTablet ? 14 : isSmallScreen ? 11 : 12,
      fontWeight: '600',
      color: '#111827',
      marginBottom: 4,
      textAlign: 'center',
    },
    featureDescription: {
      fontSize: isTablet ? 12 : isSmallScreen ? 10 : 11,
      color: '#6b7280',
      textAlign: 'center',
      lineHeight: 16,
    },
    quickStats: {
      backgroundColor: '#f8f9fa',
      padding: Math.max(16, width * 0.04),
      borderRadius: 12,
      marginBottom: Math.max(32, height * 0.04),
    },
    quickStatsTitle: {
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      fontWeight: '600',
      color: '#111827',
      marginBottom: 16,
      textAlign: 'center',
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: isTablet ? 20 : isSmallScreen ? 16 : 18,
      fontWeight: 'bold',
      color: 'rgb(11, 26, 81)',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: isTablet ? 12 : isSmallScreen ? 10 : 11,
      color: '#6b7280',
    },
  });
};
