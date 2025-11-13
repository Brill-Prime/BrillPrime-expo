
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { notificationService, NotificationSettings } from '@/services/notificationService';

export default function NotificationPreferences() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    pushNotifications: true,
    emailNotifications: true,
    orderUpdates: true,
    promotions: false,
    merchantUpdates: true,
    systemNotifications: true,
    categories: {
      order: { push: true, email: true, inApp: true },
      payment: { push: true, email: true, inApp: true },
      promo: { push: false, email: false, inApp: true },
      delivery: { push: true, email: true, inApp: true },
      system: { push: true, email: false, inApp: true },
      promotion: { push: false, email: false, inApp: true },
    },
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00',
    },
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getSettings();
      if (response.success && response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCategoryPreference = async (
    category: keyof NotificationSettings['categories'],
    channel: 'push' | 'email' | 'inApp',
    value: boolean
  ) => {
    const newSettings = {
      ...settings,
      categories: {
        ...settings.categories,
        [category]: {
          ...settings.categories[category],
          [channel]: value,
        },
      },
    };
    setSettings(newSettings);

    try {
      await notificationService.updateCategoryPreferences(category, newSettings.categories[category]);
    } catch (error) {
      console.error('Error updating preference:', error);
      Alert.alert('Error', 'Failed to update preference');
    }
  };

  const toggleQuietHours = async (enabled: boolean) => {
    const newSettings = {
      ...settings,
      quietHours: { ...settings.quietHours, enabled },
    };
    setSettings(newSettings);

    try {
      await notificationService.setQuietHours(
        enabled,
        settings.quietHours.startTime,
        settings.quietHours.endTime
      );
    } catch (error) {
      console.error('Error updating quiet hours:', error);
      Alert.alert('Error', 'Failed to update quiet hours');
    }
  };

  const saveAllSettings = async () => {
    try {
      setSaving(true);
      const response = await notificationService.updateSettings(settings);
      if (response.success) {
        Alert.alert('Success', 'Preferences saved successfully');
      } else {
        Alert.alert('Error', response.error || 'Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const CategoryPreference = ({
    title,
    category,
    icon,
  }: {
    title: string;
    category: keyof NotificationSettings['categories'];
    icon: string;
  }) => (
    <View style={styles.categoryCard}>
      <View style={styles.categoryHeader}>
        <Ionicons name={icon as any} size={24} color="#4682B4" />
        <Text style={styles.categoryTitle}>{title}</Text>
      </View>
      <View style={styles.channelRow}>
        <Text style={styles.channelLabel}>Push</Text>
        <Switch
          value={settings.categories[category].push}
          onValueChange={(value) => updateCategoryPreference(category, 'push', value)}
          trackColor={{ false: '#ccc', true: '#4682B4' }}
        />
      </View>
      <View style={styles.channelRow}>
        <Text style={styles.channelLabel}>Email</Text>
        <Switch
          value={settings.categories[category].email}
          onValueChange={(value) => updateCategoryPreference(category, 'email', value)}
          trackColor={{ false: '#ccc', true: '#4682B4' }}
        />
      </View>
      <View style={styles.channelRow}>
        <Text style={styles.channelLabel}>In-App</Text>
        <Switch
          value={settings.categories[category].inApp}
          onValueChange={(value) => updateCategoryPreference(category, 'inApp', value)}
          trackColor={{ false: '#ccc', true: '#4682B4' }}
        />
      </View>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient colors={['#0B1A51', '#1e3a8a']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="white" />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0B1A51', '#1e3a8a']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Preferences</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Notification Categories</Text>

          <CategoryPreference title="Order Updates" category="order" icon="cube-outline" />
          <CategoryPreference title="Payment & Billing" category="payment" icon="card-outline" />
          <CategoryPreference title="Delivery Status" category="delivery" icon="car-outline" />
          <CategoryPreference title="Promotions & Deals" category="promo" icon="gift-outline" />
          <CategoryPreference title="System Alerts" category="system" icon="settings-outline" />

          <Text style={styles.sectionTitle}>Quiet Hours</Text>
          <View style={styles.quietHoursCard}>
            <View style={styles.quietHoursHeader}>
              <Text style={styles.quietHoursTitle}>Do Not Disturb</Text>
              <Switch
                value={settings.quietHours.enabled}
                onValueChange={toggleQuietHours}
                trackColor={{ false: '#ccc', true: '#4682B4' }}
              />
            </View>
            {settings.quietHours.enabled && (
              <View style={styles.quietHoursTime}>
                <Text style={styles.timeLabel}>
                  {settings.quietHours.startTime} - {settings.quietHours.endTime}
                </Text>
                <Text style={styles.timeDescription}>
                  Notifications will be silenced during these hours
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={saveAllSettings}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Save All Preferences</Text>
            )}
          </TouchableOpacity>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 20,
    marginBottom: 12,
  },
  categoryCard: {
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
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  channelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  channelLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  quietHoursCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  quietHoursHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quietHoursTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  quietHoursTime: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4682B4',
    marginBottom: 4,
  },
  timeDescription: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  saveButton: {
    backgroundColor: '#4682B4',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
