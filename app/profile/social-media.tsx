import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAlert } from '../../components/AlertProvider';

interface SocialMediaAccount {
  platform: string;
  name: string;
  icon: string;
  color: string;
  connected: boolean;
  username?: string;
  url?: string;
}

export default function SocialMediaScreen() {
  const router = useRouter();
  const { showSuccess, showError } = useAlert();
  const [socialAccounts, setSocialAccounts] = useState<SocialMediaAccount[]>([
    {
      platform: 'Facebook',
      name: 'Facebook',
      icon: 'logo-facebook',
      color: '#1877F2',
      connected: false,
    },
    {
      platform: 'Instagram',
      name: 'Instagram',
      icon: 'logo-instagram',
      color: '#E4405F',
      connected: false,
    },
    {
      platform: 'Twitter',
      name: 'Twitter',
      icon: 'logo-twitter',
      color: '#1DA1F2',
      connected: false,
    },
    {
      platform: 'LinkedIn',
      name: 'LinkedIn',
      icon: 'logo-linkedin',
      color: '#0077B5',
      connected: false,
    },
    {
      platform: 'Google',
      name: 'Google',
      icon: 'logo-google',
      color: '#4285F4',
      connected: false,
    },
    {
      platform: 'Apple',
      name: 'Apple',
      icon: 'logo-apple',
      color: '#000000',
      connected: false,
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    loadSocialMediaConnections();

    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const loadSocialMediaConnections = async () => {
    try {
      const socialLinksString = await AsyncStorage.getItem('socialMediaLinks');
      if (socialLinksString) {
        const socialLinks = JSON.parse(socialLinksString);

        setSocialAccounts(prev => prev.map(account => ({
          ...account,
          connected: !!socialLinks[account.platform.toLowerCase()],
          username: socialLinks[account.platform.toLowerCase()]?.username,
          url: socialLinks[account.platform.toLowerCase()]?.url,
        })));
      }
    } catch (error) {
      console.error('Error loading social media connections:', error);
    }
  };

  const handleConnect = async (platform: string) => {
    setLoading(true);

    try {
      // Simulate OAuth flow - in real app, this would redirect to OAuth provider
      Alert.prompt(
        `Connect ${platform}`,
        `Enter your ${platform} username or profile URL`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Connect',
            onPress: async (input) => {
              if (input && input.trim()) {
                await connectAccount(platform, input.trim());
              }
            }
          }
        ],
        'plain-text',
        ''
      );
    } catch (error) {
      console.error(`Error connecting to ${platform}:`, error);
      showError('Error', `Failed to connect to ${platform}`);
    } finally {
      setLoading(false);
    }
  };

  const connectAccount = async (platform: string, input: string) => {
    try {
      // Determine if input is username or URL
      const isUrl = input.startsWith('http') || input.startsWith('www');
      const username = isUrl ? extractUsernameFromUrl(input, platform) : input;
      const url = isUrl ? input : generateProfileUrl(platform, input);

      // Update local state
      setSocialAccounts(prev => prev.map(account =>
        account.platform === platform
          ? { ...account, connected: true, username, url }
          : account
      ));

      // Save to AsyncStorage
      const socialLinksString = await AsyncStorage.getItem('socialMediaLinks');
      const socialLinks = socialLinksString ? JSON.parse(socialLinksString) : {};

      socialLinks[platform.toLowerCase()] = {
        username,
        url,
        connectedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem('socialMediaLinks', JSON.stringify(socialLinks));

      // In a real app, you would call an API to link the account
      try {
        const { userService } = await import('../../services/userService');
        // await userService.linkSocialAccount({
        //   platform: platform.toLowerCase(),
        //   username,
        //   url,
        // });
        console.log('Social account linked locally:', { platform: platform.toLowerCase(), username, url });
      } catch (apiError) {
        console.log('API call failed, but local connection saved:', apiError);
      }

      showSuccess('Success', `${platform} account connected successfully`);
    } catch (error) {
      console.error('Error saving social media connection:', error);
      showError('Error', `Failed to connect ${platform} account`);
    }
  };

  const handleDisconnect = async (platform: string) => {
    Alert.alert(
      `Disconnect ${platform}`,
      `Are you sure you want to disconnect your ${platform} account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              // Update local state
              setSocialAccounts(prev => prev.map(account =>
                account.platform === platform
                  ? { ...account, connected: false, username: undefined, url: undefined }
                  : account
              ));

              // Remove from AsyncStorage
              const socialLinksString = await AsyncStorage.getItem('socialMediaLinks');
              if (socialLinksString) {
                const socialLinks = JSON.parse(socialLinksString);
                delete socialLinks[platform.toLowerCase()];
                await AsyncStorage.setItem('socialMediaLinks', JSON.stringify(socialLinks));
              }

              // In a real app, you would call an API to unlink the account
              try {
                const { userService } = await import('../../services/userService');
                // await userService.unlinkSocialAccount(platform.toLowerCase());
                console.log('Social account unlinked locally:', platform.toLowerCase());
              } catch (apiError) {
                console.log('API call failed, but local disconnection saved:', apiError);
              }

              showSuccess('Success', `${platform} account disconnected`);
            } catch (error) {
              console.error('Error disconnecting social media account:', error);
              showError('Error', `Failed to disconnect ${platform} account`);
            }
          }
        }
      ]
    );
  };

  const extractUsernameFromUrl = (url: string, platform: string): string => {
    // Simple URL parsing - in real app, this would be more robust
    const cleanUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '');
    const parts = cleanUrl.split('/');

    switch (platform.toLowerCase()) {
      case 'facebook':
        return parts[1] || '';
      case 'instagram':
        return parts[1] || '';
      case 'twitter':
        return parts[1] || '';
      case 'linkedin':
        return parts[2] || '';
      default:
        return parts[parts.length - 1] || '';
    }
  };

  const generateProfileUrl = (platform: string, username: string): string => {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return `https://facebook.com/${username}`;
      case 'instagram':
        return `https://instagram.com/${username}`;
      case 'twitter':
        return `https://twitter.com/${username}`;
      case 'linkedin':
        return `https://linkedin.com/in/${username}`;
      case 'google':
        return `https://plus.google.com/${username}`;
      default:
        return username;
    }
  };

  const responsivePadding = Math.max(20, screenDimensions.width * 0.05);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: responsivePadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#1b1b1b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Social Media</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: responsivePadding }}>
          {/* Info Card */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color="#4682B4" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Connect Your Accounts</Text>
              <Text style={styles.infoText}>
                Link your social media accounts to enhance your profile and make it easier for others to find you.
              </Text>
            </View>
          </View>

          {/* Social Media Accounts */}
          <View style={styles.accountsSection}>
            <Text style={styles.sectionTitle}>Social Media Accounts</Text>

            {socialAccounts.map((account) => (
              <View key={account.platform} style={styles.accountCard}>
                <View style={styles.accountLeft}>
                  <View style={[styles.accountIcon, { backgroundColor: `${account.color}20` }]}>
                    <Ionicons
                      name={account.icon as any}
                      size={24}
                      color={account.color}
                    />
                  </View>

                  <View style={styles.accountInfo}>
                    <Text style={styles.accountName}>{account.name}</Text>
                    {account.connected && account.username ? (
                      <Text style={styles.accountUsername}>@{account.username}</Text>
                    ) : (
                      <Text style={styles.accountStatus}>Not connected</Text>
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    account.connected && styles.disconnectButton
                  ]}
                  onPress={() => account.connected
                    ? handleDisconnect(account.platform)
                    : handleConnect(account.platform)
                  }
                  disabled={loading}
                >
                  <Text style={[
                    styles.actionButtonText,
                    account.connected && styles.disconnectButtonText
                  ]}>
                    {account.connected ? 'Disconnect' : 'Connect'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Benefits Section */}
          <View style={styles.benefitsSection}>
            <Text style={styles.sectionTitle}>Benefits of Connecting</Text>

            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
              <Text style={styles.benefitText}>Easier account recovery</Text>
            </View>

            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
              <Text style={styles.benefitText}>Quick sign-in options</Text>
            </View>

            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
              <Text style={styles.benefitText}>Enhanced profile visibility</Text>
            </View>

            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
              <Text style={styles.benefitText}>Social proof and verification</Text>
            </View>
          </View>

          <View style={styles.bottomSpacing} />
        </View>
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
  infoCard: {
    backgroundColor: '#e8f4fd',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 25,
    borderLeftWidth: 4,
    borderLeftColor: '#4682B4',
  },
  infoContent: {
    marginLeft: 15,
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1565c0',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#1565c0',
    lineHeight: 20,
  },
  accountsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1b1b1b',
    marginBottom: 15,
  },
  accountCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  accountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accountIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1b1b1b',
    marginBottom: 2,
  },
  accountUsername: {
    fontSize: 14,
    color: '#4682B4',
  },
  accountStatus: {
    fontSize: 14,
    color: '#666',
  },
  actionButton: {
    backgroundColor: '#4682B4',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  disconnectButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  disconnectButtonText: {
    color: '#e74c3c',
  },
  benefitsSection: {
    marginBottom: 25,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 30,
  },
});
