import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert, // Import Alert for showing alerts
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';

// Assuming responsiveFontSize and responsivePadding are defined elsewhere or you'll define them
// For now, let's use arbitrary values or mock them if not provided.
// const responsiveFontSize = { small: 12, medium: 16, large: 20 };
// const responsivePadding = 15;

// Mocking responsiveFontSize and responsivePadding for demonstration
const responsiveFontSize = {
  small: 12,
  medium: 16,
  large: 20,
};
const responsivePadding = 15;


interface DriverOrderPreviewProps {
  visible: boolean;
  onClose: () => void;
  order: any;
  onAccept: () => void;
  onReject: () => void;
}

export default function DriverOrderPreview({
  visible,
  onClose,
  order,
  onAccept,
  onReject,
}: DriverOrderPreviewProps) {
  const [showMap, setShowMap] = useState(false);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Order Details</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Earnings Highlight */}
            <View style={styles.earningsCard}>
              <Text style={styles.earningsLabel}>Your Earnings</Text>
              <Text style={styles.earningsAmount}>₦{order?.earnings?.toLocaleString()}</Text>
            </View>

            {/* Order Summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order Summary</Text>
              <View style={styles.infoRow}>
                <Ionicons name="cube-outline" size={20} color="#4682B4" />
                <Text style={styles.infoText}>{order?.items?.join(', ')}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="cash-outline" size={20} color="#4682B4" />
                <Text style={styles.infoText}>₦{order?.totalAmount?.toLocaleString()}</Text>
              </View>
            </View>

            {/* Route Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Route Information</Text>
              <View style={styles.routeInfo}>
                <View style={styles.routePoint}>
                  <Ionicons name="location" size={20} color="#28a745" />
                  <View style={styles.routeDetails}>
                    <Text style={styles.routeLabel}>Pickup</Text>
                    <Text style={styles.routeAddress}>{order?.pickupAddress}</Text>
                  </View>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routePoint}>
                  <Ionicons name="location" size={20} color="#dc3545" />
                  <View style={styles.routeDetails}>
                    <Text style={styles.routeLabel}>Delivery</Text>
                    <Text style={styles.routeAddress}>{order?.deliveryAddress}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{order?.distance}</Text>
                  <Text style={styles.statLabel}>Distance</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{order?.estimatedDuration}</Text>
                  <Text style={styles.statLabel}>Est. Time</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.viewMapButton}
                onPress={() => setShowMap(!showMap)}
              >
                <Ionicons name="map-outline" size={18} color="#4682B4" />
                <Text style={styles.viewMapText}>
                  {showMap ? 'Hide Map' : 'View Route on Map'}
                </Text>
              </TouchableOpacity>

              {showMap && (
                <View style={styles.mapContainer}>
                  <Text style={styles.mapPlaceholder}>Map View Coming Soon</Text>
                </View>
              )}
            </View>

            {/* Customer Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Customer Information</Text>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={20} color="#4682B4" />
                <Text style={styles.infoText}>{order?.customerName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={20} color="#4682B4" />
                <Text style={styles.infoText}>{order?.customerPhone}</Text>
              </View>
            </View>

            {/* Contact Section */}
            <View style={[styles.contactSection, { marginHorizontal: responsivePadding }]}>
              <Text style={[styles.sectionTitle, { fontSize: responsiveFontSize.medium }]}>Quick Contact</Text>
              <View style={styles.contactButtons}>
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => Alert.alert('Call Merchant', 'Calling merchant...')}
                >
                  <Ionicons name="call" size={20} color="#fff" />
                  <Text style={styles.contactButtonText}>Call Merchant</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => Alert.alert('Call Customer', 'Calling customer...')}
                >
                  <Ionicons name="call" size={20} color="#fff" />
                  <Text style={styles.contactButtonText}>Call Customer</Text>
                </TouchableOpacity>
              </View>
            </View>

          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.rejectButton} onPress={onReject}>
              <Text style={styles.rejectText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
              <Text style={styles.acceptText}>Accept Order</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1B1F',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  earningsCard: {
    backgroundColor: '#4682B4',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  earningsLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  earningsAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1B1F',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  routeInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  routePoint: {
    flexDirection: 'row',
    gap: 12,
  },
  routeDetails: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  routeAddress: {
    fontSize: 14,
    color: '#1C1B1F',
    fontWeight: '500',
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#4682B4',
    marginLeft: 9,
    marginVertical: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4682B4',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  viewMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#4682B4',
    borderRadius: 8,
  },
  viewMapText: {
    fontSize: 14,
    color: '#4682B4',
    fontWeight: '500',
  },
  mapContainer: {
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholder: {
    color: '#999',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  rejectButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  rejectText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc3545',
  },
  acceptButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    backgroundColor: '#4682B4',
  },
  acceptText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Styles for contact section
  contactSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4682B4',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});