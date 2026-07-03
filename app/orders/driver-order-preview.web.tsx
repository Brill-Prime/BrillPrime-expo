import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Web version - no map rendering
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

  // Map rendering not available on web
  const renderRouteMap = () => null;

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
                  <Text style={styles.statLabel}>Distance</Text>
                  <Text style={styles.statValue}>{order?.distance || 'N/A'} km</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Estimated Time</Text>
                  <Text style={styles.statValue}>{order?.estimatedTime || 'N/A'}</Text>
                </View>
              </View>

              {renderRouteMap()}
            </View>

            {/* Customer Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Customer Information</Text>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={20} color="#4682B4" />
                <Text style={styles.infoText}>{order?.customerName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={20} color="#4682B4" />
                <TouchableOpacity onPress={() => Alert.alert('Call', order?.customerPhone)}>
                  <Text style={styles.infoText}>{order?.customerPhone}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.rejectButton} onPress={onReject}>
                <Ionicons name="close-circle" size={24} color="white" />
                <Text style={styles.buttonText}>Reject Order</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
                <Ionicons name="checkmark-circle" size={24} color="white" />
                <Text style={styles.buttonText}>Accept Order</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
    maxHeight: '90%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: responsivePadding,
    paddingVertical: responsivePadding,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: responsiveFontSize.large,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    paddingHorizontal: responsivePadding,
    paddingVertical: responsivePadding,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: responsiveFontSize.medium,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: responsiveFontSize.small,
    marginLeft: 8,
    color: '#666',
    flex: 1,
  },
  earningsCard: {
    backgroundColor: '#4682B4',
    borderRadius: 12,
    paddingHorizontal: responsivePadding,
    paddingVertical: responsivePadding,
    marginBottom: 16,
  },
  earningsLabel: {
    color: 'white',
    fontSize: responsiveFontSize.small,
    opacity: 0.8,
    marginBottom: 4,
  },
  earningsAmount: {
    color: 'white',
    fontSize: responsiveFontSize.large,
    fontWeight: 'bold',
  },
  routeInfo: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: responsivePadding,
    marginBottom: 12,
  },
  routePoint: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  routeDetails: {
    marginLeft: 12,
    flex: 1,
  },
  routeLabel: {
    fontSize: responsiveFontSize.small,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  routeAddress: {
    fontSize: responsiveFontSize.small,
    color: '#666',
  },
  routeLine: {
    height: 16,
    borderLeftWidth: 2,
    borderLeftColor: '#4682B4',
    marginLeft: 9,
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
  },
  statLabel: {
    fontSize: responsiveFontSize.small,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: responsiveFontSize.medium,
    fontWeight: '600',
    color: '#333',
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    marginTop: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: responsivePadding,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#28a745',
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#dc3545',
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: responsiveFontSize.small,
  },
});
