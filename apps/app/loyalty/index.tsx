
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAlert } from '../../components/AlertProvider';

interface LoyaltyData {
  currentPoints: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  nextTier: string | null;
  pointsToNextTier: number;
  lifetimePoints: number;
  availableRewards: Array<{
    id: string;
    title: string;
    description: string;
    pointsCost: number;
    icon: string;
    category: string;
  }>;
  pointsHistory: Array<{
    id: string;
    type: 'earned' | 'redeemed';
    points: number;
    description: string;
    date: string;
  }>;
  tierBenefits: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
}

export default function LoyaltyProgram() {
  const router = useRouter();
  const { showError, showConfirmDialog } = useAlert();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LoyaltyData | null>(null);
  const [selectedTab, setSelectedTab] = useState<'rewards' | 'history'>('rewards');

  useEffect(() => {
    fetchLoyaltyData();
  }, []);

  const fetchLoyaltyData = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      const mockData: LoyaltyData = {
        currentPoints: 2450,
        tier: 'silver',
        nextTier: 'gold',
        pointsToNextTier: 550,
        lifetimePoints: 8920,
        availableRewards: [
          {
            id: '1',
            title: '₦500 Discount',
            description: 'Get ₦500 off your next order',
            pointsCost: 500,
            icon: 'pricetag',
            category: 'discount',
          },
          {
            id: '2',
            title: 'Free Delivery',
            description: '3 free deliveries on any order',
            pointsCost: 750,
            icon: 'bicycle',
            category: 'delivery',
          },
          {
            id: '3',
            title: '₦1000 Discount',
            description: 'Get ₦1000 off orders above ₦5000',
            pointsCost: 1000,
            icon: 'cash',
            category: 'discount',
          },
          {
            id: '4',
            title: 'Priority Support',
            description: '1 month of priority customer support',
            pointsCost: 1500,
            icon: 'headset',
            category: 'service',
          },
        ],
        pointsHistory: [
          {
            id: '1',
            type: 'earned',
            points: 150,
            description: 'Order #BR12345',
            date: '2024-01-20',
          },
          {
            id: '2',
            type: 'redeemed',
            points: -500,
            description: 'Redeemed: ₦500 Discount',
            date: '2024-01-18',
          },
          {
            id: '3',
            type: 'earned',
            points: 200,
            description: 'Referral bonus',
            date: '2024-01-15',
          },
        ],
        tierBenefits: [
          {
            icon: 'star',
            title: '5% Bonus Points',
            description: 'Earn 5% more points on every order',
          },
          {
            icon: 'gift',
            title: 'Birthday Reward',
            description: 'Special discount on your birthday month',
          },
          {
            icon: 'flash',
            title: 'Early Access',
            description: 'Get early access to new features and promotions',
          },
        ],
      };

      setData(mockData);
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
      showError('Error', 'Failed to load loyalty program data');
    } finally {
      setLoading(false);
    }
  };

  const redeemReward = (reward: any) => {
    if (!data || data.currentPoints < reward.pointsCost) {
      showError('Insufficient Points', `You need ${reward.pointsCost - data.currentPoints} more points to redeem this reward`);
      return;
    }

    showConfirmDialog(
      'Redeem Reward',
      `Redeem ${reward.title} for ${reward.pointsCost} points?`,
      async () => {
        try {
          // TODO: Replace with actual API call
          await new Promise((resolve) => setTimeout(resolve, 1000));
          
          showConfirmDialog(
            'Success!',
            `${reward.title} has been added to your account`,
            () => fetchLoyaltyData()
          );
        } catch (error) {
          showError('Error', 'Failed to redeem reward');
        }
      }
    );
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze':
        return ['#CD7F32', '#B8860B'];
      case 'silver':
        return ['#C0C0C0', '#A8A8A8'];
      case 'gold':
        return ['#FFD700', '#FFA500'];
      case 'platinum':
        return ['#E5E4E2', '#B9F2FF'];
      default:
        return ['#4682B4', '#5B9BD5'];
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4682B4" />
        <Text style={styles.loadingText}>Loading loyalty program...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0B1A51" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Loyalty Program</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={getTierColor(data?.tier || 'bronze')}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.tierCard}
        >
          <View style={styles.tierBadge}>
            <Text style={styles.tierText}>{data?.tier.toUpperCase()}</Text>
          </View>
          <Text style={styles.pointsLabel}>Available Points</Text>
          <Text style={styles.pointsValue}>{data?.currentPoints.toLocaleString()}</Text>
          
          {data?.nextTier && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${((data.currentPoints % 3000) / 3000) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {data.pointsToNextTier} points to {data.nextTier.toUpperCase()}
              </Text>
            </View>
          )}
        </LinearGradient>

        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>Your Benefits</Text>
          {data?.tierBenefits.map((benefit, index) => (
            <View key={index} style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Ionicons name={benefit.icon as any} size={24} color="#4682B4" />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDescription}>{benefit.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'rewards' && styles.tabActive]}
            onPress={() => setSelectedTab('rewards')}
          >
            <Text style={[styles.tabText, selectedTab === 'rewards' && styles.tabTextActive]}>
              Rewards
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'history' && styles.tabActive]}
            onPress={() => setSelectedTab('history')}
          >
            <Text style={[styles.tabText, selectedTab === 'history' && styles.tabTextActive]}>
              History
            </Text>
          </TouchableOpacity>
        </View>

        {selectedTab === 'rewards' ? (
          <View style={styles.rewardsContainer}>
            {data?.availableRewards.map((reward) => (
              <View key={reward.id} style={styles.rewardCard}>
                <View style={styles.rewardHeader}>
                  <View style={styles.rewardIconContainer}>
                    <Ionicons name={reward.icon as any} size={32} color="#4682B4" />
                  </View>
                  <View style={styles.rewardInfo}>
                    <Text style={styles.rewardTitle}>{reward.title}</Text>
                    <Text style={styles.rewardDescription}>{reward.description}</Text>
                  </View>
                </View>
                <View style={styles.rewardFooter}>
                  <View style={styles.pointsCost}>
                    <Ionicons name="star" size={16} color="#F59E0B" />
                    <Text style={styles.pointsCostText}>{reward.pointsCost} points</Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.redeemButton,
                      data && data.currentPoints < reward.pointsCost && styles.redeemButtonDisabled,
                    ]}
                    onPress={() => redeemReward(reward)}
                  >
                    <Text style={styles.redeemButtonText}>Redeem</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.historyContainer}>
            {data?.pointsHistory.map((item) => (
              <View key={item.id} style={styles.historyItem}>
                <View
                  style={[
                    styles.historyIcon,
                    { backgroundColor: item.type === 'earned' ? '#ECFDF5' : '#FEF2F2' },
                  ]}
                >
                  <Ionicons
                    name={item.type === 'earned' ? 'add-circle' : 'remove-circle'}
                    size={24}
                    color={item.type === 'earned' ? '#10B981' : '#EF4444'}
                  />
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyDescription}>{item.description}</Text>
                  <Text style={styles.historyDate}>
                    {new Date(item.date).toLocaleDateString()}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.historyPoints,
                    { color: item.type === 'earned' ? '#10B981' : '#EF4444' },
                  ]}
                >
                  {item.points > 0 ? '+' : ''}
                  {item.points}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0B1A51',
  },
  content: {
    flex: 1,
  },
  tierCard: {
    margin: 16,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  tierBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  tierText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  pointsLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  pointsValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
    marginVertical: 8,
  },
  progressContainer: {
    width: '100%',
    marginTop: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  progressText: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
  },
  benefitsSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0B1A51',
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitContent: {
    flex: 1,
    marginLeft: 12,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0B1A51',
    marginBottom: 2,
  },
  benefitDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#4682B4',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  rewardsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  rewardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  rewardHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  rewardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  rewardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0B1A51',
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  rewardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsCost: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsCostText: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: '600',
    color: '#0B1A51',
  },
  redeemButton: {
    backgroundColor: '#4682B4',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  redeemButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  redeemButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  historyContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  historyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyInfo: {
    flex: 1,
    marginLeft: 12,
  },
  historyDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0B1A51',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  historyPoints: {
    fontSize: 18,
    fontWeight: '700',
  },
});
