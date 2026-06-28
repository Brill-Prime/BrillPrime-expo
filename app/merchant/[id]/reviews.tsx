import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { merchantService } from '../../../services/merchantService';

interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

interface NewReview {
  rating: number;
  comment: string;
}

export default function MerchantReviewsScreen() {
  const router = useRouter();
  const { id: merchantId } = useLocalSearchParams();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newReview, setNewReview] = useState<NewReview>({ rating: 0, comment: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [merchantId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await merchantService.getMerchantReviews(merchantId as string);
      if (response.success && response.data) {
        setReviews(response.data.reviews || []);
        setAverageRating(response.data.averageRating || 0);
      } else {
        setReviews([]);
        setAverageRating(0);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      setReviews([]);
      setAverageRating(0);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={16}
            color="#FFD700"
          />
        ))}
      </View>
    );
  };

  const handleStarPress = (rating: number) => {
    setNewReview((prev) => ({ ...prev, rating }));
  };

  const handleSubmitReview = async () => {
    if (!newReview.rating) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }
    if (!newReview.comment.trim()) {
      Alert.alert('Error', 'Please enter a review');
      return;
    }

    try {
      setIsLoading(true);
      const result = await merchantService.submitMerchantReview(merchantId, {
        rating: newReview.rating,
        comment: newReview.comment.trim(),
      });

      if (result.success) {
        Alert.alert('Success', 'Review submitted successfully!');
        setShowReviewModal(false);
        setNewReview({ rating: 0, comment: '' });
        // Refresh reviews
        loadReviews();
      } else {
        Alert.alert('Error', result.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#0c1a2a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reviews</Text>
        <TouchableOpacity onPress={() => setShowReviewModal(true)} style={styles.addButton}>
          <Ionicons name="add-circle" size={28} color="#4682B4" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4682B4" />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.summaryCard}>
            <Text style={styles.averageRating}>{averageRating.toFixed(1)}</Text>
            {renderStars(Math.round(averageRating))}
            <Text style={styles.reviewCount}>
              Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {reviews.length === 0 && !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No reviews yet</Text>
            </View>
          ) : (
            reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={20} color="#666" />
                  </View>
                  <View style={styles.reviewInfo}>
                    <Text style={styles.userName}>{review.userName}</Text>
                    <Text style={styles.reviewDate}>{review.date}</Text>
                  </View>
                  {renderStars(review.rating)}
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={showReviewModal}
        onRequestClose={() => {
          setShowReviewModal(false);
          setNewReview({ rating: 0, comment: '' });
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add a Review</Text>
            <View style={styles.modalStarsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => handleStarPress(star)}>
                  <Ionicons
                    name={star <= newReview.rating ? 'star' : 'star-outline'}
                    size={30}
                    color={star <= newReview.rating ? '#FFD700' : '#ccc'}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.modalTextInput}
              placeholder="Enter your review..."
              multiline
              value={newReview.comment}
              onChangeText={(text) => setNewReview((prev) => ({ ...prev, comment: text }))}
            />
            {isLoading ? (
              <ActivityIndicator size="large" color="#4682B4" />
            ) : (
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmitReview}>
                <Text style={styles.submitButtonText}>Submit Review</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowReviewModal(false);
                setNewReview({ rating: 0, comment: '' });
              }}
            >
              <Ionicons name="close-circle" size={30} color="#ccc" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 15,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  addButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0c1a2a',
    flex: 1,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  averageRating: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#0c1a2a',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  reviewCount: {
    fontSize: 14,
    color: '#666',
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reviewInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0c1a2a',
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  reviewComment: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0c1a2a',
    marginBottom: 20,
  },
  modalStarsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  modalTextInput: {
    width: '100%',
    height: 100,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#666',
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#4682B4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
});