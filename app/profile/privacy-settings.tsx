
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PrivacySettings {
  dataCollection: boolean;
  analytics: boolean;
  marketingEmails: boolean;
  locationTracking: boolean;
  profileVisibility: boolean;
  activityStatus: boolean;
  orderHistory: boolean;
  shareWithPartners: boolean;
}

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<PrivacySettings>({
    dataCollection: true,
    analytics: true,
    marketingEmails: false,
    locationTracking: true,
    profileVisibility: true,
    activityStatus: true,
    orderHistory: true,
    shareWithPartners: false,
  });
  const [loading, setLoading] = useState(false);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    loadPrivacySettings();
    
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('privacySettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    }
  };

  const updateSetting = async (key: keyof PrivacySettings, value: boolean) => {
    // Special handling for critical settings
    if ((key === 'dataCollection' || key === 'locationTracking') && !value) {
      Alert.alert(
        'Important',
        `Disabling ${key === 'dataCollection' ? 'data collection' : 'location tracking'} may affect app functionality and your user experience. Are you sure you want to continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: () => updatePrivacySetting(key, value),
          }
        ]
      );
      return;
    }

    updatePrivacySetting(key, value);
  };

  const updatePrivacySetting = async (key: keyof PrivacySettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      await AsyncStorage.setItem('privacySettings', JSON.stringify(newSettings));
      
      // In a real app, you would sync with the server
      try {
        const { userService } = await import('../../services/userService');
        await userService.updatePrivacySettings(newSettings);
      } catch (apiError) {
        console.log('API call failed, but local settings updated:', apiError);
      }
    } catch (error) {
      console.error('Error saving privacy settings:', error);
    }
  };

  const handleDeleteAccountData = () => {
    Alert.alert(
      'Delete Account Data',
      'This will permanently delete all your personal data from our servers. This action cannot be undone. Are you sure you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Data',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Data Deletion Requested',
              'Your request has been submitted. You will receive an email confirmation within 24 hours, and your data will be deleted within 30 days as required by law.',
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'We will prepare your data and send you a download link via email within 48 hours.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Export',
          onPress: () => {
            Alert.alert('Export Requested', 'You will receive an email with your data export link soon.');
          }
        }
      ]
    );
  };

  const PrivacySection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  const PrivacyItem = ({ 
    icon, 
    title, 
    description, 
    value, 
    onToggle,
    isImportant = false
  }: {
    icon: string;
    title: string;
    description: string;
    value: boolean;
    onToggle: (value: boolean) => void;
    isImportant?: boolean;
  }) => (
    <View style={styles.privacyItem}>
      <View style={styles.privacyItemLeft}>
        <View style={[styles.privacyIcon, isImportant && styles.importantIcon]}>
          <Ionicons name={icon as any} size={22} color={isImportant ? "#e74c3c" : "#4682B4"} />
        </View>
        <View style={styles.privacyItemContent}>
          <Text style={styles.privacyItemTitle}>{title}</Text>
          <Text style={styles.privacyItemDescription}>{description}</Text>
        </View>
      </View>
      
      <Switch
        value={value}
        onValueChange={onToggle}
        thumbColor={value ? '#4682B4' : '#f4f3f4'}
        trackColor={{ false: '#767577', true: '#4682B481' }}
      />
    </View>
  );

  const ActionItem = ({ 
    icon, 
    title, 
    description, 
    onPress,
    isDangerous = false 
  }: {
    icon: string;
    title: string;
    description: string;
    onPress: () => void;
    isDangerous?: boolean;
  }) => (
    <TouchableOpacity style={styles.actionItem} onPress={onPress}>
      <View style={styles.privacyItemLeft}>
        <View style={[styles.privacyIcon, isDangerous && styles.dangerousIcon]}>
          <Ionicons name={icon as any} size={22} color={isDangerous ? "#e74c3c" : "#4682B4"} />
        </View>
        <View style={styles.privacyItemContent}>
          <Text style={[styles.privacyItemTitle, isDangerous && styles.dangerousText]}>
            {title}
          </Text>
          <Text style={styles.privacyItemDescription}>{description}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  const responsivePadding = Math.max(20, screenDimensions.width * 0.05);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: responsivePadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#1b1b1b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Data Collection */}
        <PrivacySection title="Data Collection">
          <PrivacyItem
            icon="analytics-outline"
            title="Data Collection"
            description="Allow us to collect usage data to improve our services"
            value={settings.dataCollection}
            onToggle={(value) => updateSetting('dataCollection', value)}
            isImportant={true}
          />
          <PrivacyItem
            icon="bar-chart-outline"
            title="Analytics"
            description="Help us understand how you use the app"
            value={settings.analytics}
            onToggle={(value) => updateSetting('analytics', value)}
          />
          <PrivacyItem
            icon="location-outline"
            title="Location Tracking"
            description="Allow precise location for delivery services"
            value={settings.locationTracking}
            onToggle={(value) => updateSetting('locationTracking', value)}
            isImportant={true}
          />
        </PrivacySection>

        {/* Communication */}
        <PrivacySection title="Communication">
          <PrivacyItem
            icon="mail-outline"
            title="Marketing Emails"
            description="Receive promotional emails and offers"
            value={settings.marketingEmails}
            onToggle={(value) => updateSetting('marketingEmails', value)}
          />
          <PrivacyItem
            icon="business-outline"
            title="Share with Partners"
            description="Allow sharing anonymized data with trusted partners"
            value={settings.shareWithPartners}
            onToggle={(value) => updateSetting('shareWithPartners', value)}
          />
        </PrivacySection>

        {/* Profile & Activity */}
        <PrivacySection title="Profile & Activity">
          <PrivacyItem
            icon="eye-outline"
            title="Profile Visibility"
            description="Make your profile visible to merchants"
            value={settings.profileVisibility}
            onToggle={(value) => updateSetting('profileVisibility', value)}
          />
          <PrivacyItem
            icon="pulse-outline"
            title="Activity Status"
            description="Show when you're active in the app"
            value={settings.activityStatus}
            onToggle={(value) => updateSetting('activityStatus', value)}
          />
          <PrivacyItem
            icon="time-outline"
            title="Order History"
            description="Keep detailed history of your orders"
            value={settings.orderHistory}
            onToggle={(value) => updateSetting('orderHistory', value)}
          />
        </PrivacySection>

        {/* Data Management */}
        <PrivacySection title="Data Management">
          <ActionItem
            icon="download-outline"
            title="Export My Data"
            description="Download a copy of your personal data"
            onPress={handleExportData}
          />
          <ActionItem
            icon="trash-outline"
            title="Delete Account Data"
            description="Permanently delete all your data"
            onPress={handleDeleteAccountData}
            isDangerous={true}
          />
        </PrivacySection>

        {/* Privacy Info */}
        <View style={[styles.infoSection, { marginHorizontal: responsivePadding }]}>
          <Ionicons name="information-circle-outline" size={20} color="#4682B4" />
          <Text style={styles.infoText}>
            Your privacy is important to us. These settings give you control over how your data is used. 
            For more details, see our Privacy Policy.
          </Text>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 15,
    backgroundColor: '#f5f5f5',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1b1b1b',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1b1b1b',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionContent: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  privacyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  privacyIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#f8f9ff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  importantIcon: {
    backgroundColor: '#fff5f5',
  },
  dangerousIcon: {
    backgroundColor: '#fff5f5',
  },
  privacyItemContent: {
    flex: 1,
  },
  privacyItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1b1b1b',
    marginBottom: 2,
  },
  dangerousText: {
    color: '#e74c3c',
  },
  privacyItemDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  infoSection: {
    backgroundColor: '#e8f4fd',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4682B4',
  },
  infoText: {
    fontSize: 14,
    color: '#1565c0',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 30,
  },
});
