
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  ActivityIndicator,
  Clipboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAlert } from '../../components/AlertProvider';
import { useAuth } from '../../contexts/AuthContext';

interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalEarnings: number;
  rewardPerReferral: number;
  referralHistory: Array<{
    id: string;
    name: string;
    status: 'pending' | 'completed' | 'expired';
    reward: number;
    date: string;
  }>;
}

export default function ReferralProgram() {
  const router = useRouter();
  const { showError, showConfirmDialog } = useAlert();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReferralStats | null>(null);

  useEffect(() => {
    fetchReferralStats();
  }, []);

  const fetchReferralStats = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await referralService.getStats();
      
      const mockStats: ReferralStats = {
        referralCode: 'BRILL' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        totalReferrals: 12,
        successfulReferrals: 8,
        pendingReferrals: 4,
        totalEarnings: 8000,
        rewardPerReferral: 1000,
        referralHistory: [
          {
            id: '1',
            name: 'John Doe',
            status: 'completed',
            reward: 1000,
            date: '2024-01-15',
          },
          {
            id: '2',
            name: 'Jane Smith',
            status: 'pending',
            reward: 1000,
            date: '2024-01-18',
          },
          {
            id: '3',
            name: 'Mike Johnson',
            status: 'completed',
            reward: 1000,
            date: '2024-01-20',
          },
        ],
      };

      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching referral stats:', error);
      showError('Error', 'Failed to load referral statistics');
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    if (stats?.referralCode) {
      Clipboard.setString(stats.referralCode);
      showConfirmDialog('Copied!', 'Referral code copied to clipboard', () => {});
    }
  };

  const shareReferralCode = async () => {
    try {
      const message = `Join BrillPrime using my referral code ${stats?.referralCode} and we both earn ₦${stats?.rewardPerReferral}! Download the app now.`;
      
      await Share.share({
        message,
        title: 'Join BrillPrime',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'expired':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4682B4" />
        <Text style={styles.loadingText}>Loading referral stats...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0B1A51" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Referral Program</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#4682B4', '#5B9BD5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.codeCard}
        >
          <Text style={styles.codeLabel}>Your Referral Code</Text>
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>{stats?.referralCode}</Text>
            <TouchableOpacity style={styles.copyButton} onPress={copyReferralCode}>
              <Ionicons name="copy-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.shareButton} onPress={shareReferralCode}>
            <Ionicons name="share-social" size={20} color="#4682B4" />
            <Text style={styles.shareButtonText}>Share with Friends</Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={32} color="#4682B4" />
            <Text style={styles.statValue}>{stats?.totalReferrals}</Text>
            <Text style={styles.statLabel}>Total Referrals</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={32} color="#10B981" />
            <Text style={styles.statValue}>{stats?.successfulReferrals}</Text>
            <Text style={styles.statLabel}>Successful</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={32} color="#F59E0B" />
            <Text style={styles.statValue}>{stats?.pendingReferrals}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cash" size={32} color="#059669" />
            <Text style={styles.statValue}>₦{stats?.totalEarnings.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="gift" size={24} color="#4682B4" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>How it Works</Text>
            <Text style={styles.infoText}>
              • Share your referral code with friends{'\n'}
              • They sign up and make their first order{'\n'}
              • You both earn ₦{stats?.rewardPerReferral.toLocaleString()} credits!
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Referral History</Text>
        {stats?.referralHistory.map((referral) => (
          <View key={referral.id} style={styles.historyItem}>
            <View style={styles.historyLeft}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{referral.name.charAt(0)}</Text>
              </View>
              <View style={styles.historyInfo}>
                <Text style={styles.historyName}>{referral.name}</Text>
                <Text style={styles.historyDate}>{new Date(referral.date).toLocaleDateString()}</Text>
              </View>
            </View>
            <View style={styles.historyRight}>
              <Text style={styles.historyReward}>₦{referral.reward.toLocaleString()}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(referral.status) }]}>
                <Text style={styles.statusText}>{referral.status}</Text>
              </View>
            </View>
          </View>
        ))}
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
    padding: 16,
  },
  codeCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  codeText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 4,
    marginRight: 12,
  },
  copyButton: {
    padding: 8,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  shareButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#4682B4',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0B1A51',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0B1A51',
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4682B4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  historyInfo: {
    marginLeft: 12,
    flex: 1,
  },
  historyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0B1A51',
  },
  historyDate: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyReward: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
});
