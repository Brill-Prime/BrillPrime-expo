import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Platform,
  Dimensions,
  Image,
  Modal,
  TextInput
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { Svg, Path } from 'react-native-svg';
import ErrorBoundary from '../../components/ErrorBoundary';

const { width } = Dimensions.get('window');

// ...existing code...

// Mock communication modal component
type CommModalProps = {
  visible: boolean;
  onClose: () => void;
  contactName?: string;
  contactPhone?: string;
  contactRole?: string;
  onChatPress?: () => void;
};

const CommunicationModal = ({ visible, onClose, contactName, contactPhone, contactRole, onChatPress }: CommModalProps) => {
  const handleCall = () => {
    if (!contactPhone) {
      Alert.alert("Error", "Phone number not available");
      return;
    }

    const phoneUrl = `tel:${contactPhone.replace(/[^0-9+]/g, '')}`;
    Linking.canOpenURL(phoneUrl).then((supported) => {
      if (supported) {
        Linking.openURL(phoneUrl);
            } else {
                Alert.alert("Error", "Phone calling is not supported on this device");
              }
            }).catch(() => {
              Alert.alert("Error", "Unable to make phone call");
            });
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Contact {contactName}</Text>

          <TouchableOpacity style={styles.modalButton} onPress={handleCall}>
            <Ionicons name="call" size={24} color="#4682B4" />
            <Text style={styles.modalButtonText}>Call ({contactPhone || 'N/A'})</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.modalButton} onPress={onChatPress}>
            <Ionicons name="chatbubble-outline" size={24} color="#4682B4" />
            <Text style={styles.modalButtonText}>Chat via In-App</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};


