
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
        description: 'Discover amazing products from various merchants',
        route: '/commodity/commodities',
      },
      'my-orders': {
        icon: 'cube',
        title: 'My Orders',
        description: 'Track and manage your orders',
        route: '/orders/consumer-orders',
      },
      'messages': {
        icon: 'chatbubbles',
        title: 'Messages',
        description: 'Chat with merchants and drivers',
        route: '/chat',
      },
      'favorites': {
        icon: 'heart',
        title: 'Favorites',
        description: 'Your saved items',
        route: '/favorites',
      },
      'support': {
        icon: 'headset',
        title: 'Support',
        description: 'Get help anytime',
        route: '/support',
      },
    };

    return features[featureId] || {
      icon: 'information-circle',
      title: 'Feature',
      description: 'Feature coming soon',
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
