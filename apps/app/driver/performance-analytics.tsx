
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
import { useAlert } from '../../components/AlertProvider';

interface PerformanceMetrics {
  totalDeliveries: number;
  acceptanceRate: number;
  completionRate: number;
  averageRating: number;
  totalEarnings: number;
  onTimeDeliveryRate: number;
  peakHours: Array<{ hour: string; deliveries: number; earnings: number }>;
  weeklyStats: Array<{ day: string; deliveries: number; earnings: number }>;
  customerFeedback: {
    positive: number;
    neutral: number;
    negative: number;
  };
  routeEfficiency: number;
  responseTime: number; // in minutes
}

export default function PerformanceAnalytics() {
  const router = useRouter();
  const { showError } = useAlert();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');

  useEffect(() => {
    fetchPerformanceMetrics();
  }, [selectedPeriod]);

  const fetchPerformanceMetrics = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await driverService.getPerformanceMetrics(selectedPeriod);
      
      // Mock data for demonstration
      const mockData: PerformanceMetrics = {
        totalDeliveries: 156,
        acceptanceRate: 94.5,
        completionRate: 98.2,
        averageRating: 4.8,
        totalEarnings: 45600,
        onTimeDeliveryRate: 96.3,
        peakHours: [
          { hour: '12:00 PM', deliveries: 23, earnings: 6900 },
          { hour: '6:00 PM', deliveries: 31, earnings: 9300 },
          { hour: '8:00 PM', deliveries: 19, earnings: 5700 },
        ],
        weeklyStats: [
          { day: 'Mon', deliveries: 22, earnings: 6600 },
          { day: 'Tue', deliveries: 25, earnings: 7500 },
          { day: 'Wed', deliveries: 28, earnings: 8400 },
          { day: 'Thu', deliveries: 24, earnings: 7200 },
          { day: 'Fri', deliveries: 30, earnings: 9000 },
          { day: 'Sat', deliveries: 18, earnings: 5400 },
          { day: 'Sun', deliveries: 9, earnings: 2700 },
        ],
        customerFeedback: {
          positive: 142,
          neutral: 10,
          negative: 4,
        },
        routeEfficiency: 89.5,
        responseTime: 3.2,
      };

      setMetrics(mockData);
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      showError('Error', 'Failed to load performance analytics');
    } finally {
      setLoading(false);
    }
  };

  const renderMetricCard = (title: string, value: string | number, icon: string, color: string) => (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <View style={styles.metricHeader}>
        <Ionicons name={icon as any} size={24} color={color} />
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );

  const renderPeakHoursChart = () => (
    <View style={styles.chartContainer}>
      <Text style={styles.sectionTitle}>Peak Hours</Text>
      <Text style={styles.sectionSubtitle}>When you earn the most</Text>
      {metrics?.peakHours.map((hour, index) => (
        <View key={index} style={styles.peakHourItem}>
          <Text style={styles.peakHourTime}>{hour.hour}</Text>
          <View style={styles.peakHourBar}>
            <View
              style={[
                styles.peakHourFill,
                { width: `${(hour.deliveries / 35) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.peakHourStats}>
            {hour.deliveries} orders • ₦{hour.earnings.toLocaleString()}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderWeeklyStats = () => (
    <View style={styles.chartContainer}>
      <Text style={styles.sectionTitle}>Weekly Performance</Text>
      <View style={styles.weeklyChart}>
        {metrics?.weeklyStats.map((day, index) => (
          <View key={index} style={styles.dayColumn}>
            <View
              style={[
                styles.dayBar,
                { height: `${(day.deliveries / 35) * 100}%` },
              ]}
            />
            <Text style={styles.dayLabel}>{day.day}</Text>
            <Text style={styles.dayValue}>{day.deliveries}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderFeedbackBreakdown = () => {
    const total = metrics
      ? metrics.customerFeedback.positive +
        metrics.customerFeedback.neutral +
        metrics.customerFeedback.negative
      : 1;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>Customer Feedback</Text>
        <View style={styles.feedbackBar}>
          <View
            style={[
              styles.feedbackSegment,
              styles.feedbackPositive,
              { width: `${((metrics?.customerFeedback.positive || 0) / total) * 100}%` },
            ]}
          />
          <View
            style={[
              styles.feedbackSegment,
              styles.feedbackNeutral,
              { width: `${((metrics?.customerFeedback.neutral || 0) / total) * 100}%` },
            ]}
          />
          <View
            style={[
              styles.feedbackSegment,
              styles.feedbackNegative,
              { width: `${((metrics?.customerFeedback.negative || 0) / total) * 100}%` },
            ]}
          />
        </View>
        <View style={styles.feedbackLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.feedbackPositive]} />
            <Text style={styles.legendText}>
              Positive ({metrics?.customerFeedback.positive})
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.feedbackNeutral]} />
            <Text style={styles.legendText}>
              Neutral ({metrics?.customerFeedback.neutral})
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.feedbackNegative]} />
            <Text style={styles.legendText}>
              Negative ({metrics?.customerFeedback.negative})
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4682B4" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0B1A51" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Performance Analytics</Text>
      </View>

      <View style={styles.periodSelector}>
        {(['week', 'month', 'year'] as const).map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive,
              ]}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.metricsGrid}>
          {renderMetricCard(
            'Total Deliveries',
            metrics?.totalDeliveries || 0,
            'bicycle',
            '#4682B4'
          )}
          {renderMetricCard(
            'Acceptance Rate',
            `${metrics?.acceptanceRate || 0}%`,
            'checkmark-circle',
            '#10B981'
          )}
          {renderMetricCard(
            'Avg. Rating',
            `${metrics?.averageRating || 0}/5.0`,
            'star',
            '#F59E0B'
          )}
          {renderMetricCard(
            'Total Earnings',
            `₦${(metrics?.totalEarnings || 0).toLocaleString()}`,
            'cash',
            '#059669'
          )}
          {renderMetricCard(
            'On-Time Rate',
            `${metrics?.onTimeDeliveryRate || 0}%`,
            'time',
            '#6366F1'
          )}
          {renderMetricCard(
            'Route Efficiency',
            `${metrics?.routeEfficiency || 0}%`,
            'navigate',
            '#8B5CF6'
          )}
        </View>

        {renderPeakHoursChart()}
        {renderWeeklyStats()}
        {renderFeedbackBreakdown()}

        <View style={styles.tipsContainer}>
          <Text style={styles.sectionTitle}>Tips to Improve</Text>
          <View style={styles.tipItem}>
            <Ionicons name="bulb-outline" size={20} color="#F59E0B" />
            <Text style={styles.tipText}>
              Focus on peak hours (12 PM - 2 PM and 6 PM - 9 PM) to maximize earnings
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="bulb-outline" size={20} color="#F59E0B" />
            <Text style={styles.tipText}>
              Maintain a 95%+ acceptance rate for priority order assignments
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="bulb-outline" size={20} color="#F59E0B" />
            <Text style={styles.tipText}>
              Respond to orders within 2 minutes to improve response time metrics
            </Text>
          </View>
        </View>
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
  periodSelector: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#4682B4',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  metricsGrid: {
    padding: 16,
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0B1A51',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0B1A51',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  peakHourItem: {
    marginBottom: 16,
  },
  peakHourTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0B1A51',
    marginBottom: 4,
  },
  peakHourBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 4,
  },
  peakHourFill: {
    height: '100%',
    backgroundColor: '#4682B4',
    borderRadius: 4,
  },
  peakHourStats: {
    fontSize: 12,
    color: '#6B7280',
  },
  weeklyChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  dayBar: {
    width: 24,
    backgroundColor: '#4682B4',
    borderRadius: 4,
    marginBottom: 8,
  },
  dayLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  dayValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0B1A51',
  },
  feedbackBar: {
    flexDirection: 'row',
    height: 32,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  feedbackSegment: {
    height: '100%',
  },
  feedbackPositive: {
    backgroundColor: '#10B981',
  },
  feedbackNeutral: {
    backgroundColor: '#F59E0B',
  },
  feedbackNegative: {
    backgroundColor: '#EF4444',
  },
  feedbackLegend: {
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#6B7280',
  },
  tipsContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
    lineHeight: 20,
  },
});
