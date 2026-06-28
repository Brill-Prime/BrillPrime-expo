
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function MyOrders() {
  const router = useRouter();

  return (
    <LinearGradient colors={['#0B1A51', '#1e3a8a']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.centerContent}>
          <Ionicons name="cube-outline" size={80} color="#4682B4" />
          <Text style={styles.title}>Track Your Orders</Text>
          <Text style={styles.description}>
            View and manage all your orders in one place
          </Text>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => router.push('/orders/consumer-orders')}
          >
            <Text style={styles.viewButtonText}>View Orders</Text>
          </TouchableOpacity>
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
  viewButton: {
    backgroundColor: '#4682B4',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  viewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
