
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { notificationService, ScheduledNotification } from '@/services/notificationService';

export default function ScheduledNotifications() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [scheduled, setScheduled] = useState<ScheduledNotification[]>([]);

  useEffect(() => {
    loadScheduled();
  }, []);

  const loadScheduled = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getScheduledNotifications();
      if (response.success && response.data) {
        setScheduled(response.data);
      }
    } catch (error) {
      console.error('Error loading scheduled notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelNotification = (id: string) => {
    Alert.alert(
      'Cancel Notification',
      'Are you sure you want to cancel this scheduled notification?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await notificationService.cancelScheduledNotification(id);
              if (response.success) {
                setScheduled(scheduled.filter((n) => n.id !== id));
              } else {
                Alert.alert('Error', response.error || 'Failed to cancel notification');
              }
            } catch (error) {
              console.error('Error cancelling notification:', error);
              Alert.alert('Error', 'Failed to cancel notification');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#ffc107';
      case 'sent':
        return '#28a745';
      case 'cancelled':
        return '#6c757d';
      default:
        return '#4682B4';
    }
  };

  return (
    <LinearGradient colors={['#0B1A51', '#1e3a8a']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scheduled Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4682B4" />
            </View>
          ) : scheduled.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={80} color="#ccc" />
              <Text style={styles.emptyTitle}>No Scheduled Notifications</Text>
              <Text style={styles.emptyDescription}>
                You don't have any scheduled notifications
              </Text>
            </View>
          ) : (
            scheduled.map((item) => (
              <View key={item.id} style={styles.notificationCard}>
                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <Text style={styles.notificationTitle}>{item.title}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(item.status) },
                      ]}
                    >
                      <Text style={styles.statusText}>{item.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.notificationMessage}>{item.message}</Text>
                  <View style={styles.notificationFooter}>
                    <Ionicons name="calendar" size={16} color="#7f8c8d" />
                    <Text style={styles.scheduledTime}>
                      {new Date(item.scheduledFor).toLocaleString()}
                    </Text>
                  </View>
                </View>
                {item.status === 'pending' && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => cancelNotification(item.id)}
                  >
                    <Ionicons name="close-circle" size={24} color="#e74c3c" />
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </ScrollView>
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
    padding: 16,
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 20,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 8,
  },
  notificationCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    gap: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
    textTransform: 'uppercase',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scheduledTime: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  cancelButton: {
    padding: 4,
  },
});
