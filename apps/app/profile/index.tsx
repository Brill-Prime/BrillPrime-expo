import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Switch,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AccountCircleIcon from '../../components/AccountCircleIcon';
import ArrowForwardIcon from '../../components/ArrowForwardIcon';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  profileImage?: string;
  joinDate: string;
}

interface Settings {
  notifications: boolean;
  locationServices: boolean;
  emailUpdates: boolean;
  promotionalOffers: boolean;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<Settings>({
    notifications: true,
    locationServices: true,
    emailUpdates: false,
    promotionalOffers: true,
  });
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    loadUserProfile();
    loadSettings();

    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const loadUserProfile = async () => {
    try {
      // Load user data from AsyncStorage (stored by authService)
      const userDataString = await AsyncStorage.getItem('userData');
      
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        setUserProfile({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          profileImage: userData.profileImageUrl || undefined,
          joinDate: userData.createdAt || new Date().toISOString(),
        });
      } else {
        // Fallback to loading individual fields
        const email = await AsyncStorage.getItem('userEmail');
        setUserProfile({
          name: 'User',
          email: email || '',
          phone: '',
          joinDate: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

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

  const updateSetting = async (key: keyof Settings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      await AsyncStorage.setItem('userSettings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Import and use authService for proper logout
              const { authService } = await import('../../services/authService');
              await authService.signOut();
              router.replace('/auth/role-selection');
            } catch (error) {
              console.error('Error during logout:', error);
            }
          }
        }
      ]
    );
  };

  const MenuSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.menuSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  const handleNavigateToItem = (route: string) => {
    try {
      router.push(route as any);
    } catch (error) {
      console.error(`Navigation error to ${route}:`, error);
      Alert.alert('Navigation Error', `Could not navigate to ${route}. This feature may not be implemented yet.`);
    }
  };

