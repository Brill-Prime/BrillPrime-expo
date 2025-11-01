
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../config/theme';
import { Button } from '../../components/ui/button';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LeaveReview() {
  const router = useRouter();
  const { orderId, merchantId, driverId, type } = useLocalSearchParams<{
    orderId: string;
    merchantId?: string;
    driverId?: string;
    type: 'merchant' | 'driver';
  }>();

  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const merchantTags = [
    'Great Quality',
    'Fast Service',
    'Good Prices',
    'Friendly Staff',
    'Clean Store',
    'Wide Selection',
  ];

  const driverTags = [
    'On Time',
    'Careful Handling',
    'Friendly',
    'Professional',
    'Safe Driving',
    'Good Communication',
  ];

  const tags = type === 'merchant' ? merchantTags : driverTags;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const endpoint = type === 'merchant' 
        ? `/api/merchants/${merchantId}/reviews`
        : `/api/drivers/${driverId}/reviews`;

      // TODO: Implement API call
      // const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${endpoint}`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     Authorization: `Bearer ${token}`,
      //   },
      //   body: JSON.stringify({
      //     orderId,
      //     rating,
      //     review,
      //     tags: selectedTags,
      //   }),
      // });

      Alert.alert('Success', 'Thank you for your review!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const styles = getResponsiveStyles(screenData);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leave a Review</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Info */}
        <View style={styles.orderInfo}>
          <Text style={styles.orderLabel}>Order #{orderId}</Text>
          <Text style={styles.orderSubtext}>
            Rate your {type === 'merchant' ? 'shopping' : 'delivery'} experience
          </Text>
        </View>

        {/* Star Rating */}
        <View style={styles.ratingSection}>
          <Text style={styles.sectionTitle}>Your Rating</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={40}
                  color={star <= rating ? '#FFD700' : theme.colors.border}
                />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingText}>
              {rating === 5 ? 'Excellent!' : rating === 4 ? 'Great!' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
            </Text>
          )}
        </View>

        {/* Quick Tags */}
        <View style={styles.tagsSection}>
          <Text style={styles.sectionTitle}>Quick Feedback (Optional)</Text>
          <View style={styles.tagsContainer}>
            {tags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[styles.tag, selectedTags.includes(tag) && styles.tagSelected]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextSelected]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Written Review */}
        <View style={styles.reviewSection}>
          <Text style={styles.sectionTitle}>Write a Review (Optional)</Text>
          <TextInput
            style={styles.reviewInput}
            multiline
            numberOfLines={6}
            placeholder="Share your experience..."
            placeholderTextColor={theme.colors.textLight}
            value={review}
            onChangeText={setReview}
            maxLength={500}
          />
          <Text style={styles.charCount}>{review.length}/500</Text>
        </View>

        {/* Submit Button */}
        <Button
          onPress={handleSubmit}
          disabled={loading || rating === 0}
          style={styles.submitButton}
        >
          {loading ? 'Submitting...' : 'Submit Review'}
        </Button>

        {/* Skip Option */}
        <TouchableOpacity onPress={() => router.back()} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const getResponsiveStyles = (screenData: any) => {
  const { width } = screenData;
  const isTablet = width >= 768;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.base,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      padding: theme.spacing.sm,
    },
    headerTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: 'bold',
      color: theme.colors.text,
      fontFamily: theme.typography.fontFamily.bold,
    },
    content: {
      flex: 1,
      padding: theme.spacing.base,
    },
    orderInfo: {
      marginBottom: theme.spacing.xl,
      alignItems: 'center',
    },
    orderLabel: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: '600',
      color: theme.colors.text,
      fontFamily: theme.typography.fontFamily.semiBold,
    },
    orderSubtext: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily.regular,
      marginTop: theme.spacing.xs,
    },
    ratingSection: {
      marginBottom: theme.spacing.xl,
      alignItems: 'center',
    },
    sectionTitle: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: '600',
      color: theme.colors.text,
      fontFamily: theme.typography.fontFamily.semiBold,
      marginBottom: theme.spacing.md,
      alignSelf: 'flex-start',
    },
    starsContainer: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    ratingText: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: '600',
      color: theme.colors.primary,
      fontFamily: theme.typography.fontFamily.semiBold,
    },
    tagsSection: {
      marginBottom: theme.spacing.xl,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    tag: {
      paddingHorizontal: theme.spacing.base,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    tagSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    tagText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text,
      fontFamily: theme.typography.fontFamily.medium,
    },
    tagTextSelected: {
      color: '#fff',
    },
    reviewSection: {
      marginBottom: theme.spacing.xl,
    },
    reviewInput: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.base,
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.regular,
      textAlignVertical: 'top',
      minHeight: 120,
    },
    charCount: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.textLight,
      fontFamily: theme.typography.fontFamily.regular,
      textAlign: 'right',
      marginTop: theme.spacing.xs,
    },
    submitButton: {
      marginBottom: theme.spacing.md,
    },
    skipButton: {
      alignItems: 'center',
      padding: theme.spacing.md,
      marginBottom: theme.spacing.xl,
    },
    skipText: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily.medium,
    },
  });
};
