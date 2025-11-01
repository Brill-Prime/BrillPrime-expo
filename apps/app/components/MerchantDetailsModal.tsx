import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

interface StoreLocation {
  id?: string;
  title: string;
  address: string;
  coords: { lat: number; lng: number };
  distance?: number;
  rating?: number;
  isOpen?: boolean;
  category?: string;
  phone?: string;
  description?: string;
}

interface MerchantDetailsModalProps {
  visible: boolean;
  merchant: StoreLocation | null;
  onClose: () => void;
  onOrderNow: () => void;
  onGetDirections: () => void;
}

const MerchantDetailsModal: React.FC<MerchantDetailsModalProps> = ({
  visible,
  merchant,
  onClose,
  onOrderNow,
  onGetDirections,
}) => {
  const router = useRouter();

  if (!merchant) return null;

  const handleOrderNow = () => {
    if (merchant.id) {
      router.push({
        pathname: '/merchant/[id]',
        params: { id: merchant.id }
      });
    }
    onOrderNow();
  };

  const handleGetDirections = () => {
    const { lat, lng } = merchant.coords;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    // In a real app, use Linking.openURL(url)
    console.log('Opening directions:', url);
    onGetDirections();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.merchantDetailsModal}>
          <View style={styles.merchantDetailsHeader}>
            <View style={styles.merchantDetailsTitleRow}>
              <Text style={styles.merchantDetailsTitle} numberOfLines={1}>
                {merchant.title}
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                {/* Add close icon */}
              </TouchableOpacity>
            </View>
            <View style={styles.merchantDetailsMeta}>
              <View style={styles.statusBadge}>
                <View style={[
                  styles.statusIndicator,
                  { backgroundColor: merchant.isOpen ? '#00C853' : '#e74c3c' }
                ]} />
                <Text style={styles.statusText}>
                  {merchant.isOpen ? 'Open' : 'Closed'}
                </Text>
              </View>
              <View style={styles.ratingContainer}>
                {/* Add star icons for rating */}
                <Text style={styles.ratingText}>
                  {merchant.rating ? `${merchant.rating} ★` : 'No rating'}
                </Text>
              </View>
            </View>
          </View>
          <ScrollView style={styles.merchantDetailsContent}>
            <View style={styles.merchantDetailsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Location</Text>
              </View>
              <Text style={styles.merchantAddress}>{merchant.address}</Text>
              {merchant.distance && (
                <Text style={styles.merchantDistance}>
                  {merchant.distance.toFixed(1)} km away
                </Text>
              )}
            </View>
            {merchant.category && (
              <View style={styles.merchantDetailsSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Category</Text>
                </View>
                <Text style={styles.merchantCategory}>{merchant.category}</Text>
              </View>
            )}
            {merchant.phone && (
              <View style={styles.merchantDetailsSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Contact</Text>
                </View>
                <Text style={styles.merchantPhone}>{merchant.phone}</Text>
              </View>
            )}
            {merchant.description && (
              <View style={styles.merchantDetailsSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>About</Text>
                </View>
                <Text style={styles.merchantDescription}>{merchant.description}</Text>
              </View>
            )}
          </ScrollView>
          <View style={styles.merchantDetailsActions}>
            <TouchableOpacity
              style={[styles.merchantActionButton, styles.directionsButton]}
              onPress={handleGetDirections}
            >
              <Text style={styles.directionsButtonText}>Get Directions</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.merchantActionButton, styles.orderButton]}
              onPress={handleOrderNow}
            >
              <Text style={styles.orderButtonText}>Order Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  merchantDetailsModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  merchantDetailsHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  merchantDetailsTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  merchantDetailsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  merchantDetailsMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  merchantDetailsContent: {
    flex: 1,
    padding: 20,
  },
  merchantDetailsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  merchantAddress: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  merchantDistance: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  merchantCategory: {
    fontSize: 14,
    color: '#333',
  },
  merchantPhone: {
    fontSize: 14,
    color: '#4682B4',
  },
  merchantDescription: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  merchantDetailsActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  merchantActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  directionsButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4682B4',
  },
  directionsButtonText: {
    color: '#4682B4',
    fontSize: 16,
    fontWeight: '500',
  },
  orderButton: {
    backgroundColor: '#4682B4',
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default MerchantDetailsModal;
