
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../config/theme';

export default function Settings() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    locationTracking: true,
    autoAcceptOrders: false,
    soundAlerts: true,
    vibration: true,
    darkMode: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('userSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings: typeof settings) => {
    try {
      await AsyncStorage.setItem('userSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const toggleSetting = (key: keyof typeof settings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear the app cache? This will remove temporary files.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // Clear specific cache items
              await AsyncStorage.removeItem('cachedMerchants');
              await AsyncStorage.removeItem('cachedProducts');
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            const defaultSettings = {
              pushNotifications: true,
              emailNotifications: true,
              smsNotifications: false,
              locationTracking: true,
              autoAcceptOrders: false,
              soundAlerts: true,
              vibration: true,
              darkMode: false,
            };
            saveSettings(defaultSettings);
            Alert.alert('Success', 'Settings reset to default');
          },
        },
      ]
    );
  };

  const SettingItem = ({
    icon,
    title,
    description,
    value,
    onToggle,
  }: {
    icon: string;
    title: string;
    description?: string;
    value: boolean;
    onToggle: () => void;
  }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={24} color={theme.colors.primary} />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {description && <Text style={styles.settingDescription}>{description}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#ddd', true: theme.colors.primary }}
        thumbColor={value ? '#fff' : '#f4f3f4'}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <SettingItem
            icon="notifications"
            title="Push Notifications"
            description="Receive push notifications for orders and updates"
            value={settings.pushNotifications}
            onToggle={() => toggleSetting('pushNotifications')}
          />
          <SettingItem
            icon="mail"
            title="Email Notifications"
            description="Receive email updates"
            value={settings.emailNotifications}
            onToggle={() => toggleSetting('emailNotifications')}
          />
          <SettingItem
            icon="chatbubble"
            title="SMS Notifications"
            description="Receive SMS alerts for important updates"
            value={settings.smsNotifications}
            onToggle={() => toggleSetting('smsNotifications')}
          />
        </View>

        {/* App Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Preferences</Text>
          <SettingItem
            icon="location"
            title="Location Tracking"
            description="Enable location services for better delivery experience"
            value={settings.locationTracking}
            onToggle={() => toggleSetting('locationTracking')}
          />
          <SettingItem
            icon="volume-high"
            title="Sound Alerts"
            description="Play sound for new orders and messages"
            value={settings.soundAlerts}
            onToggle={() => toggleSetting('soundAlerts')}
          />
          <SettingItem
            icon="phone-portrait"
            title="Vibration"
            description="Vibrate on notifications"
            value={settings.vibration}
            onToggle={() => toggleSetting('vibration')}
          />
          <SettingItem
            icon="moon"
            title="Dark Mode"
            description="Use dark theme (coming soon)"
            value={settings.darkMode}
            onToggle={() => toggleSetting('darkMode')}
          />
        </View>

        {/* Driver Specific Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Driver Settings</Text>
          <SettingItem
            icon="checkmark-circle"
            title="Auto Accept Orders"
            description="Automatically accept delivery requests"
            value={settings.autoAcceptOrders}
            onToggle={() => toggleSetting('autoAcceptOrders')}
          />
        </View>

        {/* Data & Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Privacy</Text>
          <TouchableOpacity style={styles.actionItem} onPress={handleClearCache}>
            <View style={styles.settingLeft}>
              <Ionicons name="trash-outline" size={24} color={theme.colors.warning} />
              <Text style={styles.settingTitle}>Clear Cache</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textLight} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => router.push('/profile/privacy-settings')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="shield-checkmark" size={24} color={theme.colors.success} />
              <Text style={styles.settingTitle}>Privacy Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textLight} />
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.resetButton} onPress={handleResetSettings}>
            <Ionicons name="refresh" size={20} color={theme.colors.error} />
            <Text style={styles.resetButtonText}>Reset All Settings</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>Version 1.0.0</Text>
          <Text style={styles.infoText}>© 2024 BrillPrime</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '600',
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: theme.colors.white,
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  settingTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '500',
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text,
  },
  settingDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    marginVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  resetButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.error,
  },
  infoSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.xs,
  },
  infoText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textLight,
  },
});
