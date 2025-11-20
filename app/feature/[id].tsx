
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function FeaturePage() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const getFeatureDetails = (featureId: string) => {
    const features: Record<string, any> = {
      'browse-commodities': {
        icon: 'bag-handle',
        title: 'Browse Products',
        description: 'Discover amazing products from various merchants in your area',
        route: '/commodity/commodities',
      },
      'my-orders': {
        icon: 'cube',
        title: 'My Orders',
        description: 'Track and manage all your orders in real-time',
        route: '/orders/consumer-orders',
      },
      'messages': {
        icon: 'chatbubbles',
        title: 'Messages',
        description: 'Chat with merchants and drivers about your orders',
        route: '/messages',
      },
      'favorites': {
        icon: 'heart',
        title: 'Favorites',
        description: 'Quick access to your favorite products and merchants',
        route: '/favorites',
      },
      'support': {
        icon: 'headset',
        title: 'Customer Support',
        description: 'Get help from our support team 24/7',
        route: '/support',
      },
      'notifications': {
        icon: 'notifications',
        title: 'Notifications',
        description: 'Stay updated with order status and promotions',
        route: '/notifications',
      },
      'wallet': {
        icon: 'wallet',
        title: 'Wallet',
        description: 'Manage your payment methods and transaction history',
        route: '/payment',
      },
      'profile': {
        icon: 'person',
        title: 'Profile',
        description: 'Manage your account settings and preferences',
        route: '/profile',
      },
      'analytics': {
        icon: 'stats-chart',
        title: 'Analytics',
        description: 'View detailed insights and performance metrics',
        route: '/merchant/analytics',
      },
      'inventory': {
        icon: 'cube-outline',
        title: 'Inventory',
        description: 'Manage your products and stock levels',
        route: '/merchant/commodities',
      },
    };

    return features[featureId] || {
      icon: 'information-circle',
      title: 'Feature Details',
      description: 'Explore this feature to enhance your experience',
      route: null,
    };
  };

  const feature = getFeatureDetails(id as string);

  const handleAction = () => {
    if (feature.route) {
      router.push(feature.route);
    }
  };

  return (
    <LinearGradient colors={['#0B1A51', '#1e3a8a']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{feature.title}</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.centerContent}>
          <Ionicons name={feature.icon as any} size={80} color="#4682B4" />
          <Text style={styles.title}>{feature.title}</Text>
          <Text style={styles.description}>{feature.description}</Text>
          {feature.route && (
            <TouchableOpacity style={styles.actionButton} onPress={handleAction}>
              <Text style={styles.actionButtonText}>Get Started</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingTop: 30,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 20,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 30,
  },
  actionButton: {
    backgroundColor: '#4682B4',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