export default function MerchantDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [merchant, setMerchant] = useState<any>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);
  const merchantId = id; // Assign id to merchantId for clarity in the reviews button onPress

  useEffect(() => {
    if (!id) return;
    setMerchant(null);
    
    // Import and use merchantService
    import('../../services/merchantService').then(({ merchantService }) => {
      merchantService.getMerchantById(id)
        .then((merchant: any) => {
          if (merchant) {
            setMerchant(merchant);
          } else {
            Alert.alert("Error", "Merchant not found", [
              { text: "Go Back", onPress: () => router.back() }
            ]);
          }
        })
        .catch(() => {
          Alert.alert("Error", "Merchant not found", [
            { text: "Go Back", onPress: () => router.back() }
          ]);
        });
    });
  }, [id]);

  if (!merchant) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="business-outline" size={64} color="#ccc" />
        <Text style={styles.loadingText}>Loading merchant details...</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCall = () => {
    if (!merchant.phone) {
      Alert.alert("Error", "Phone number not available");
      return;
    }

    Alert.alert(
      "Call Merchant",
      `Would you like to call ${merchant.name}?\n${merchant.phone}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Call Now",
          onPress: () => {
            const phoneUrl = `tel:${merchant.phone.replace(/[^0-9+]/g, '')}`;
            Linking.canOpenURL(phoneUrl).then((supported) => {
              if (supported) {
                Linking.openURL(phoneUrl);
              } else {
                Alert.alert("Error", "Phone calling is not supported on this device");
                }
              }).catch(() => {
                Alert.alert("Error", "Unable to make phone call");
              });
          }
        }
      ]
    );
  };

  const handleEmail = () => {
    if (!merchant.email) {
      Alert.alert("Error", "Email address not available");
      return;
    }

    const emailUrl = `mailto:${merchant.email}?subject=Inquiry about ${merchant.name}&body=Hello, I would like to inquire about your services.`;
    Linking.canOpenURL(emailUrl).then((supported) => {
      if (supported) {
        Linking.openURL(emailUrl);
      } else {
        Alert.alert("Error", "Email client is not available on this device");
      }
    }).catch(() => {
      Alert.Alert.alert("Error", "Unable to open email client");
    });
  };

  const handleDirections = () => {
    if (!merchant.address) {
      Alert.alert("Error", "Address not available");
      return;
    }

    const address = encodeURIComponent(merchant.address);
    const mapsUrl = Platform.OS === 'ios'
      ? `http://maps.apple.com/?daddr=${address}`
      : `https://www.google.com/maps/dir/?api=1&destination=${address}`;

    Linking.canOpenURL(mapsUrl).then((supported) => {
      if (supported) {
        Linking.openURL(mapsUrl);
      } else {
        Alert.alert("Error", "Maps application is not available on this device");
      }
    }).catch(() => {
      Alert.alert("Error", "Unable to open maps application");
    });
  };

  const getCurrentDay = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()];
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "fuel": return "car";
      case "market": return "basket";
      case "shopping": return "storefront";
      case "electronics": return "phone-portrait";
      default: return "business";
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Ionicons key={i} name="star" size={16} color="#FFD700" />);
    }

    if (hasHalfStar) {
      stars.push(<Ionicons key="half" name="star-half" size={16} color="#FFD700" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Ionicons key={`empty-${i}`} name="star-outline" size={16} color="#FFD700" />);
    }

    return stars;
  };

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <Path
              d="M20 11H7.414L13.707 4.707L12.293 3.293L4.586 11L4 11.586L4.586 12.172L12.293 19.879L13.707 18.465L7.414 12.172H20V11Z"
              fill="#333"
            />
          </Svg>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{merchant.name}</Text>
          <Text style={styles.headerSubtitle}>{merchant.distance} away</Text>
        </View>
        <View style={styles.statusIndicator}>
          <View style={[styles.statusDot, { backgroundColor: merchant.isOpen ? '#4CAF50' : '#f44336' }]} />
          <Text style={[styles.statusText, { color: merchant.isOpen ? '#4CAF50' : '#f44336' }]}>
            {merchant.isOpen ? 'Open' : 'Closed'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {merchant.images.map((image: string, index: number) => (
              <TouchableOpacity key={index} style={styles.imageWrapper} onPress={() => setSelectedImageIndex(index)}>
                <Image
                  source={{ uri: image }}
                  style={styles.merchantImage}
                  defaultSource={require('../../assets/images/logo.png')}
                />
                <View style={styles.imageOverlay}>
                  <Ionicons name={getIconForType(merchant.type)} size={32} color="rgba(255,255,255,0.8)" />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {merchant.images.length > 1 && (
            <View style={styles.imageIndicators}>
              {merchant.images.map((_: string, index: number) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    selectedImageIndex === index && styles.activeIndicator
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.merchantName}>{merchant.name}</Text>
          <Text style={styles.merchantDescription}>{merchant.description}</Text>

          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>
              {renderStars(merchant.rating)}
            </View>
            <Text style={styles.ratingText}>{merchant.rating}/5.0 ({merchant.reviewCount} reviews)</Text>
          </View>
        </View>

        {/* Contact & Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact & Location</Text>

          <View style={styles.infoRow}>
            <Ionicons name="location" size={20} color="#4682B4" />
            <Text style={styles.infoText}>{merchant.address}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call" size={20} color="#4682B4" />
            <Text style={styles.infoText}>{merchant.phone}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="mail" size={20} color="#4682B4" />
            <Text style={styles.infoText}>{merchant.email}</Text>
          </View>
        </View>

        {/* Operating Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Operating Hours</Text>
          {merchant.operatingHours && Object.entries(merchant.operatingHours).map(([day, hours]) => (
            <View key={day} style={[styles.hoursRow, day === getCurrentDay() && styles.todayRow]}>
              <Text style={[styles.dayText, day === getCurrentDay() && styles.todayText]}>
                {day.charAt(0).toUpperCase() + day.slice(1)}
              </Text>
              <Text style={[styles.hoursText, day === getCurrentDay() && styles.todayText]}>
                {String(hours)}
              </Text>
            </View>
          ))}
        </View>

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.servicesContainer}>
            {merchant.services.map((service: string, index: number) => (
              <View key={index} style={styles.serviceTag}>
                <Text style={styles.serviceText}>{service}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Available Commodities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Items</Text>
          {merchant.commodities.map((commodity: any, index: number) => (
            <View key={index} style={styles.commodityRow}>
              <View style={styles.commodityInfo}>
                <Text style={styles.commodityName}>{commodity.name}</Text>
                <Text style={styles.commodityPrice}>{commodity.price}</Text>
              </View>
              <View style={[
                styles.availabilityTag,
                { backgroundColor: commodity.availability === 'In Stock' ? '#e8f5e8' : '#fff3e0' }
              ]}>
                <Text style={[
                  styles.availabilityText,
                  { color: commodity.availability === 'In Stock' ? '#4CAF50' : '#FF9800' }
                ]}>
                  {commodity.availability}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Customer Reviews */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Reviews</Text>
          {merchant.reviews && merchant.reviews.length > 0 ? (
            merchant.reviews.map((review: any, index: number) => (
              <View key={index} style={styles.reviewRow}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>{review.name}</Text>
                  <View style={styles.reviewStars}>
                    {renderStars(review.rating)}
                  </View>
                </View>
                <Text style={styles.reviewText}>{review.comment}</Text>
                <Text style={styles.reviewDate}>{review.date}</Text>
              </View>
            ))
          ) : (
            <View style={styles.noReviewsContainer}>
              <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
              <Text style={styles.noReviewsText}>No reviews yet</Text>
              <Text style={styles.noReviewsSubtext}>Be the first to leave a review!</Text>
            </View>
          )}
          {merchant.reviews && merchant.reviews.length > 0 && (
            <TouchableOpacity
              style={styles.viewAllReviewsButton}
              onPress={() => router.push(`/merchant/${merchantId}/reviews`)}
            >
              <Text style={styles.viewAllReviewsText}>View All {merchant.reviewCount || merchant.reviews.length} Reviews</Text>
              <Ionicons name="chevron-forward" size={16} color="#4682B4" />
            </TouchableOpacity>
          )}
        </View>

        {/* Spacer for bottom actions */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
          <Ionicons name="call" size={20} color="#4682B4" />
          <Text style={styles.actionText}>Call</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleEmail}>
          <Ionicons name="mail" size={20} color="#4682B4" />
          <Text style={styles.actionText}>Email</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.primaryAction]} onPress={handleDirections}>
          <Ionicons name="navigate" size={20} color="white" />
          <Text style={[styles.actionText, styles.primaryActionText]}>Directions</Text>
        </TouchableOpacity>
      </View>
      </View>
    </ErrorBoundary>
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
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusIndicator: {
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    height: 200,
    backgroundColor: 'white',
  },
  imageWrapper: {
    width: width,
    height: 200,
    position: 'relative',
  },
  merchantImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f7ff',
  },
  imageOverlay: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 8,
    borderRadius: 20,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  activeIndicator: {
    backgroundColor: 'white',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  merchantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  merchantDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 15,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  todayRow: {
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 10,
    borderRadius: 5,
    borderBottomColor: 'transparent',
  },
  dayText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  todayText: {
    color: '#4682B4',
    fontWeight: '600',
  },
  hoursText: {
    fontSize: 15,
    color: '#666',
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceTag: {
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#4682B4',
  },
  serviceText: {
    fontSize: 14,
    color: '#4682B4',
    fontWeight: '500',
  },
  commodityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commodityInfo: {
    flex: 1,
  },
  commodityName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  commodityPrice: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 2,
  },
  availabilityTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bottomActions: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4682B4',
    backgroundColor: 'white',
  },
  primaryAction: {
    backgroundColor: '#4682B4',
    borderColor: '#4682B4',
  },
  actionText: {
    fontSize: 16,
    color: '#4682B4',
    fontWeight: '500',
    marginLeft: 6,
  },
  primaryActionText: {
    color: 'white',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 20,
  },
  retryButton: {
    backgroundColor: '#4682B4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  reviewRow: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  reviewStars: {
    flexDirection: 'row',
  },
  reviewText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  noReviewsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noReviewsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginTop: 15,
  },
  noReviewsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  viewAllReviewsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  viewAllReviewsText: {
    fontSize: 14,
    color: '#4682B4',
    fontWeight: '500',
    marginRight: 6,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 15,
    width: '100%',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4682B4',
  },
  modalButtonText: {
    fontSize: 16,
    color: '#4682B4',
    fontWeight: '500',
    marginLeft: 10,
  },
  closeButton: {
    marginTop: 10,
    padding: 10,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});