  const MenuItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    showArrow = true,
    rightElement 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showArrow?: boolean;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIcon}>
          <Ionicons name={icon as any} size={22} color="#4682B4" />
        </View>
        <View style={styles.menuItemContent}>
          <Text style={styles.menuItemTitle}>{title}</Text>
          {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>

      {rightElement || (showArrow && (
        <ArrowForwardIcon size={20} color="#666" />
      ))}
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
        <Text style={styles.headerTitle}>Profile & Settings</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => router.push('/profile/edit')}
        >
          <Image 
            source={require('../../assets/images/edit_icon_white.png')}
            style={{ width: 24, height: 24 }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { marginHorizontal: responsivePadding }]}>
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImage}>
              <AccountCircleIcon size={80} color="#8E8E93" />
            </View>
            <TouchableOpacity style={styles.cameraButton}>
              <Image 
                source={require('../../assets/images/camera_icon.png')}
                style={{ width: 16, height: 16 }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userProfile?.name}</Text>
            <Text style={styles.profileEmail}>{userProfile?.email}</Text>
            <Text style={styles.joinDate}>
              Member since {new Date(userProfile?.joinDate || '').toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </Text>
          </View>
        </View>

        {/* Account Section */}
        <MenuSection title="Account">
          <MenuItem
            icon="person-outline"
            title="Personal Information"
            subtitle="Update your personal details"
            onPress={() => handleNavigateToItem('/profile/consumer-edit')}
          />
          <MenuItem
            icon="share-social-outline"
            title="Social Media"
            subtitle="Connect your social accounts"
            onPress={() => handleNavigateToItem('/profile/social-media')}
          />
          <MenuItem
            icon="location-outline"
            title="Saved Addresses"
            subtitle="Manage your delivery addresses"
            onPress={() => handleNavigateToItem('/profile/addresses')}
          />
          <MenuItem
            icon="card-outline"
            title="Payment Methods"
            subtitle="Manage cards and payment options"
            onPress={() => handleNavigateToItem('/profile/payment-methods')}
          />
          <MenuItem
            icon="shield-checkmark-outline"
            title="Identity Verification"
            subtitle="Verify your identity for enhanced security"
            onPress={() => handleNavigateToItem('/kyc')}
          />
          <MenuItem
            icon="receipt-outline"
            title="Order History"
            subtitle="View your past orders"
            onPress={() => handleNavigateToItem('/orders/consumer-orders')}
          />
        </MenuSection>

        {/* Preferences Section */}
        <MenuSection title="Preferences">
          <MenuItem
            icon="notifications-outline"
            title="Push Notifications"
            subtitle="Receive order updates and offers"
            onPress={() => {}}
            showArrow={false}
            rightElement={
              <Switch
                value={settings.notifications}
                onValueChange={(value) => updateSetting('notifications', value)}
                thumbColor={settings.notifications ? '#4682B4' : '#f4f3f4'}
                trackColor={{ false: '#767577', true: '#4682B481' }}
              />
            }
          />
          <MenuItem
            icon="location-outline"
            title="Location Services"
            subtitle="Allow location access for better service"
            onPress={() => {}}
            showArrow={false}
            rightElement={
              <Switch
                value={settings.locationServices}
                onValueChange={(value) => updateSetting('locationServices', value)}
                thumbColor={settings.locationServices ? '#4682B4' : '#f4f3f4'}
                trackColor={{ false: '#767577', true: '#4682B481' }}
              />
            }
          />
          <MenuItem
            icon="mail-outline"
            title="Email Updates"
            subtitle="Receive news and updates via email"
            onPress={() => {}}
            showArrow={false}
            rightElement={
              <Switch
                value={settings.emailUpdates}
                onValueChange={(value) => updateSetting('emailUpdates', value)}
                thumbColor={settings.emailUpdates ? '#4682B4' : '#f4f3f4'}
                trackColor={{ false: '#767577', true: '#4682B481' }}
              />
            }
          />
          <MenuItem
            icon="gift-outline"
            title="Promotional Offers"
            subtitle="Get notified about special deals"
            onPress={() => {}}
            showArrow={false}
            rightElement={
              <Switch
                value={settings.promotionalOffers}
                onValueChange={(value) => updateSetting('promotionalOffers', value)}
                thumbColor={settings.promotionalOffers ? '#4682B4' : '#f4f3f4'}
                trackColor={{ false: '#767577', true: '#4682B481' }}
              />
            }
          />
        </MenuSection>

        {/* Support Section */}
        <MenuSection title="Support & Legal">
          <MenuItem
            icon="help-circle-outline"
            title="Help & Support"
            subtitle="Get help with your account or orders"
            onPress={() => handleNavigateToItem('/support')}
          />
          <MenuItem
            icon="document-text-outline"
            title="Terms & Conditions"
            subtitle="Read our terms of service"
            onPress={() => handleNavigateToItem('/about')}
          />
          <MenuItem
            icon="shield-checkmark-outline"
            title="Privacy Policy"
            subtitle="How we protect your privacy"
            onPress={() => handleNavigateToItem('/profile/privacy-settings')}
          />
          <MenuItem
            icon="star-outline"
            title="Rate Brill Prime"
            subtitle="Share your feedback with us"
            onPress={() => handleNavigateToItem('/support')}
          />
        </MenuSection>

        {/* Logout Section */}
        <View style={[styles.logoutSection, { marginHorizontal: responsivePadding }]}>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
            onPressIn={() => {}} // Placeholder for hover effect
            onPressOut={() => {}} // Placeholder for hover effect
          >
            <Ionicons name="log-out-outline" size={22} color="#e74c3c" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
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
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    marginBottom: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4682B4',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1b1b1b',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  joinDate: {
    fontSize: 14,
    color: '#999',
  },
  menuSection: {
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#f8f9ff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1b1b1b',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  logoutSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginLeft: 10,
  },
  bottomSpacing: {
    height: 30,
  },
});